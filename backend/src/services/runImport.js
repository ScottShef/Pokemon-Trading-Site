// runImport.js
const importAllSets = require('./ImportAllSets');

(async () => {
  try {
    await importAllSets();
    console.log("All sets imported successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error importing sets:", err);
    process.exit(1);
  }
})();