import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFound, ok } from './middleware/error.js';
import auth from './routes/auth.js';
import users from './routes/users.js';
import verification from './routes/verification.js';
import donors from './routes/donors.js';
import requests from './routes/requests.js';
import matches from './routes/matches.js';
import donations from './routes/donations.js';
import statistics from './routes/statistics.js';
import blockchain from './routes/blockchain.js';
import audit from './routes/audit.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.clientOrigins }));
  app.use(express.json({ limit: '3mb' })); // identity document uploads arrive as base64 (<= 2 MB file)
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (_req, res) => ok(res, { status: 'ok' }));
  app.use('/api/auth', auth);
  app.use('/api/users', users);
  app.use('/api/verification', verification);
  app.use('/api/donors', donors);
  app.use('/api/requests', requests);
  app.use('/api/matches', matches);
  app.use('/api/donations', donations);
  app.use('/api/statistics', statistics);
  app.use('/api/blockchain', blockchain);
  app.use('/api/audit', audit);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
