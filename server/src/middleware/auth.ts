import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { HttpError } from './error.js';

export const signToken = (u: { _id: unknown; role: string }) =>
  jwt.sign({ id: String(u._id), role: u.role }, env.jwtSecret(), { expiresIn: '2h' });

export async function auth(req: Request, _res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw new HttpError(401, 'UNAUTHORIZED', 'Authentication required');
  let payload: any;
  try {
    payload = jwt.verify(h.slice(7), env.jwtSecret());
  } catch {
    throw new HttpError(401, 'UNAUTHORIZED', 'Session expired or invalid');
  }
  const user = await User.findById(payload.id);
  if (!user || user.suspended) throw new HttpError(401, 'UNAUTHORIZED', 'Account unavailable');
  req.user = user;
  next();
}

export const roles =
  (...allowed: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !allowed.includes(req.user.role)) throw new HttpError(403, 'FORBIDDEN', 'You do not have access to this resource');
    next();
  };

/** Donors/recipients must have a VERIFIED identity before acting on the platform. */
export function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.verification?.status !== 'VERIFIED')
    throw new HttpError(403, 'NOT_VERIFIED', 'Complete identity verification (and wait for approval) before doing this');
  next();
}
