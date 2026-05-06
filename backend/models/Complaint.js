const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  filedAt:           { type: String, required: true },
  complainantId:     { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  againstEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  subject:           { type: String, required: true },
  details:           { type: String, required: true },
});

module.exports = mongoose.model("Complaint", complaintSchema);