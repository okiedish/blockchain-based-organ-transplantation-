import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import User from './models/User.js';

// DEMO / SEED DATA. Accounts created here are flagged isDemoSeed and are meant for development only.
// Passwords come from the environment so nothing is hard-coded.
const demo = process.argv.includes('--demo');

async function main() {
  await mongoose.connect(env.mongoUri());
  const adminPw = process.env.SEED_ADMIN_PASSWORD;
  const hospitalPw = process.env.SEED_HOSPITAL_PASSWORD;
  if (!adminPw || !hospitalPw) throw new Error('Set SEED_ADMIN_PASSWORD and SEED_HOSPITAL_PASSWORD in server/.env first');

  const verified = { status: 'VERIFIED', method: 'SEED', reviewedAt: new Date() };
  const accounts: any[] = [
    { role: 'admin', name: 'System Administrator', email: 'admin@jeevanbindu.local', pw: adminPw },
    { role: 'hospital', name: 'Demo Hospital', email: 'hospital@jeevanbindu.local', pw: hospitalPw, location: { state: 'Karnataka', city: 'Bengaluru' } },
  ];
  if (demo) {
    const pw = adminPw;
    accounts.push(
      { role: 'donor', name: 'Demo Donor One', email: 'donor1@jeevanbindu.local', pw, bloodGroup: 'O-', dateOfBirth: new Date('1996-04-12'), location: { state: 'Karnataka', city: 'Bengaluru' }, verification: verified },
      { role: 'donor', name: 'Demo Donor Two', email: 'donor2@jeevanbindu.local', pw, bloodGroup: 'A+', dateOfBirth: new Date('1990-09-30'), location: { state: 'Karnataka', city: 'Mysuru' }, verification: verified },
      { role: 'recipient', name: 'Demo Recipient', email: 'recipient@jeevanbindu.local', pw, bloodGroup: 'A+', dateOfBirth: new Date('1985-01-20'), location: { state: 'Karnataka', city: 'Bengaluru' }, verification: verified }
    );
  }
  for (const a of accounts) {
    const { pw, ...rest } = a;
    await User.deleteOne({ email: a.email });
    await User.create({ ...rest, passwordHash: await bcrypt.hash(pw, 12), isDemoSeed: true, consentAt: new Date() });
    console.log('seeded', a.role, a.email);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
