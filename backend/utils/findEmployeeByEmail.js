const Employee = require("../models/Employee");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive email lookup for legacy mixed-case records in MongoDB. */
async function findEmployeeByEmail(email) {
  const trimmed = email?.trim();
  if (!trimmed) return null;

  return Employee.findOne({
    email: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
  });
}

module.exports = findEmployeeByEmail;
