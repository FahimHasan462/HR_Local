const router = require("express").Router();
const Employee = require("../models/Employee");
const SheetConfig = require("../models/SheetConfig");
const authMiddleware = require("../middleware/auth");
const managementOnly = require("../middleware/managementOnly");
const { SHEET_CONFIG_SEED } = require("../data/sheetConfigSeed");
const { fetchCutsForArtist, fetchCutsGroupedByArtist } = require("../utils/sheetCuts");

router.use(authMiddleware);

const normalizeStatus = (status) => status.trim().toLowerCase();

function countStatuses(cuts) {
  const counts = new Map();

  for (const cut of cuts) {
    const key = normalizeStatus(cut.status) || "unknown";
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { key, label: cut.status.trim() || "Unknown", count: 1 });
    }
  }

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

function mergeStatusColumns(artistStatuses) {
  const merged = new Map();

  for (const statuses of artistStatuses) {
    for (const status of statuses) {
      const existing = merged.get(status.key);
      if (!existing) {
        merged.set(status.key, { key: status.key, label: status.label });
      }
    }
  }

  return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label));
}

router.get("/overview", managementOnly, async (req, res) => {
  try {
    const employees = await Employee.find({
      sheetName: { $exists: true, $ne: "" },
    }).select("name sheetName role");

    const sheetNameToEmployee = new Map();
    for (const employee of employees) {
      const sheetName = employee.sheetName?.trim();
      if (sheetName) {
        sheetNameToEmployee.set(sheetName, employee);
      }
    }

    const dbConfigs = await SheetConfig.find();
    const configs = dbConfigs.length > 0 ? dbConfigs : SHEET_CONFIG_SEED;
    const projects = {};

    await Promise.all(
      configs.map(async (config) => {
        try {
          const byArtist = await fetchCutsGroupedByArtist(config.sheetUrl);
          const artists = [];

          for (const [sheetName, cuts] of byArtist.entries()) {
            if (cuts.length === 0) continue;

            const employee = sheetNameToEmployee.get(sheetName);
            const statuses = countStatuses(cuts);

            artists.push({
              employeeId: employee?._id?.toString() ?? null,
              name: employee?.name ?? sheetName,
              sheetName,
              total: cuts.length,
              statuses,
              cuts,
            });
          }

          artists.sort((a, b) => a.name.localeCompare(b.name));

          if (!projects[config.project]) {
            projects[config.project] = {};
          }

          projects[config.project][config.episode] = {
            statuses: mergeStatusColumns(artists.map((artist) => artist.statuses)),
            artists,
          };
        } catch (error) {
          console.error(
            `Failed to load overview for ${config.project} ${config.episode}:`,
            error.message,
          );
        }
      }),
    );

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const employee = await Employee.findById(req.auth.sub);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }

    const sheetName = employee.sheetName?.trim();
    if (!sheetName) {
      return res.json({});
    }

    const dbConfigs = await SheetConfig.find();
    const configs = dbConfigs.length > 0 ? dbConfigs : SHEET_CONFIG_SEED;
    const grouped = {};

    await Promise.all(
      configs.map(async (config) => {
        try {
          const cuts = await fetchCutsForArtist(config.sheetUrl, sheetName);
          if (cuts.length === 0) return;

          if (!grouped[config.project]) {
            grouped[config.project] = {};
          }
          grouped[config.project][config.episode] = cuts;
        } catch (error) {
          console.error(
            `Failed to load sheet for ${config.project} ${config.episode}:`,
            error.message,
          );
        }
      }),
    );

    res.json(grouped);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
