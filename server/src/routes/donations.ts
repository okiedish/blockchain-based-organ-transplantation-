import { Router } from 'express';
import Donation from '../models/Donation.js';
import Match from '../models/Match.js';
import RecipientRequest from '../models/RecipientRequest.js';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';
import { HttpError, ok } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { anchorRecord } from '../services/blockchainService.js';

const r = Router();
r.use(auth);

// A hospital (or admin) confirms that an accepted donor actually donated.
r.post('/:matchId/complete', roles('hospital', 'admin'), async (req, res) => {
  const m = await Match.findById(req.params.matchId);
  if (!m) throw new HttpError(404, 'NOT_FOUND', 'Match not found');
  if (m.status !== 'ACCEPTED') throw new HttpError(409, 'NOT_ACCEPTED', `Only ACCEPTED matches can be completed (this one is ${m.status})`);
  const [request, donor] = await Promise.all([RecipientRequest.findById(m.requestId), User.findById(m.donorId)]);
  if (!request || !donor) throw new HttpError(404, 'NOT_FOUND', 'Request or donor missing');

  const donation = await Donation.create({
    matchId: m._id, requestId: request._id, donorId: donor._id, recipientId: request.recipientId,
    bloodGroup: donor.bloodGroup, units: 1, hospital: request.hospital, completedBy: req.user!._id, completedAt: new Date(),
  });
  m.status = 'COMPLETED';
  await m.save();
  donor.lastDonationAt = donation.completedAt;
  await donor.save();
  request.unitsFulfilled += 1;
  if (request.unitsFulfilled >= request.units) {
    request.status = 'FULFILLED';
    await Match.updateMany({ requestId: request._id, status: 'OFFERED' }, { status: 'EXPIRED' });
  }
  await request.save();
  await audit(req.user, 'DONATION_COMPLETED', 'Donation', donation._id, { requestId: String(request._id) }, req);

  // The donation is already saved. Anchoring may be CONFIRMED, PENDING or FAILED; none of those undo it.
  const chain = await anchorRecord('DONATION', String(donation._id));
  ok(res, { donation, request, blockchain: chain && chain.toObject() }, 201);
});

r.get('/', async (req, res) => {
  const u = req.user!;
  const filter = u.role === 'donor' ? { donorId: u._id } : u.role === 'recipient' ? { recipientId: u._id } : {};
  const donations = await Donation.find(filter).sort({ completedAt: -1 }).limit(200).populate('donorId', 'name').populate('recipientId', 'name');
  ok(res, {
    donations: donations.map((d: any) => ({
      id: d._id, requestId: d.requestId, bloodGroup: d.bloodGroup, units: d.units, hospital: d.hospital, completedAt: d.completedAt, status: d.status,
      // donors and recipients only see the other party's first name
      donor: u.role === 'recipient' ? { name: (d.donorId?.name || '').split(' ')[0] } : { name: d.donorId?.name },
      recipient: u.role === 'donor' ? undefined : { name: u.role === 'recipient' ? undefined : d.recipientId?.name },
    })),
  });
});

export default r;
