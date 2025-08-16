import express from "express";
import Listing from "../models/Listing.js";

const router = express.Router();

// Create Listing
router.post("/", async (req, res) => {
  try {
    const listing = new Listing(req.body);
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all Listings
router.get("/", async (req, res) => {
  const listings = await Listing.find().populate("owner", "username");
  res.json(listings);
});

export default router;
