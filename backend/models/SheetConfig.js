const mongoose = require("mongoose");

const sheetConfigSchema = new mongoose.Schema({
  project:  { type: String, required: true, trim: true },
  episode:  { type: String, required: true, trim: true },
  sheetUrl: { type: String, required: true, trim: true },
});

module.exports = mongoose.model("SheetConfig", sheetConfigSchema, "sheet_configs");
