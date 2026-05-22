const router = require("express").Router();
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth");
const hrOnly = require("../middleware/hrOnly");

router.use(authMiddleware);
router.use(hrOnly);

router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.patch("/:id/bonus-status", async (req, res) => {
  const { status } = req.body;

  if (!["pending", "provided"].includes(status)) {
    return res.status(400).json({ message: "Status must be pending or provided." });
  }

  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification || notification.type !== "bonus") {
      return res.status(404).json({ message: "Bonus notification not found." });
    }

    notification.bonusStatus = status;
    await notification.save();

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.patch("/mark-read/:id", async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { $set: { read: true } });
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.patch("/mark-all-read", async (req, res) => {
  try {
    await Notification.updateMany({}, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
