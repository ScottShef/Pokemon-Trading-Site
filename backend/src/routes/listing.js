
import express from 'express';
import multer from 'multer';
import Listing from '../models/Listing.js';
import authMiddleware from '../middleware/auth.js'; // Make sure this path is correct

const router = express.Router();

// --- Multer Configuration ---
// This middleware is essential for handling file uploads. It processes the
// 'multipart/form-data' sent by your frontend.
const storage = multer.memoryStorage(); // Temporarily stores files in memory
const upload = multer({ storage: storage });

// --- POST /api/listings - Create a new Listing ---
// This is the endpoint your frontend form will submit to.
router.post(
  '/',
  [authMiddleware, upload.array('images', 2)], // Middleware chain
  async (req, res) => {
    try {
      // 1. Check for Files
      // After multer runs, uploaded files are in `req.files`.
      if (!req.files || req.files.length < 2) {
        return res.status(400).json({ msg: 'Please upload images for both front and back.' });
      }

      // 2. Handle Image URLs
      // In a production app, you would upload file buffers from `req.files`
      // to a cloud service (like AWS S3, Cloudinary) here to get back real URLs.
      // For now, we'll use placeholders.
      const imageUrls = [
        `/uploads/${req.files[0].originalname}`,
        `/uploads/${req.files[1].originalname}`
      ];

      // 3. Extract Text Data from Form
      const {
        cardName,
        description,
        price,
        listingType,
        rawCondition,
        gradedData // This arrives as a JSON string
      } = req.body;

      // 4. Construct the Listing Object for the Database
      const newListingData = {
        cardName,
        description,
        price: parseFloat(price),
        listingType,
        imageUrls,
        seller: req.userId, // This `userId` is added to `req` by your authMiddleware
      };

      // 5. Add the Correct Conditional Data
      if (listingType === 'raw') {
        newListingData.rawCondition = rawCondition;
      } else if (listingType === 'graded') {
        newListingData.gradedData = JSON.parse(gradedData); // Parse the string back to an object
      } else {
        return res.status(400).json({ msg: 'A valid listing type is required.' });
      }

      // 6. Save to MongoDB
      const listing = new Listing(newListingData);
      // Your Mongoose model's pre-validate hook will run here automatically
      await listing.save();

      // 7. Send Success Response
      res.status(201).json(listing);

    } catch (err) {
      console.error('Listing creation error:', err.message);
      if (err.name === 'ValidationError') {
        return res.status(400).json({ msg: `Validation Error: ${err.message}` });
      }
      res.status(500).send('Server Error');
    }
  }
);

// --- GET /api/listings - Get all Listings ---
// This route remains useful for your marketplace page.
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find().populate("seller", "username reputation reviewCount");
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;

