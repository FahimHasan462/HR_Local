const router = require("express").Router();
const SheetConfig = require("../models/SheetConfig");
const authMiddleware = require("../middleware/auth");
const hrOnly = require("../middleware/hrOnly");

router.use(authMiddleware);
router.use(hrOnly);

router.get("/config", async (_req, res) => {
  try {
    const configs = await SheetConfig.find().sort({ project: 1, episode: 1 });
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/config", async (req, res) => {
  const { project, episode, sheetUrl } = req.body;

  if (!project?.trim() || !episode?.trim() || !sheetUrl?.trim()) {
    return res.status(400).json({ message: "Project, episode, and sheet URL are required." });
  }

  try {
    const config = await SheetConfig.create({
      project: project.trim(),
      episode: episode.trim(),
      sheetUrl: sheetUrl.trim(),
    });
    res.status(201).json(config);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/config/:id", async (req, res) => {
  const { project, episode, sheetUrl } = req.body;

  if (!project?.trim() || !episode?.trim() || !sheetUrl?.trim()) {
    return res.status(400).json({ message: "Project, episode, and sheet URL are required." });
  }

  try {
    const config = await SheetConfig.findByIdAndUpdate(
      req.params.id,
      {
        project: project.trim(),
        episode: episode.trim(),
        sheetUrl: sheetUrl.trim(),
      },
      { new: true, runValidators: true },
    );

    if (!config) {
      return res.status(404).json({ message: "Sheet config not found." });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/config/:id", async (req, res) => {
  try {
    const config = await SheetConfig.findByIdAndDelete(req.params.id);
    if (!config) {
      return res.status(404).json({ message: "Sheet config not found." });
    }
    res.json({ message: "Sheet config deleted." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
