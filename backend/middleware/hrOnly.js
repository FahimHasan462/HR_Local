/** Restrict route to HR users (requires authMiddleware first). */
function hrOnly(req, res, next) {
  if (req.auth?.role !== "hr") {
    return res.status(403).json({ message: "HR access only." });
  }
  next();
}

module.exports = hrOnly;
