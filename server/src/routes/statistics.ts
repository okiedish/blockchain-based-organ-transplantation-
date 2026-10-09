import { Router } from 'express';
import User from '../models/User.js';
import RecipientRequest from '../models/RecipientRequest.js';
import Match from '../models/Match.js';
import Donation from '../models/Donation.js';
import BlockchainRecord from '../models/BlockchainRecord.js';
import { BLOOD_GROUPS } from '../services/compatibility.js';
import { ok } from '../middleware/error.js';

const r = Router();

const countBy = async (model: any, field: string, match: object = {}) => {
  const rows: { _id: string; n: number }[] = await model.aggregate([{ $match: match }, { $group: { _id: `$${field}`, n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.filter((x) => x._id).map((x) => [x._id, x.n]));
};

// Aggregate counts only. No personal data, so it is public (used by the Transparency page).
r.get('/', async (_req, res) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const [totalDonors, totalRecipients, verifiedUsers, openRequests, successfulMatches, completedDonations, donorGroups, requestStatus, verification, chain, trendRows, states] = await Promise.all([
    User.countDocuments({ role: 'donor' }),
    User.countDocuments({ role: 'recipient' }),
    User.countDocuments({ role: { $in: ['donor', 'recipient'] }, 'verification.status': 'VERIFIED' }),
    RecipientRequest.countDocuments({ status: { $in: ['OPEN', 'MATCHED'] } }),
    Match.countDocuments({ status: { $in: ['ACCEPTED', 'COMPLETED'] } }),
    Donation.countDocuments({}),
    countBy(User, 'bloodGroup', { role: 'donor' }),
    countBy(RecipientRequest, 'status'),
    countBy(User, 'verification.status', { role: { $in: ['donor', 'recipient'] } }),
    countBy(BlockchainRecord, 'status'),
    Donation.aggregate([{ $match: { completedAt: { $gte: since } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$completedAt' } }, n: { $sum: 1 } } }]),
    countBy(User, 'location.state', { role: 'donor' }),
  ]);

  const months: { month: string; donations: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(since.getFullYear(), since.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ month: key, donations: trendRows.find((t: any) => t._id === key)?.n ?? 0 });
  }

  ok(res, {
    totals: { totalDonors, totalRecipients, verifiedUsers, openRequests, successfulMatches, completedDonations },
    bloodGroupDistribution: BLOOD_GROUPS.map((g) => ({ bloodGroup: g, donors: donorGroups[g] ?? 0 })),
    donationTrend: months,
    requestFulfillment: { OPEN: 0, MATCHED: 0, FULFILLED: 0, CANCELLED: 0, ...requestStatus },
    verificationStatus: { UNVERIFIED: 0, REQUIRES_REVIEW: 0, VERIFIED: 0, REJECTED: 0, ...verification },
    blockchain: { CONFIRMED: 0, PENDING: 0, FAILED: 0, ...chain },
    donorsByState: states,
  });
});

export default r;
