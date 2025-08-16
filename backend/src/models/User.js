const mongoose = require("mongoose");  // MongoDB object modeling library
const bcrypt = require("bcryptjs");    // Library for hashing passwords

// ========================
// Define User Schema
// ========================
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Unique username
  email: { type: String, required: true, unique: true },    // Unique email
  password: { type: String, required: true },               // Hashed password
  createdAt: { type: Date, default: Date.now }              // Timestamp of creation
});

// ========================
// Pre-save Hook: Hash Password
// ========================
// Runs automatically before saving a new user
userSchema.pre("save", async function (next) {
  // Only hash password if it is new or has been modified
  if (!this.isModified("password")) return next();

  // Generate a salt (complexity 10) and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next(); // Continue saving
});

// ========================
// Method to Compare Passwords
// ========================
// Allows checking a plain password against the hashed password in DB
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ========================
// Export Model
// ========================
// Third parameter explicitly sets the collection name to "users"
// This prevents Mongoose from using default collection names like "userss" or "userModels"
module.exports = mongoose.model("User", userSchema, "users");
