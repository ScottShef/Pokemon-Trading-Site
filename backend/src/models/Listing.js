import mongoose from "mongoose";
import { userDb } from "../db/connections.js"; // <-- use the same DB connection as User

// --- Grade Definitions ---
const RAW_CONDITIONS = ['Mint', 'Near Mint', 'Lightly Played', 'Heavily Played'];
const GRADING_COMPANIES = ['PSA', 'CGC', 'Beckett'];
const PSA_GRADES = ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
const CGC_GRADES = [
  'Pristine 10','Gem Mint 10','Mint+ 9.5','Mint 9','Near Mint/Mint+ 8.5','Near Mint/Mint 8','Near Mint+ 7.5',
  'Near Mint 7','Excellent/Near Mint+ 6.5','Excellent/Near Mint 6','Very Good/Excellent+ 5.5','Very Good/Excellent 5',
  'Very Good+ 4.5','Very Good 4','Good/Very Good+ 3.5','Good/Very Good 3','Good+ 2.5','Good 2','Fair 1.5','Poor 1'
];
const BECKETT_GRADES = [
  'Black Label 10','Pristine 10','Gem Mint 9.5','9','8.5','8','7.5','7','6.5','6','5.5','5','4.5','4','3.5','3','2.5','2','1.5','1'
];

// --- Create the model only if it doesn't exist on userDb ---
if (!userDb.models.Listing) {
  const ListingSchema = new mongoose.Schema({
    cardName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrls: {
      type: [String],
      required: 'Please upload at least two images (front and back).',
      validate: {
        validator: function(v) {
          return Array.isArray(v) && v.length >= 2;
        },
        message: 'At least two images are required for a listing (front and back).'
      }
    },
    seller: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    listingType: {
      type: String,
      enum: ['raw', 'graded'],
      required: 'You must specify if the card is raw or graded.'
    },
    rawCondition: {
      type: String,
      enum: RAW_CONDITIONS,
      required: function() { return this.listingType === 'raw'; }
    },
    gradedData: {
      company: {
        type: String,
        enum: GRADING_COMPANIES,
        required: function() { return this.listingType === 'graded'; }
      },
      grade: {
        type: String,
        required: function() { return this.listingType === 'graded'; }
      }
    }
  }, { timestamps: true });

  // --- Validation hook ---
  ListingSchema.pre('validate', function(next) {
    if (this.listingType === 'raw') {
      this.gradedData = undefined;
      if (!RAW_CONDITIONS.includes(this.rawCondition)) {
        return next(new Error(`'${this.rawCondition}' is not a valid condition for a raw card.`));
      }
    } else if (this.listingType === 'graded') {
      this.rawCondition = undefined;
      const company = this.gradedData?.company;
      const grade = this.gradedData?.grade;
      let validGrades = [];
      if (!company || !grade) return next(new Error('Graded listings must include both a company and a grade.'));
      switch (company) {
        case 'PSA': validGrades = PSA_GRADES; break;
        case 'CGC': validGrades = CGC_GRADES; break;
        case 'Beckett': validGrades = BECKETT_GRADES; break;
        default: return next(new Error(`'${company}' is not a valid grading company.`));
      }
      if (!validGrades.includes(grade)) return next(new Error(`'${grade}' is not a valid grade for ${company}.`));
    } else {
      this.rawCondition = undefined;
      this.gradedData = undefined;
    }
    next();
  });

  userDb.model("Listing", ListingSchema); // <-- create model on userDb
}

const Listing = userDb.models.Listing;

export default Listing;
