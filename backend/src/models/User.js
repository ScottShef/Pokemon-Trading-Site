const mongoose = require("mongoose"); // MongoDB ORM
const bcrypt = require("bcryptjs");   // Library for hashing passwords

// Define the User schema (structure of a user document)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Unique username
  email: { type: String, required: true, unique: true },    // Unique email
  password: { type: String, required: true },               // Hashed password
  createdAt: { type: Date, default: Date.now }              // Timestamp
});

// Pre-save hook: runs before saving a user to hash their password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified or is new
  if (!this.isModified("password")) return next();

  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next(); // Continue saving
});

// Method to compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Export the model to use in routes
module.exports = mongoose.model("User", userSchema);
