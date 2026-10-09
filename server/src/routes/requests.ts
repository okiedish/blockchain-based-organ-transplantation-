import { Router } from 'express';
import { z } from 'zod';
import RecipientRequest from '../models/RecipientRequest.js';
import Match from '../models/Match.js';
import { auth, requireVerified, roles } from '../middleware/auth.js';
import { HttpError, ok, validate } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { runMatching } from '../services/matching.js';
import { BLOOD_GROUPS } from '../services/compatibility.js';

const r = Router();
r.use(auth);

const createSchema = z.object({
  bloodGroup: z.enum(BLOOD_GROUPS),
  units: z.number().int().min(1).max(10),
  urgency: z.number().int().min(1).max(5),
  hospital: z.string().min(2).max(120),
  location: z.object({ state: z.string().min(2), city: z.string().min(2) }),
  neededBy: z.string().refine((s) => !Number.isNaN(Date.parse(s))).optional(),
  notes: z.string().max(500).optional(),
});

r.post('/', roles('recipient'), requireVerified, async (req, res) => {
  const b = validate(createSchema, req.body);
  const request = await RecipientRequest.create({ ...b, neededBy: b.neededBy ? new Date(b.neededBy) : undefined, recipientId: req.user!._id });
  await audit(req.user, 'REQUEST_CREATED', 'RecipientRequest', request._id, { bloodGroup: b.bloodGroup, units: b.units, urgency: b.urgency }, req);
  const found = await runMatching(String(request._id));
  await audit(req.user, 'MATCHING_RUN', 'RecipientRequest', request._id, { candidates: found }, req);
  ok(res, { request: await RecipientRequest.findById(request._id), candidatesFound: found }, 201);
});

r.get('/', roles('recipient', 'admin', 'hospital'), async (req, res) => {
  const filter: Record<string, unknown> = req.user!.role === 'recipient' ? { recipientId: req.user!._id } : {};
  if (typeof req.query.status === 'string') filter.status = req.query.status;
  const requests = await RecipientRequest.find(filter).sort({ createdAt: -1 }).limit(200).populate('recipientId', 'name');
  ok(res, { requests });
});

async function loadOwned(req: any) {
  const request = await RecipientRequest.findById(req.params.id);
  if (!request) throw new HttpError(404, 'NOT_FOUND', 'Request not found');
  const privileged = ['admin', 'hospital'].includes(req.user.role);
  if (!privileged && String(request.recipientId) !== String(req.user._id)) throw new HttpError(403, 'FORBIDDEN', 'Not your request');
  return request;
}

r.get('/:id', roles('recipient', 'admin', 'hospital'), async (req, res) => {
  const request = await loadOwned(req);
  const offers = await Match.countDocuments({ requestId: request._id });
  const accepted = await Match.countDocuments({ requestId: request._id, status: { $in: ['ACCEPTED', 'COMPLETED'] } });
  ok(res, { request, offers, accepted });
});

r.post('/:id/rematch', roles('recipient', 'admin', 'hospital'), async (req, res) => {
  const request = await loadOwned(req);
  const found = await runMatching(String(request._id));
  await audit(req.user, 'MATCHING_RUN', 'RecipientRequest', request._id, { candidates: found }, req);
  ok(res, { candidatesFound: found });
});

r.post('/:id/cancel', roles('recipient', 'admin'), async (req, res) => {
  const request = await loadOwned(req);
  if (['FULFILLED', 'CANCELLED'].includes(request.status)) throw new HttpError(409, 'FINAL', `Request is already ${request.status}`);
  request.status = 'CANCELLED';
  await request.save();
  await Match.updateMany({ requestId: request._id, status: { $in: ['OFFERED', 'ACCEPTED'] } }, { status: 'EXPIRED' });
  await audit(req.user, 'REQUEST_CANCELLED', 'RecipientRequest', request._id, {}, req);
  ok(res, { request });
});

export default r;
