const router = require("express").Router();
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const authMiddleware = require("../middleware/auth");
const hrOnly = require("../middleware/hrOnly");

router.use(authMiddleware);

router.post("/", async (req, res) => {
  const { complainantId, againstEmployeeId, subject, details } = req.body;

  if (!complainantId || !againstEmployeeId || !subject?.trim() || !details?.trim()) {
    return res.status(400).json({ message: "All complaint fields are required." });
  }

  try {
    const filedAt = new Date().toISOString();
    const complaint = await Complaint.create({
      filedAt,
      complainantId,
      againstEmployeeId,
      subject: subject.trim(),
      details: details.trim(),
    });

    await Notification.create({
      type: "complaint",
      complaintId: complaint._id,
      subject: `Complaint: ${subject.trim()}`,
      message: "A confidential complaint was filed. Open HR complaints for full details.",
      createdAt: filedAt,
      read: false,
    });

    // Notification is for HR only — not returned to the complainant
    res.status(201).json({ complaint, message: "Complaint submitted to HR." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", hrOnly, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ filedAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
