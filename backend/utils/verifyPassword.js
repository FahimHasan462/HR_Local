const bcrypt = require("bcryptjs");

/** Supports bcrypt hashes and legacy plain-text passwords from manual DB inserts. */
async function verifyPassword(enteredPassword, storedPassword) {
  if (!storedPassword) return false;

  const isBcryptHash =
    typeof storedPassword === "string" &&
    (storedPassword.startsWith("$2a$") ||
      storedPassword.startsWith("$2b$") ||
      storedPassword.startsWith("$2y$"));

  if (isBcryptHash) {
    return bcrypt.compare(enteredPassword, storedPassword);
  }

  return enteredPassword === storedPassword;
}

module.exports = verifyPassword;
