const Notification = require("../models/Notification");

function parseJoinedDate(joined) {
  if (!joined) return null;
  const d = new Date(joined);
  if (!Number.isNaN(d.getTime())) return d;
  const parsed = new Date(`${joined} 1`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Employee completed at least one full year and we are in their anniversary month. */
function isBonusEligible(joined) {
  const joinedDate = parseJoinedDate(joined);
  if (!joinedDate) return false;

  const today = new Date();
  const oneYearAnniversary = new Date(joinedDate);
  oneYearAnniversary.setFullYear(oneYearAnniversary.getFullYear() + 1);

  if (today < oneYearAnniversary) return false;

  return (
    today.getMonth() === joinedDate.getMonth() &&
    today.getFullYear() > joinedDate.getFullYear()
  );
}

async function ensureBonusNotifications(employees) {
  const year = new Date().getFullYear();
  const created = [];

  for (const employee of employees) {
    if (!isBonusEligible(employee.joined)) continue;
    if (employee.lastBonusNotifiedYear === year) continue;

    const existing = await Notification.findOne({
      type: "bonus",
      employeeId: employee._id,
      bonusYear: year,
    });
    if (existing) {
      employee.lastBonusNotifiedYear = year;
      await employee.save({ validateModifiedOnly: true });
      continue;
    }

    const joinedDate = parseJoinedDate(employee.joined);
    const yearsCompleted = joinedDate
      ? new Date().getFullYear() - joinedDate.getFullYear()
      : 1;

    const notification = await Notification.create({
      type: "bonus",
      employeeId: employee._id,
      bonusYear: year,
      bonusStatus: "pending",
      subject: `${employee.name} — bonus eligible`,
      message: `${employee.name} has completed ${yearsCompleted} year(s). Joined ${joinedDate?.toLocaleDateString() ?? employee.joined}. Review bonus eligibility.`,
      createdAt: new Date().toISOString(),
      read: false,
    });

    employee.lastBonusNotifiedYear = year;
    await employee.save({ validateModifiedOnly: true });
    created.push(notification);
  }

  return created;
}

module.exports = { isBonusEligible, ensureBonusNotifications, parseJoinedDate };
