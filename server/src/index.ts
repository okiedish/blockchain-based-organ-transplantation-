import mongoose from 'mongoose';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { blockchainStatus } from './services/blockchainService.js';

async function main() {
  env.jwtSecret();
  env.aadhaarHmacSecret();
  await mongoose.connect(env.mongoUri());
  createApp().listen(env.port, async () => {
    console.log(`JeevanBindu API running on :${env.port}`);
    const s = await blockchainStatus();
    console.log(`Blockchain: ${s.message}${s.network ? ` (${s.network}, contract ${s.contractAddress ?? 'n/a'})` : ''}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
