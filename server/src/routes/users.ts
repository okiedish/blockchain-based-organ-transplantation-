import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';
import { HttpError, ok, validate } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { donorEligibility } from '../services/eligibility.js';
import { BLOOD_GROUPS } from '../services/compatibility.js';

const r = Router();
r.use(auth);

r.get('/me', (req, res) => {
  const u = req.user!;
  const eligibility = u.role === 'donor' ? donorEligibility({ dateOfBirth: u.dateOfBirth, lastDonationAt: u.lastDonationAt }) : undefined;
  ok(res, { user: u, eligibility });
});

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\d{10}$/).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().refine((s) => !Number.isNaN(Date.parse(s))).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  location: z.object({ state: z.string().min(2), city: z.string().min(2), hospital: z.string().optional(), address: z.string().optional() }).optional(),
});

r.patch('/me', async (req, res) => {
  const b = validate(patchSchema, req.body);
  const u = req.user!;
  // Blood group is part of what identity review checks; lock it once verified.
  if (b.bloodGroup && u.verification?.status === 'VERIFIED' && b.bloodGroup !== u.bloodGroup)
    throw new HttpError(409, 'LOCKED', 'Blood group cannot be changed after verification');
  Object.assign(u, { ...b, dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth) : u.dateOfBirth });
  await u.save();
  await audit(u, 'PROFILE_UPDATED', 'User', u._id, { fields: Object.keys(b) }, req);
  ok(res, { user: u });
});

// Admin / hospital directory (no sensitive verification internals; toJSON strips hashes).
r.get('/', roles('admin'), async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.role === 'string') filter.role = req.query.role;
  ok(res, { users: await User.find(filter).sort({ createdAt: -1 }).limit(200) });
});

export default r;
