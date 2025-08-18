

const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema({
  cardName: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true },
  condition: { 
    type: String, 
    enum: ['PSA10', 'PSA9', 'PSA8', 'PSA7', 'PSA6', 'PSA5', 'PSA4', 'PSA3','PSA2', 'PSA1',
                'Mint', 'Near Mint', 'Lightly Played', 'Heavily Played'], 
    required: true 
  },
  
  // --- Key Changes for Multiple Images ---
  imageUrls: {
    type: [String], // Changed from String to an array of Strings
    required: 'Please upload at least two images (front and back).',
    validate: {
      validator: function(imageArray) {
        // This validator function checks if the array exists and has at least 2 items.
        return Array.isArray(imageArray) && imageArray.length >= 2;
      },
      // This message will be sent if the validation fails.
      message: 'At least two images are required for a listing (front and back).'
    }
  },

  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Establishes a relationship with the User model
    required: true 
  }
}, { timestamps: true });

const Listing = mongoose.model("Listing", ListingSchema);

module.exports = { Listing };

// 2. --- How to Fetch the Data for the Frontend ---
// In your backend route that fetches a listing, you use `.populate()`.
// This is an example of how you would get a single listing.

/*
const Listing = require('./models/Listing'); // Adjust path as needed

// Example Express route
app.get('/api/listings/:id', async (req, res) => {
  try {
    // Find the listing by its ID
    const listing = await Listing.findById(req.params.id)
      // .populate() is the magic here!
      // It fetches the seller's details from the User collection.
      // We are specifying to only bring back the username, reputation, and reviewCount.
      .populate('seller', 'username reputation reviewCount'); 

    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found' });
    }

    // Send the combined data to the frontend
    res.json(listing);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});
*/

// 3. --- Example JSON Response Sent to Frontend ---
// This is what the frontend would receive from the API call above.
// Notice how the 'seller' field is now an object with the details you need.
/*
{
  "_id": "some_listing_id",
  "cardName": "Holo Charizard",
  "price": 250,
  "condition": "Near Mint",
  "imageUrl": "/images/charizard.png",
  "seller": {
    "_id": "some_seller_id",
    "username": "CardCollector_Pro",
    "reputation": 98,
    "reviewCount": 57 
  },
  "createdAt": "2025-08-18T12:00:00.000Z",
  "updatedAt": "2025-08-18T12:00:00.000Z"
}
*/

