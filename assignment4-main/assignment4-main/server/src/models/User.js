import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const publicUser = user => ({ id: user._id.toString(), name: user.name, email: user.email, role: user.role });
