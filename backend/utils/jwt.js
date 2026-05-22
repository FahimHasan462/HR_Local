const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "hr-local-dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function signToken(employee) {
  return jwt.sign(
    { sub: String(employee._id), email: employee.email, role: employee.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken, JWT_SECRET };
