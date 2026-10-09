import User from '../models/User.js';
import Match from '../models/Match.js';
import Donation from '../models/Donation.js';
import type { RecordType } from '../models/BlockchainRecord.js';

export interface CanonicalRecord {
  data: Record<string, unknown>; // contains ids, statuses and timestamps only - no personal data
  referenceModel: string;
  parentReferenceId?: string;
  ownerIds: string[];
}

/**
 * Rebuilds the canonical record from current database state. It is used both when anchoring
 * and when verifying, so tampering with the database after anchoring changes the hash.
 */
export async function buildCanonical(recordType: RecordType, referenceId: string): Promise<CanonicalRecord | null> {
  if (recordType === 'REGISTRATION') {
    const u = await User.findById(referenceId);
    if (!u) return null;
    return {
      referenceModel: 'User',
      ownerIds: [String(u._id)],
      data: { v: 1, type: recordType, userId: String(u._id), role: u.role, createdAt: (u as any).createdAt },
    };
  }
  if (recordType === 'VERIFICATION') {
    const u = await User.findById(referenceId);
    if (!u || !u.verification?.reviewedAt) return null;
    return {
      referenceModel: 'User',
      ownerIds: [String(u._id)],
      data: {
        v: 1,
        type: recordType,
        userId: String(u._id),
        status: u.verification.status,
        method: u.verification.method,
        reviewedBy: u.verification.reviewedBy ? String(u.verification.reviewedBy) : undefined,
        reviewedAt: u.verification.reviewedAt,
      },
    };
  }
  if (recordType === 'MATCH') {
    const m = await Match.findById(referenceId);
    if (!m || !m.respondedAt) return null;
    return {
      referenceModel: 'Match',
      parentReferenceId: String(m.requestId),
      ownerIds: [String(m.donorId), String(m.recipientId)],
      data: {
        v: 1,
        type: recordType,
        matchId: String(m._id),
        requestId: String(m.requestId),
        donorId: String(m.donorId),
        recipientId: String(m.recipientId),
        acceptedAt: m.respondedAt,
      },
    };
  }
  const d = await Donation.findById(referenceId);
  if (!d) return null;
  return {
    referenceModel: 'Donation',
    parentReferenceId: String(d.requestId),
    ownerIds: [String(d.donorId), String(d.recipientId)],
    data: {
      v: 1,
      type: 'DONATION',
      donationId: String(d._id),
      matchId: String(d.matchId),
      requestId: String(d.requestId),
      donorId: String(d.donorId),
      recipientId: String(d.recipientId),
      bloodGroup: d.bloodGroup,
      units: d.units,
      completedAt: d.completedAt,
    },
  };
}
