import { Router } from 'express';
import { createHash, createHmac } from 'node:crypto';
import { z } from 'zod';
import User from '../models/User.js';
import { auth, roles } from '../middleware/auth.js';
import { HttpError, ok, validate } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { anchorRecord } from '../services/blockchainService.js';
import { isWellFormedAadhaar } from '../services/verhoeff.js';
import { env } from '../config/env.js';

/**
 * PROTOTYPE identity verification. This is NOT UIDAI authentication and does not call any
 * government service. Flow: upload -> prototype extraction -> user confirms -> REQUIRES_REVIEW
 * -> admin approves (VERIFIED) or rejects (REJECTED).
 * Privacy: the uploaded file is hashed and discarded; the Aadhaar number is stored only as an
 * HMAC (duplicate detection) plus a masked form; neither is logged or sent on-chain.
 */
const r = Router();
r.use(auth);

const MAX_BYTES = 2 * 1024 * 1024;
const docSchema = z.object({ fileName: z.string().max(120), dataUrl: z.string() });

function readDocument(doc: z.infer<typeof docSchema>) {
  const m = /^data:(image\/png|image\/jpeg|application\/pdf);base64,([A-Za-z0-9+/=]+)$/.exec(doc.dataUrl);
  if (!m) throw new HttpError(400, 'BAD_DOCUMENT', 'Upload a PNG, JPEG or PDF file');
  const bytes = Buffer.from(m[2], 'base64');
  if (bytes.length === 0 || bytes.length > MAX_BYTES) throw new HttpError(400, 'BAD_DOCUMENT', 'File must be between 1 byte and 2 MB');
  return { mime: m[1], size: bytes.length, hash: createHash('sha256').update(bytes).digest('hex') };
}

const individuals = roles('donor', 'recipient');

// Step 1 - "extraction". No OCR is performed in this prototype: the fields are pre-filled from the
// profile for the user to confirm or correct. The response says so explicitly.
r.post('/extract', individuals, async (req, res) => {
  const { document } = validate(z.object({ document: docSchema }), req.body);
  const info = readDocument(document);
  const u = req.user!;
  ok(res, {
    prototype: true,
    notice: 'Prototype extraction: no OCR or government lookup was performed. Confirm or correct the details below.',
    file: { mime: info.mime, size: info.size },
    extracted: { name: u.name, dateOfBirth: u.dateOfBirth?.toISOString().slice(0, 10) ?? '', gender: u.gender ?? '' },
  });
});

const submitSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'must be 12 digits'),
  document: docSchema,
  extracted: z.object({ name: z.string().min(2), dateOfBirth: z.string().refine((s) => !Number.isNaN(Date.parse(s))), gender: z.string().optional() }),
  confirmed: z.literal(true, { error: 'You must confirm the extracted details' }),
});

// Step 2 - user confirms; result is stored as REQUIRES_REVIEW for an admin.
r.post('/submit', individuals, async (req, res) => {
  const b = validate(submitSchema, req.body);
  const u = req.user!;
  if (u.verification?.status === 'VERIFIED') throw new HttpError(409, 'ALREADY_VERIFIED', 'Identity is already verified');
  if (!isWellFormedAadhaar(b.aadhaarNumber)) throw new HttpError(400, 'AADHAAR_FORMAT', 'This is not a well-formed Aadhaar number (format/checksum check only)');
  const info = readDocument(b.document);
  const lookup = createHmac('sha256', env.aadhaarHmacSecret()).update(b.aadhaarNumber).digest('hex');
  const dup = await User.findOne({ 'verification.aadhaarLookupHash': lookup, _id: { $ne: u._id } });
  if (dup) throw new HttpError(409, 'DUPLICATE_IDENTITY', 'This identity is already linked to another account');

  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const nameMatches = norm(b.extracted.name) === norm(u.name);
  const dobMatches = !!u.dateOfBirth && u.dateOfBirth.toISOString().slice(0, 10) === new Date(b.extracted.dateOfBirth).toISOString().slice(0, 10);

  u.verification = {
    status: 'REQUIRES_REVIEW',
    method: 'PROTOTYPE_DEMO',
    aadhaarLookupHash: lookup,
    aadhaarMasked: '********' + b.aadhaarNumber.slice(-4),
    documentHash: info.hash,
    extracted: { name: b.extracted.name, dateOfBirth: b.extracted.dateOfBirth, gender: b.extracted.gender },
    submittedAt: new Date(),
  } as any;
  await u.save();
  await audit(u, 'VERIFICATION_SUBMITTED', 'User', u._id, { nameMatchesProfile: nameMatches, dobMatchesProfile: dobMatches }, req);
  ok(res, { verification: u.toJSON().verification, checks: { nameMatchesProfile: nameMatches, dobMatchesProfile: dobMatches } });
});

r.get('/me', (req, res) => ok(res, { verification: req.user!.toJSON().verification }));

// ---------------------------------------------------------------- admin review
r.get('/pending', roles('admin'), async (_req, res) => {
  const users = await User.find({ 'verification.status': 'REQUIRES_REVIEW' }).sort({ 'verification.submittedAt': 1 });
  ok(res, {
    users: users.map((u) => ({
      ...u.toJSON(),
      checks: {
        nameMatchesProfile: !!u.verification?.extracted?.name && u.verification.extracted.name.trim().toLowerCase() === u.name.trim().toLowerCase(),
        dobMatchesProfile: !!u.dateOfBirth && u.verification?.extracted?.dateOfBirth === u.dateOfBirth.toISOString().slice(0, 10),
      },
    })),
  });
});

const reviewSchema = z.object({ decision: z.enum(['APPROVE', 'REJECT']), note: z.string().max(300).optional() });

r.post('/:userId/review', roles('admin'), async (req, res) => {
  const b = validate(reviewSchema, req.body);
  const u = await User.findById(req.params.userId);
  if (!u || u.verification?.status !== 'REQUIRES_REVIEW') throw new HttpError(404, 'NOT_PENDING', 'No pending verification for this user');
  u.verification!.status = b.decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
  u.verification!.reviewedBy = req.user!._id as any;
  u.verification!.reviewedAt = new Date();
  u.verification!.reviewNote = b.note;
  await u.save();
  await audit(req.user, b.decision === 'APPROVE' ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED', 'User', u._id, { note: b.note }, req);
  // Only approvals are anchored; the chain stores a hash of the decision, not identity data.
  const chain = b.decision === 'APPROVE' ? await anchorRecord('VERIFICATION', String(u._id)) : null;
  ok(res, { user: u, blockchain: chain && chain.toObject() });
});

export default r;
