import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const msg = r.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    throw new HttpError(400, 'VALIDATION', msg);
  }
  return r.data;
}

export const notFound = (_req: Request, res: Response) =>
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) return res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
  if (err?.code === 11000) return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'A record with these details already exists' } });
  if (err?.name === 'CastError') return res.status(400).json({ success: false, error: { code: 'BAD_ID', message: 'Invalid identifier' } });
  console.error(err?.message || err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL', message: 'Something went wrong' } });
}

export const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
