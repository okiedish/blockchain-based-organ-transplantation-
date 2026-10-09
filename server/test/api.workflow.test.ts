// Needs: npm install (supertest, mongodb-memory-server). Blockchain env is intentionally NOT set,
// so anchoring must end FAILED with a clear message while every application step still succeeds.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app, startDb, stopDb, createStaff, registerUser, verifyUser, aadhaar } from './helpers.js';

before(startDb);
after(stopDb);

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

test('registration validates input and never returns the password hash', async () => {
  const bad = await registerUser('donor', 'bad@x.com', 'O+');
  assert.equal(bad.status, 201);
  assert.equal(bad.user.passwordHash, undefined);
  const weak = await request(app).post('/api/auth/register').send({ role: 'donor', name: 'Weak', email: 'w@x.com', password: 'short', bloodGroup: 'O+', consent: true, location: { state: 'KA', city: 'Bengaluru' } });
  assert.equal(weak.status, 400);
  const adminRole = await request(app).post('/api/auth/register').send({ role: 'admin', name: 'Evil', email: 'e@x.com', password: 'Passw0rd!', bloodGroup: 'O+', consent: true, location: { state: 'KA', city: 'Bengaluru' } });
  assert.equal(adminRole.status, 400, 'self-registration as admin must be rejected');
  const dup = await registerUser('donor', 'bad@x.com', 'O+');
  assert.equal(dup.status, 409);
});

test('login, protected routes and RBAC', async () => {
  const d = await registerUser('donor', 'rbac-donor@x.com', 'O+');
  assert.equal((await request(app).get('/api/users/me')).status, 401);
  assert.equal((await request(app).get('/api/users/me').set(auth(d.token))).status, 200);
  assert.equal((await request(app).get('/api/audit').set(auth(d.token))).status, 403);
  assert.equal((await request(app).get('/api/verification/pending').set(auth(d.token))).status, 403);
  assert.equal((await request(app).post('/api/auth/login').send({ email: 'rbac-donor@x.com', password: 'wrong-pass1' })).status, 401);
});

test('unverified users cannot create requests or accept offers', async () => {
  const r = await registerUser('recipient', 'unver-r@x.com', 'A+');
  const res = await request(app).post('/api/requests').set(auth(r.token)).send({ bloodGroup: 'A+', units: 1, urgency: 3, hospital: 'City Hospital', location: { state: 'Karnataka', city: 'Bengaluru' } });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'NOT_VERIFIED');
});

test('identity verification: malformed Aadhaar rejected, duplicate identity blocked, admin approves', async () => {
  const admin = await createStaff('admin', 'admin-v@x.com');
  const a = await registerUser('donor', 'ver-a@x.com', 'O+');
  const b = await registerUser('donor', 'ver-b@x.com', 'O+');
  const bad = await request(app).post('/api/verification/submit').set(auth(a.token)).send({ aadhaarNumber: '234567890123', document: { fileName: 'x.png', dataUrl: 'data:image/png;base64,AAAA' }, extracted: { name: 'Test donor', dateOfBirth: '1995-05-05' }, confirmed: true });
  assert.equal(bad.status, 400);
  const num = aadhaar('23456789012');
  const { sub, rev } = await verifyUser(a.token, admin.token, a.user._id, num, 'Test donor');
  assert.equal(sub.status, 200);
  assert.equal(sub.body.data.verification.status, 'REQUIRES_REVIEW');
  assert.equal(sub.body.data.verification.aadhaarLookupHash, undefined);
  assert.equal(rev.body.data.user.verification.status, 'VERIFIED');
  assert.ok(rev.body.data.blockchain, 'verification approval creates a BlockchainRecord');
  const dup = await request(app).post('/api/verification/submit').set(auth(b.token)).send({ aadhaarNumber: num, document: { fileName: 'id.png', dataUrl: (await import('./helpers.js')).pngDataUrl }, extracted: { name: 'Test donor', dateOfBirth: '1995-05-05' }, confirmed: true });
  assert.equal(dup.status, 409);
});

test('end-to-end: request -> compatible donor -> accept -> donation -> database + blockchain record', async () => {
  const admin = await createStaff('admin', 'admin-e2e@x.com');
  const hospital = await createStaff('hospital', 'hosp-e2e@x.com');
  const incompatible = await registerUser('donor', 'inc@x.com', 'B+'); // B+ cannot give to A-
  const compatible = await registerUser('donor', 'e2e-donor@x.com', 'O-'); // universal donor
  const recipient = await registerUser('recipient', 'e2e-rec@x.com', 'A-');
  await verifyUser(incompatible.token, admin.token, incompatible.user._id, aadhaar('34567890123'), 'Test donor');
  await verifyUser(compatible.token, admin.token, compatible.user._id, aadhaar('45678901234'), 'Test donor');
  await verifyUser(recipient.token, admin.token, recipient.user._id, aadhaar('56789012345'), 'Test recipient');

  const created = await request(app).post('/api/requests').set(auth(recipient.token)).send({ bloodGroup: 'A-', units: 1, urgency: 5, hospital: 'City Hospital', location: { state: 'Karnataka', city: 'Bengaluru' } });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.candidatesFound, 1, 'only the O- donor is compatible');

  assert.equal((await request(app).get('/api/matches').set(auth(incompatible.token))).body.data.matches.length, 0);
  const offers = (await request(app).get('/api/matches').set(auth(compatible.token))).body.data.matches;
  assert.equal(offers.length, 1);
  assert.equal(offers[0].recipient, undefined, 'donor must not see recipient identity');

  const accepted = await request(app).post(`/api/matches/${offers[0].id}/accept`).set(auth(compatible.token));
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.data.match.status, 'ACCEPTED');

  assert.equal((await request(app).post(`/api/donations/${offers[0].id}/complete`).set(auth(compatible.token))).status, 403, 'donors cannot complete donations');
  const done = await request(app).post(`/api/donations/${offers[0].id}/complete`).set(auth(hospital.token));
  assert.equal(done.status, 201);
  assert.equal(done.body.data.request.status, 'FULFILLED');

  // Donation is saved regardless of blockchain state. With no chain configured it must be FAILED, never CONFIRMED.
  const chain = done.body.data.blockchain;
  assert.equal(chain.recordType, 'DONATION');
  assert.notEqual(chain.status, 'CONFIRMED');
  assert.equal(chain.transactionHash, undefined, 'no fake transaction hash');
  assert.match(chain.errorMessage, /not configured/i);

  const history = await request(app).get('/api/donations').set(auth(compatible.token));
  assert.equal(history.body.data.donations.length, 1);

  const mine = await request(app).get('/api/blockchain/records').set(auth(recipient.token));
  assert.ok(mine.body.data.records.some((r: any) => r.recordType === 'DONATION'));
  const stranger = await request(app).get('/api/blockchain/records').set(auth(incompatible.token));
  assert.ok(!stranger.body.data.records.some((r: any) => r.recordType === 'DONATION'), 'unrelated users do not see the record');

  const stats = (await request(app).get('/api/statistics')).body.data;
  assert.equal(stats.totals.completedDonations >= 1, true);
  const log = await request(app).get('/api/audit').set(auth(admin.token));
  const actions = log.body.data.records.map((r: any) => r.action);
  for (const a of ['REGISTER', 'REQUEST_CREATED', 'DONOR_ACCEPTED', 'MATCH_CREATED', 'DONATION_COMPLETED', 'BLOCKCHAIN_FAILED']) assert.ok(actions.includes(a), `audit has ${a}`);
});

test('donor can decline; second accept of a closed offer is rejected', async () => {
  const admin = await createStaff('admin', 'admin-dec@x.com');
  const d = await registerUser('donor', 'dec-d@x.com', 'O+');
  const r = await registerUser('recipient', 'dec-r@x.com', 'O+');
  await verifyUser(d.token, admin.token, d.user._id, aadhaar('67890123456'), 'Test donor');
  await verifyUser(r.token, admin.token, r.user._id, aadhaar('78901234567'), 'Test recipient');
  await request(app).post('/api/requests').set(auth(r.token)).send({ bloodGroup: 'O+', units: 1, urgency: 2, hospital: 'H', location: { state: 'Karnataka', city: 'Bengaluru' } });
  const [offer] = (await request(app).get('/api/matches').set(auth(d.token))).body.data.matches;
  assert.equal((await request(app).post(`/api/matches/${offer.id}/decline`).set(auth(d.token))).status, 200);
  assert.equal((await request(app).post(`/api/matches/${offer.id}/accept`).set(auth(d.token))).status, 409);
});
