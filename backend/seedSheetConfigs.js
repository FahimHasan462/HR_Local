require("dotenv").config();
const mongoose = require("mongoose");
const SheetConfig = require("./models/SheetConfig");
const { SHEET_CONFIG_SEED } = require("./data/sheetConfigSeed");

async function seedSheetConfigs() {
  for (const config of SHEET_CONFIG_SEED) {
    await SheetConfig.findOneAndUpdate(
      { project: config.project, episode: config.episode },
      config,
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB });
  await seedSheetConfigs();
  console.log(`Seeded ${SHEET_CONFIG_SEED.length} sheet configs`);
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seedSheetConfigs };
