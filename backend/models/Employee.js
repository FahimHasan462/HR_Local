const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const leaveRecordSchema = new mongoose.Schema({
  date:   { type: String, required: true },
  type:   { type: String, enum: ["sick", "casual", "unpaid"], required: true },
  reason: { type: String, required: true },
}, { _id: true });

const employeeSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  role:             { type: String, enum: ["artist", "management", "hr", "IT"], required: true },
  title:            { type: String, required: true },
  email:            { type: String, required: true, unique: true },
  password:         { type: String, required: true },
  avatar:           { type: String },
  bio:              { type: String },
  sickLeave:        { type: Number, default: 0 },
  casualLeave:      { type: Number, default: 0 },
  unpaidLeave:      { type: Number, default: 0 },
  leaves:           [leaveRecordSchema],
});


employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

employeeSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema,"employees");