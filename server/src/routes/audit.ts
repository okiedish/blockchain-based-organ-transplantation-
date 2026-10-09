import { Router } from 'express';
import AuditLog from '../models/AuditLog.js';
import { auth, roles } from '../middleware/auth.js';
import { ok } from '../middleware/error.js';

const r = Router();
r.use(auth, roles('admin'));

r.get('/', async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (typeof req.query.action === 'string') filter.action = req.query.action;
  const records = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(Math.min(Number(req.query.limit) || 100, 500)).populate('actorId', 'name role');
  ok(res, { records });
});

export default r;
