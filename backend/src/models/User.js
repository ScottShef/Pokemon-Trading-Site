
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// --- Review Model ---
// It's best practice to define the review schema in its own model.
// For simplicity in this craft, it's included in the same file.
// You can split this into a separate file (e.g., Review.js).

const ReviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewed: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true, maxLength: 500 },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model("Review", ReviewSchema);


// --- Updated User Model ---
// Your original User model, now with reputation and reviews integrated.

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  // --- Fields added for the reputation system ---
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  reputation: { type: Number, default: 100, min: 0, max: 100 }
}, { timestamps: true });

// --- Your existing password hashing logic ---
// Hash password before saving
UserSchema.pre("save", async function (next) {
  const user = this;

  // Only hash if password is new or modified
  if (!user.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// --- Your existing password comparison method ---
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// --- New method to calculate and update reputation ---
UserSchema.methods.updateReputation = async function () {
  // 'this' refers to the user document
  const stats = await Review.aggregate([
    {
      // Find all reviews where this user is the one being reviewed
      $match: { reviewed: this._id }
    },
    {
      // Group the reviews and calculate the average of the 'rating' field
      $group: {
        _id: '$reviewed',
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    // If there are reviews, calculate reputation as a percentage of the 5-star rating
    this.reputation = Math.round((stats[0].averageRating / 5) * 100);
  } else {
    // If there are no reviews, the reputation defaults to 100
    this.reputation = 100;
  }

  // Save the updated user document with the new reputation score
  await this.save();
};

const User = mongoose.model("User", UserSchema);

module.exports = { User, Review };

