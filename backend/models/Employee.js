const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const leaveRecordSchema = new mongoose.Schema({
  date:   { type: String, required: true },
  type:   { type: String, enum: ["sick", "casual", "paid", "unpaid"], required: true },
  reason: { type: String, required: true },
}, { _id: true });

const employeeSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  role:             { type: String, enum: ["artist", "management", "hr", "IT"], required: true },
  title:            { type: String, required: true },
  department:       { type: String },
  email:            { type: String, required: true, unique: true },
  password:         { type: String, required: true },
  avatar:           { type: String },
  bio:              { type: String },
  phone:            { type: String },
  joined:           { type: String },
  nid:              { type: String },
  presentAddress:   { type: String },
  permanentAddress: { type: String },
  sickLeave:        { type: Number, default: 0 },
  casualLeave:      { type: Number, default: 0 },
  unpaidLeave:      { type: Number, default: 0 },
  leaves:           [leaveRecordSchema],
  leavesYear:       { type: Number },
  unpaidMonthKey:   { type: String },
  lastBonusNotifiedYear: { type: Number },
});


employeeSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema,"employees");