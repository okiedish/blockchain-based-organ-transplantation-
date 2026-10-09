import User from '../models/User.js';
import Match from '../models/Match.js';
import RecipientRequest from '../models/RecipientRequest.js';
import { compatibleDonorGroups, type BloodGroup } from './compatibility.js';
import { donorEligibility } from './eligibility.js';

const MAX_OFFERS_PER_REQUEST = 20;

/**
 * Finds donors for a request and persists an OFFERED match for each.
 * Filters: ABO/Rh compatible, VERIFIED identity, available, not suspended, not the recipient,
 * platform-eligible (age, donation interval). Ranking: same city > same state, then urgency of ask.
 */
export async function findCandidates(request: InstanceType<typeof RecipientRequest>) {
  const groups = compatibleDonorGroups(request.bloodGroup as BloodGroup);
  const donors = await User.find({
    role: 'donor',
    bloodGroup: { $in: groups },
    available: true,
    suspended: { $ne: true },
    'verification.status': 'VERIFIED',
    _id: { $ne: request.recipientId },
  }).lean();

  return donors
    .filter((d) => donorEligibility({ dateOfBirth: d.dateOfBirth, lastDonationAt: d.lastDonationAt }).eligible)
    .map((d) => {
      let score = 10;
      if (d.bloodGroup === request.bloodGroup) score += 15; // exact match preferred over universal-donor use
      if (d.location?.state && d.location.state === request.location?.state) score += 10;
      if (d.location?.city && d.location.city.toLowerCase() === request.location?.city?.toLowerCase()) score += 20;
      return { donor: d, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_OFFERS_PER_REQUEST);
}

/** Creates (idempotently) the offers for a request. Returns the number of candidates found. */
export async function runMatching(requestId: string): Promise<number> {
  const request = await RecipientRequest.findById(requestId);
  if (!request || !['OPEN', 'MATCHED'].includes(request.status)) return 0;
  const candidates = await findCandidates(request);
  for (const c of candidates) {
    await Match.updateOne(
      { requestId: request._id, donorId: c.donor._id },
      { $setOnInsert: { requestId: request._id, donorId: c.donor._id, recipientId: request.recipientId, status: 'OFFERED' }, $set: { score: c.score } },
      { upsert: true }
    );
  }
  request.candidateCount = candidates.length;
  await request.save();
  return candidates.length;
}
