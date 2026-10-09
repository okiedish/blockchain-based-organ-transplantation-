import { Router } from 'express';
import BlockchainRecord from '../models/BlockchainRecord.js';
import { auth, roles } from '../middleware/auth.js';
import { HttpError, ok } from '../middleware/error.js';
import { audit } from '../services/audit.js';
import { blockchainStatus, explorerTxUrl, readEvents, refreshRecord, retryRecord, verifyAgainstChain, describeError } from '../services/blockchainService.js';

const r = Router();

r.get('/status', async (_req, res) => ok(res, await blockchainStatus()));

r.use(auth);

const present = (rec: any) => {
  const o = rec.toObject ? rec.toObject() : rec;
  return { ...o, explorerUrl: explorerTxUrl(o.chainId, o.transactionHash) };
};

function assertAccess(req: any, rec: any) {
  if (['admin', 'hospital'].includes(req.user.role)) return;
  if (!(rec.ownerIds || []).some((id: any) => String(id) === String(req.user._id))) throw new HttpError(403, 'FORBIDDEN', 'Not your record');
}

r.get('/records', async (req, res) => {
  const filter: Record<string, unknown> = {};
  if (!['admin', 'hospital'].includes(req.user!.role)) filter.ownerIds = req.user!._id;
  if (typeof req.query.status === 'string') filter.status = req.query.status;
  if (typeof req.query.type === 'string') filter.recordType = req.query.type;
  const records = await BlockchainRecord.find(filter).sort({ createdAt: -1 }).limit(200);
  ok(res, { records: records.map(present) });
});

r.get('/records/:id', async (req, res) => {
  const rec = await BlockchainRecord.findById(req.params.id);
  if (!rec) throw new HttpError(404, 'NOT_FOUND', 'Record not found');
  assertAccess(req, rec);
  ok(res, { record: present(rec) });
});

r.get('/records/:id/verify', async (req, res) => {
  const rec = await BlockchainRecord.findById(req.params.id);
  if (!rec) throw new HttpError(404, 'NOT_FOUND', 'Record not found');
  assertAccess(req, rec);
  ok(res, { verification: await verifyAgainstChain(String(rec._id)) });
});

r.post('/records/:id/retry', roles('admin'), async (req, res) => {
  const rec = await BlockchainRecord.findById(req.params.id);
  if (!rec) throw new HttpError(404, 'NOT_FOUND', 'Record not found');
  if (rec.status === 'CONFIRMED') throw new HttpError(409, 'ALREADY_CONFIRMED', 'Record is already confirmed');
  await audit(req.user, 'BLOCKCHAIN_RETRY', 'BlockchainRecord', rec._id, {}, req);
  ok(res, { record: present(await retryRecord(String(rec._id))) });
});

r.post('/records/:id/refresh', roles('admin'), async (req, res) => {
  const rec = await refreshRecord(String(req.params.id));
  if (!rec) throw new HttpError(404, 'NOT_FOUND', 'Record not found');
  ok(res, { record: present(rec) });
});

r.get('/events', roles('admin'), async (_req, res) => {
  try {
    ok(res, { events: await readEvents() });
  } catch (e) {
    throw new HttpError(503, 'BLOCKCHAIN_UNAVAILABLE', describeError(e).message);
  }
});

export default r;
