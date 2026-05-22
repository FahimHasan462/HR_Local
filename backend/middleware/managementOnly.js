/** Restrict route to management users (requires authMiddleware first). */
function managementOnly(req, res, next) {
  if (req.auth?.role !== "management") {
    return res.status(403).json({ message: "Management access only." });
  }
  next();
}

module.exports = managementOnly;
