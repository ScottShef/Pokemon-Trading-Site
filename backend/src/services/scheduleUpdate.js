
import dotenv from 'dotenv';
import cron from 'node-cron';
import importAllSets from './ImportAllSets.js'; // Use default import

dotenv.config();

console.log("Scheduler initializing...");

// Schedule daily at 2am server time
cron.schedule("0 2 * * *", async () => {
  console.log(`[${new Date().toISOString()}] Starting daily Pokémon card import...`);
  try {
    // The importAllSets function now handles its own DB connection/disconnection
    await importAllSets();
    console.log(`[${new Date().toISOString()}] Daily import finished successfully!`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Daily import failed:`, err);
  }
}, {
  timezone: "America/New_York" // adjust to your timezone
});

console.log("Scheduler is running. Daily data import will run at 2am server time.");

