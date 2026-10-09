import { Router } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';
import { ok, validate } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { donorEligibility } from '../services/eligibility.js';

const r = Router();
r.use(auth);

r.get('/me', roles('donor'), (req, res) => {
  const u = req.user!;
  ok(res, {
    bloodGroup: u.bloodGroup,
    available: u.available,
    lastDonationAt: u.lastDonationAt,
    verificationStatus: u.verification?.status,
    eligibility: donorEligibility({ dateOfBirth: u.dateOfBirth, lastDonationAt: u.lastDonationAt }),
  });
});

r.patch('/me/availability', roles('donor'), async (req, res) => {
  const { available } = validate(z.object({ available: z.boolean() }), req.body);
  const u = req.user!;
  u.available = available;
  await u.save();
  await audit(u, 'DONOR_AVAILABILITY', 'User', u._id, { available }, req);
  ok(res, { available });
});

// Admin / hospital overview. Contact details are deliberately not returned.
r.get('/', roles('admin', 'hospital'), async (_req, res) => {
  const donors = await User.find({ role: 'donor' }).sort({ createdAt: -1 }).limit(200).lean();
  ok(res, {
    donors: donors.map((d) => ({
      id: d._id,
      name: d.name,
      bloodGroup: d.bloodGroup,
      location: { state: d.location?.state, city: d.location?.city },
      available: d.available,
      verificationStatus: d.verification?.status,
      eligible: donorEligibility({ dateOfBirth: d.dateOfBirth, lastDonationAt: d.lastDonationAt }).eligible,
      lastDonationAt: d.lastDonationAt,
    })),
  });
});

export default r;
