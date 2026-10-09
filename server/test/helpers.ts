import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import { verhoeffGenerate } from '../src/services/verhoeff.js';

process.env.JWT_SECRET ||= 'test-secret-test-secret';
process.env.AADHAAR_HMAC_SECRET ||= 'test-hmac-secret';

let mongod: MongoMemoryServer;
export const app = createApp();

export async function startDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}
export async function stopDb() {
  await mongoose.disconnect();
  await mongod.stop();
}

export const aadhaar = (seed: string) => seed + verhoeffGenerate(seed); // 11 digits + checksum
export const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

export async function createStaff(role: 'admin' | 'hospital', email: string) {
  await User.create({ role, name: role, email, passwordHash: await bcrypt.hash('Passw0rd!', 4), verification: { status: 'VERIFIED' } });
  return login(email);
}

export async function login(email: string, password = 'Passw0rd!') {
  const r = await request(app).post('/api/auth/login').send({ email, password });
  return { token: r.body.data.token as string, user: r.body.data.user };
}

export async function registerUser(role: 'donor' | 'recipient', email: string, bloodGroup: string, dob = '1995-05-05', city = 'Bengaluru') {
  const r = await request(app).post('/api/auth/register').send({
    role, name: `Test ${role}`, email, password: 'Passw0rd!', bloodGroup, dateOfBirth: dob, consent: true,
    location: { state: 'Karnataka', city },
  });
  return { token: r.body.data?.token as string, user: r.body.data?.user, status: r.status, body: r.body };
}

/** Runs the full prototype verification flow and has the admin approve it. */
export async function verifyUser(token: string, adminToken: string, userId: string, aadhaarNumber: string, name: string) {
  const sub = await request(app).post('/api/verification/submit').set('Authorization', `Bearer ${token}`).send({
    aadhaarNumber, document: { fileName: 'id.png', dataUrl: pngDataUrl }, extracted: { name, dateOfBirth: '1995-05-05' }, confirmed: true,
  });
  const rev = await request(app).post(`/api/verification/${userId}/review`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'APPROVE' });
  return { sub, rev };
}
