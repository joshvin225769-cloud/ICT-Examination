import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';

export const categories = ['IT & Network', 'Facilities', 'Academic', 'Library', 'Hostel', 'Other'];
export const statuses = ['Open', 'In progress', 'Resolved', 'Closed'];
export const priorities = ['Low', 'Medium', 'High'];
const activitySchema = new mongoose.Schema({
  actor: { type: String, required: true },
  type: { type: String, enum: ['created', 'updated', 'status', 'comment'], required: true },
  message: { type: String, required: true, maxlength: 1500 },
  at: { type: Date, default: Date.now }
}, { _id: true });
const requestSchema = new mongoose.Schema({
  reference: { type: String, unique: true, default: () => `CD-${randomBytes(4).toString('hex').toUpperCase()}` },
  title: { type: String, required: true, minlength: 5, maxlength: 120, trim: true },
  description: { type: String, required: true, minlength: 15, maxlength: 3000, trim: true },
  category: { type: String, enum: categories, required: true },
  location: { type: String, required: true, minlength: 3, maxlength: 120, trim: true },
  priority: { type: String, enum: priorities, default: 'Medium' },
  status: { type: String, enum: statuses, default: 'Open' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: [activitySchema], default: [], validate: value => value.length <= 200 }
}, { timestamps: true, optimisticConcurrency: true });
requestSchema.index({ owner: 1, createdAt: -1 });
requestSchema.index({ status: 1, createdAt: -1 });
export const ServiceRequest = mongoose.model('ServiceRequest', requestSchema);
