import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

export async function connectDatabase(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await User.init();
}

export async function provisionAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('Initial admin needs ADMIN_EMAIL and a password of 12+ characters (maximum 72 UTF-8 bytes).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL must be a valid email address.');
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL belongs to a student; choose another email.');
    return;
  }
  await User.create({
    name: process.env.ADMIN_NAME?.trim() || 'Campus Administrator',
    email,
    role: 'admin',
    passwordHash: await bcrypt.hash(password, 12)
  });
  console.log('Initial administrator provisioned. Remove ADMIN_PASSWORD from host settings after first startup.');
}
