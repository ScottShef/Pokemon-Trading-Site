import express from 'express';
import multer from 'multer';
import Listing from '../models/Listing.js';
import authMiddleware from '../middleware/auth.js'; // Make sure this path is correct

const router = express.Router();

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- POST /api/listings - Create a new Listing ---
router.post(
  '/',
  [authMiddleware, upload.array('images', 2)],
  async (req, res) => {
    try {
      if (!req.files || req.files.length < 2) {
        return res.status(400).json({ msg: 'Please upload images for both front and back.' });
      }

      const imageUrls = [
        `/uploads/${req.files[0].originalname}`,
        `/uploads/${req.files[1].originalname}`
      ];

      const { cardName, description, price, listingType, rawCondition, gradedData } = req.body;

      const newListingData = {
        cardName,
        description,
        price: parseFloat(price),
        listingType,
        imageUrls,
        seller: req.userId, // authMiddleware must attach userId to req
      };

      if (listingType === 'raw') {
        newListingData.rawCondition = rawCondition;
      } else if (listingType === 'graded') {
        newListingData.gradedData = JSON.parse(gradedData);
      } else {
        return res.status(400).json({ msg: 'A valid listing type is required.' });
      }

      const listing = new Listing(newListingData);
      await listing.save();

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
router.get("/", async (req, res) => {
  try {
    const listings = await Listing.find()
      .populate({
        path: "seller",
        select: "username reputation reviewCount",
      })
      .lean(); // makes Mongoose objects plain JS objects
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
