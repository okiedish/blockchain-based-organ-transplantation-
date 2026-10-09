import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import User from '../models/User.js';
import { auth, signToken } from '../middleware/auth.js';
import { HttpError, ok, validate } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { anchorRecord } from '../services/blockchainService.js';
import { BLOOD_GROUPS } from '../services/compatibility.js';

const r = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

export const passwordSchema = z
  .string()
  .min(8, 'must be at least 8 characters')
  .regex(/[A-Za-z]/, 'must contain a letter')
  .regex(/\d/, 'must contain a digit');

const registerSchema = z.object({
  role: z.enum(['donor', 'recipient']),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: passwordSchema,
  phone: z.string().regex(/^\d{10}$/, 'must be 10 digits').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().refine((s) => !Number.isNaN(Date.parse(s)), 'invalid date').optional(),
  bloodGroup: z.enum(BLOOD_GROUPS),
  location: z.object({ state: z.string().min(2), city: z.string().min(2), hospital: z.string().optional() }),
  consent: z.literal(true, { error: 'Consent is required' }),
});

r.post('/register', limiter, async (req, res) => {
  const b = validate(registerSchema, req.body);
  if (await User.exists({ email: b.email.toLowerCase() })) throw new HttpError(409, 'EMAIL_TAKEN', 'An account with this email already exists');
  const user = await User.create({
    role: b.role,
    name: b.name,
    email: b.email,
    phone: b.phone,
    gender: b.gender,
    dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth) : undefined,
    bloodGroup: b.bloodGroup,
    location: b.location,
    consentAt: new Date(),
    passwordHash: await bcrypt.hash(b.password, 12),
  });
  await audit(user, 'REGISTER', 'User', user._id, { role: user.role }, req);
  const chain = await anchorRecord('REGISTRATION', String(user._id));
  ok(res, { user, token: signToken(user), blockchain: chain && chain.toObject() }, 201);
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

r.post('/login', limiter, async (req, res) => {
  const b = validate(loginSchema, req.body);
  const user = await User.findOne({ email: b.email.toLowerCase() }).select('+passwordHash');
  const good = user ? await bcrypt.compare(b.password, user.passwordHash) : false;
  if (!user || !good || user.suspended) {
    await audit(null, 'LOGIN_FAILED', 'User', undefined, {}, req); // no email/password logged
    throw new HttpError(401, 'LOGIN_FAILED', 'Invalid email or password');
  }
  await audit(user, 'LOGIN', 'User', user._id, {}, req);
  ok(res, { user: await User.findById(user._id), token: signToken(user) });
});

r.get('/me', auth, (req, res) => ok(res, { user: req.user }));

// Tokens are stateless; logout is recorded for the audit trail and the client discards the token.
r.post('/logout', auth, async (req, res) => {
  await audit(req.user, 'LOGOUT', 'User', req.user!._id, {}, req);
  ok(res, { loggedOut: true });
});

export default r;
