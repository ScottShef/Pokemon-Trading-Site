import { userDb } from '../db/connections.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// --- Review Schema ---
const ReviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewed: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxLength: 500 },
  createdAt: { type: Date, default: Date.now }
});

export const Review = userDb.model('Review', ReviewSchema);

// --- User Schema ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  reputation: { type: Number, default: 100, min: 0, max: 100 },
  reviewCount: { type: Number, default: 0, min: 0 } // default 0
}, { timestamps: true });

// --- Password Hashing ---
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Password Comparison Method ---
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// --- Update Reputation Method ---
UserSchema.methods.updateReputation = async function() {
  const stats = await Review.aggregate([
    { $match: { reviewed: this._id } },
    { $group: { _id: '$reviewed', averageRating: { $avg: '$rating' } } }
  ]);
  this.reputation = stats.length > 0 ? Math.round((stats[0].averageRating / 5) * 100) : 100;
  await this.save();
};

// --- Automatically Increment Review Count on New Review ---
ReviewSchema.post('save', async function(doc) {
  await User.findByIdAndUpdate(doc.reviewed, { $inc: { reviewCount: 1 } });
});

export const User = userDb.model('User', UserSchema);
