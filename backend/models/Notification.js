const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", required: true },
  createdAt:   { type: String, required: true },
  read:        { type: Boolean, default: false },
});

module.exports = mongoose.model("Notification", notificationSchema);