// REAL local-chain integration test. Requires, in order:
//   1) cd blockchain && npm run node          (local Hardhat chain)
//   2) cd blockchain && npm run deploy        (writes BLOCKCHAIN_CONTRACT_ADDRESS + ABI)
//   3) BLOCKCHAIN_PRIVATE_KEY set in server/.env to the first Hardhat account
// It is skipped automatically when those are missing.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import 'dotenv/config';
import { app, startDb, stopDb, createStaff, registerUser, verifyUser, aadhaar } from './helpers.js';
import { blockchainStatus, getRecord, verifyAgainstChain } from '../src/services/blockchainService.js';
import Donation from '../src/models/Donation.js';
import BlockchainRecord from '../src/models/BlockchainRecord.js';

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
let ready = false;

before(async () => {
  await startDb();
  const s = await blockchainStatus();
  ready = Boolean(s.connected && s.contractDeployed && s.signerConfigured);
});
after(stopDb);

test('donation is anchored on a real chain: tx hash, receipt, event, on-chain read, tamper detection', async (t) => {
  if (!ready) return t.skip('local chain / contract / signer not available');
  const admin = await createStaff('admin', 'chain-admin@x.com');
  const hospital = await createStaff('hospital', 'chain-hosp@x.com');
  const donor = await registerUser('donor', 'chain-d@x.com', 'O-');
  const rec = await registerUser('recipient', 'chain-r@x.com', 'AB+');
  const v = await verifyUser(donor.token, admin.token, donor.user._id, aadhaar('89012345678'), 'Test donor');
  assert.equal(v.rev.body.data.blockchain.status, 'CONFIRMED');
  await verifyUser(rec.token, admin.token, rec.user._id, aadhaar('90123456789'), 'Test recipient');

  await request(app).post('/api/requests').set(auth(rec.token)).send({ bloodGroup: 'AB+', units: 1, urgency: 4, hospital: 'H', location: { state: 'Karnataka', city: 'Bengaluru' } });
  const [offer] = (await request(app).get('/api/matches').set(auth(donor.token))).body.data.matches;
  const acc = await request(app).post(`/api/matches/${offer.id}/accept`).set(auth(donor.token));
  assert.equal(acc.body.data.blockchain.status, 'CONFIRMED');

  const done = await request(app).post(`/api/donations/${offer.id}/complete`).set(auth(hospital.token));
  const chain = done.body.data.blockchain;
  assert.equal(chain.status, 'CONFIRMED');
  assert.match(chain.transactionHash, /^0x[0-9a-f]{64}$/);
  assert.ok(chain.blockNumber >= 0);

  const onChain = await getRecord(chain.recordId);
  assert.equal(onChain.recordHash, chain.recordHash);
  assert.equal(onChain.recordType, 'DONATION');

  const ok = await verifyAgainstChain(chain._id);
  assert.equal(ok.verified, true);

  // Tamper with the database after anchoring: verification must now fail.
  await Donation.updateOne({ _id: done.body.data.donation._id }, { units: 9 });
  const bad = await verifyAgainstChain(chain._id);
  assert.equal(bad.databaseMatchesAnchor, false);
  assert.equal(bad.verified, false);

  // Anchoring twice must not create a second transaction.
  const again = await BlockchainRecord.countDocuments({ recordType: 'DONATION', referenceId: done.body.data.donation._id });
  assert.equal(again, 1);
});
