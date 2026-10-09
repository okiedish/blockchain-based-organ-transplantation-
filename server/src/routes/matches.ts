import { Router } from 'express';
import Match from '../models/Match.js';
import RecipientRequest from '../models/RecipientRequest.js';
import { auth, requireVerified, roles } from '../middleware/auth.js';
import { HttpError, ok } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { anchorRecord } from '../services/blockchainService.js';
import { donorEligibility } from '../services/eligibility.js';

const r = Router();
r.use(auth);

const firstName = (n?: string) => (n || '').split(' ')[0];

// Role-scoped view. Donors never see recipient identity; recipients only see donors who accepted,
// and only first name, city and blood group.
r.get('/', async (req, res) => {
  const u = req.user!;
  const filter: Record<string, unknown> = {};
  if (u.role === 'donor') filter.donorId = u._id;
  else if (u.role === 'recipient') {
    filter.recipientId = u._id;
    filter.status = { $in: ['ACCEPTED', 'COMPLETED'] };
  }
  if (typeof req.query.status === 'string' && u.role !== 'recipient') filter.status = req.query.status;
  const matches = await Match.find(filter).sort({ updatedAt: -1 }).limit(200).populate('requestId').populate('donorId', 'name bloodGroup location').populate('recipientId', 'name');

  const data = matches.map((m: any) => {
    const reqDoc = m.requestId;
    const base = {
      id: m._id, status: m.status, score: m.score, respondedAt: m.respondedAt, createdAt: m.createdAt,
      request: reqDoc && { id: reqDoc._id, bloodGroup: reqDoc.bloodGroup, units: reqDoc.units, urgency: reqDoc.urgency, hospital: reqDoc.hospital, location: reqDoc.location, neededBy: reqDoc.neededBy, status: reqDoc.status },
    };
    if (u.role === 'donor') return base;
    const donor = { name: u.role === 'recipient' ? firstName(m.donorId?.name) : m.donorId?.name, bloodGroup: m.donorId?.bloodGroup, city: m.donorId?.location?.city };
    return { ...base, donor, ...(u.role !== 'recipient' ? { recipient: { name: m.recipientId?.name } } : {}) };
  });
  ok(res, { matches: data });
});

async function loadOwnOffer(req: any) {
  const m = await Match.findById(req.params.id);
  if (!m || String(m.donorId) !== String(req.user._id)) throw new HttpError(404, 'NOT_FOUND', 'Offer not found');
  if (m.status !== 'OFFERED') throw new HttpError(409, 'NOT_OFFERED', `This offer is already ${m.status}`);
  return m;
}

r.post('/:id/accept', roles('donor'), requireVerified, async (req, res) => {
  const m = await loadOwnOffer(req);
  const u = req.user!;
  const request = await RecipientRequest.findById(m.requestId);
  if (!request || !['OPEN', 'MATCHED'].includes(request.status)) throw new HttpError(409, 'REQUEST_CLOSED', 'This request is no longer open');
  if (!u.available) throw new HttpError(409, 'UNAVAILABLE', 'Set yourself as available before accepting');
  const elig = donorEligibility({ dateOfBirth: u.dateOfBirth, lastDonationAt: u.lastDonationAt });
  if (!elig.eligible) throw new HttpError(409, 'NOT_ELIGIBLE', elig.reasons.join('; '));
  const accepted = await Match.countDocuments({ requestId: request._id, status: { $in: ['ACCEPTED', 'COMPLETED'] } });
  if (accepted >= request.units) throw new HttpError(409, 'ENOUGH_DONORS', 'Enough donors have already accepted this request');

  m.status = 'ACCEPTED';
  m.respondedAt = new Date();
  await m.save();
  request.status = 'MATCHED';
  await request.save();
  await audit(u, 'DONOR_ACCEPTED', 'Match', m._id, { requestId: String(request._id) }, req);
  await audit(u, 'MATCH_CREATED', 'Match', m._id, { requestId: String(request._id) }, req);
  const chain = await anchorRecord('MATCH', String(m._id));
  ok(res, { match: m, blockchain: chain && chain.toObject() });
});

r.post('/:id/decline', roles('donor'), async (req, res) => {
  const m = await loadOwnOffer(req);
  m.status = 'DECLINED';
  m.respondedAt = new Date();
  await m.save();
  await audit(req.user, 'DONOR_DECLINED', 'Match', m._id, { requestId: String(m.requestId) }, req);
  ok(res, { match: m });
});

export default r;
