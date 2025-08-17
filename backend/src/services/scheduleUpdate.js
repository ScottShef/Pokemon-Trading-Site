// this file is responsible for scheduling daily updates of Pokémon card data from the PokePrice API

// src/services/scheduler.js
require("dotenv").config();
const cron = require("node-cron");
const mongoose = require("mongoose");
const importAllSets = require("./ImportAllSets");

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected for scheduler"))
  .catch(err => console.error("MongoDB connection error:", err));

// Schedule daily at 2am server time
cron.schedule("0 2 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Starting daily Pokémon card import...`);
  try {
    await importAllSets();
    console.log(`[${new Date().toISOString()}] Daily import finished!`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Daily import failed:`, err);
  }
}, {
  timezone: "America/New_York" // adjust to your timezone
});

console.log("Scheduler running. Daily import will run at 2am server time.");
