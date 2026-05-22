const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["complaint", "bonus", "registration"],
    default: "complaint",
  },
  complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint" },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  bonusYear: { type: Number },
  bonusStatus: {
    type: String,
    enum: ["pending", "provided"],
    default: "pending",
  },
  subject: { type: String },
  message: { type: String },
  createdAt: { type: String, required: true },
  read: { type: Boolean, default: false },
});

module.exports = mongoose.model("Notification", notificationSchema);
