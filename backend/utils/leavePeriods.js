const CURRENT_YEAR = () => new Date().getFullYear();
const CURRENT_MONTH_KEY = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}`;
};

const leaveYear = (dateStr) => {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? CURRENT_YEAR() : d.getFullYear();
};

const leaveMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return CURRENT_MONTH_KEY();
  return `${d.getFullYear()}-${d.getMonth()}`;
};

/** Apply yearly leave reset and monthly unpaid refresh on the employee document. */
async function syncEmployeeLeavePeriods(employee) {
  const year = CURRENT_YEAR();
  const monthKey = CURRENT_MONTH_KEY();
  let changed = false;

  if (employee.leavesYear !== year) {
    employee.leaves = [];
    employee.sickLeave = 0;
    employee.casualLeave = 0;
    employee.leavesYear = year;
    changed = true;
  }

  if (employee.unpaidMonthKey !== monthKey) {
    employee.unpaidMonthKey = monthKey;
    changed = true;
  }

  const unpaidThisMonth = (employee.leaves ?? []).filter(
    (l) => l.type === "unpaid" && leaveMonthKey(l.date) === monthKey,
  ).length;

  if (employee.unpaidLeave !== unpaidThisMonth) {
    employee.unpaidLeave = unpaidThisMonth;
    changed = true;
  }

  const sickCount = (employee.leaves ?? []).filter((l) => l.type === "sick").length;
  const casualCount = (employee.leaves ?? []).filter(
    (l) => l.type === "casual" || l.type === "paid",
  ).length;

  if (employee.sickLeave !== sickCount) {
    employee.sickLeave = sickCount;
    changed = true;
  }
  if (employee.casualLeave !== casualCount) {
    employee.casualLeave = casualCount;
    changed = true;
  }

  if (changed) {
    await employee.save({ validateModifiedOnly: true });
  }

  return employee;
}

function getDisplayLeaves(leaves = []) {
  const year = CURRENT_YEAR();
  return leaves
    .filter((l) => leaveYear(l.date) === year)
    .sort((a, b) => b.date.localeCompare(a.date));
}

module.exports = {
  CURRENT_YEAR,
  CURRENT_MONTH_KEY,
  leaveYear,
  leaveMonthKey,
  syncEmployeeLeavePeriods,
  getDisplayLeaves,
};
