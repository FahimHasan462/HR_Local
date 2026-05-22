const router = require("express").Router();
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/auth");
const findEmployeeByEmail = require("../utils/findEmployeeByEmail");
const verifyPassword = require("../utils/verifyPassword");
const { signToken } = require("../utils/jwt");
const { syncEmployeeLeavePeriods, getDisplayLeaves, CURRENT_YEAR } = require("../utils/leavePeriods");
const { ensureBonusNotifications } = require("../utils/bonusNotifications");
const Notification = require("../models/Notification");

const SICK_LEAVE_TOTAL = 12;
const PAID_LEAVE_TOTAL = 12;

const toDbLeaveType = (type) => (type === "paid" ? "casual" : type);

const avatarForRole = (role) =>
  role === "artist" ? "🎨" : role === "management" ? "🎬" : role === "IT" ? "🖥️" : "💼";

const formatEmployee = (employee) => {
  const doc = employee.toObject ? employee.toObject() : employee;
  const { password, casualLeave, ...rest } = doc;
  const displayLeaves = getDisplayLeaves(doc.leaves ?? []);

  return {
    ...rest,
    paidLeave: casualLeave ?? 0,
    unpaidLeave: doc.unpaidLeave ?? 0,
    sickLeaveTotal: SICK_LEAVE_TOTAL,
    paidLeaveTotal: PAID_LEAVE_TOTAL,
    leaves: displayLeaves.map((leave) => ({
      ...leave.toObject?.() ?? leave,
      type: leave.type === "casual" ? "paid" : leave.type,
    })),
  };
};

async function prepareEmployee(employee) {
  await syncEmployeeLeavePeriods(employee);
  return formatEmployee(employee);
}

async function matchCredentials(employee, password) {
  const matched = await verifyPassword(password, employee.password);
  if (!matched) return false;

  const isBcryptHash =
    typeof employee.password === "string" &&
    (employee.password.startsWith("$2a$") ||
      employee.password.startsWith("$2b$") ||
      employee.password.startsWith("$2y$"));

  if (!isBcryptHash) {
    employee.password = password;
    await employee.save();
  }

  return true;
}

// --- Public routes (no JWT) ---

router.post("/register", async (req, res) => {
  const { name, email, password, phone, nid, presentAddress, permanentAddress } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }

  try {
    const existing = await findEmployeeByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const employee = await Employee.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone?.trim() ?? "",
      nid: nid?.trim() ?? "",
      presentAddress: presentAddress?.trim() ?? "",
      permanentAddress: permanentAddress?.trim() ?? "",
      role: "artist",
      title: "Pending HR approval",
      department: "General",
      joined: new Date().toISOString().slice(0, 10),
      avatar: "🎨",
      bio: "Awaiting HR approval",
      leavesYear: CURRENT_YEAR(),
    });

    await Notification.create({
      type: "registration",
      employeeId: employee._id,
      subject: `New registration: ${employee.name}`,
      message: `${employee.name} (${employee.email}) registered and is awaiting HR approval.`,
      createdAt: new Date().toISOString(),
      read: false,
    });

    res.status(201).json({
      message: "Registration successful. Please wait for HR approval.",
      employee: formatEmployee(employee),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const isMatch = await matchCredentials(employee, password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (employee.email !== normalizedEmail) {
      await Employee.updateOne({ _id: employee._id }, { $set: { email: normalizedEmail } });
      employee.email = normalizedEmail;
    }

    const token = signToken(employee);
    res.json({
      message: "Login successful",
      token,
      employee: await prepareEmployee(employee),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Email and new password are required." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  try {
    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    employee.password = password;
    await employee.save({ validateModifiedOnly: true });

    res.json({ message: "Password updated successfully. You can log in with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  req.body.confirmPassword = req.body.confirmPassword ?? req.body.password;
  const { email, password, confirmPassword } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "Email and new password are required." });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  try {
    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return res.status(404).json({ message: "No account found with this email." });
    }
    employee.password = password;
    await employee.save({ validateModifiedOnly: true });
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// --- Protected routes (JWT required) ---

router.use(authMiddleware);

router.get("/me", async (req, res) => {
  try {
    const employee = await Employee.findById(req.auth.sub);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ employee: await prepareEmployee(employee) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  const {
    name,
    role,
    title,
    department,
    email,
    phone,
    joined,
    nid,
    presentAddress,
    permanentAddress,
    bio,
  } = req.body;

  if (!name?.trim() || !email?.trim() || !title?.trim() || !role) {
    return res.status(400).json({ message: "Name, email, title, and role are required." });
  }

  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await findEmployeeByEmail(normalizedEmail);
    if (duplicate && String(duplicate._id) !== String(employee._id)) {
      return res.status(409).json({ message: "Another employee already uses this email." });
    }

    employee.name = name.trim();
    employee.role = role;
    employee.title = title.trim();
    employee.department = department?.trim() ?? role.toUpperCase();
    employee.email = normalizedEmail;
    employee.phone = phone?.trim() ?? "";
    employee.joined = joined ?? employee.joined;
    employee.nid = nid?.trim() ?? "";
    employee.presentAddress = presentAddress?.trim() ?? "";
    employee.permanentAddress = permanentAddress?.trim() ?? "";
    if (bio !== undefined) employee.bio = bio?.trim() ?? employee.bio;
    employee.avatar = avatarForRole(role);

    await employee.save({ validateModifiedOnly: true });
    res.json({ employee: await prepareEmployee(employee) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const {
    name,
    role,
    title,
    department,
    email,
    phone,
    joined,
    nid,
    presentAddress,
    permanentAddress,
    password,
    avatar,
    bio,
    projects,
  } = req.body;

  if (!name?.trim() || !email?.trim() || !title?.trim() || !role) {
    return res.status(400).json({ message: "Name, email, title, and role are required." });
  }

  try {
    const existing = await findEmployeeByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An employee with this email already exists." });
    }

    const employee = await Employee.create({
      name: name.trim(),
      role,
      title: title.trim(),
      department: department?.trim() ?? role.toUpperCase(),
      email: email.trim().toLowerCase(),
      password: password?.trim() || "ChangeMe123!",
      phone: phone?.trim() ?? "",
      joined: joined ?? new Date().toISOString().slice(0, 10),
      nid: nid?.trim() ?? "",
      presentAddress: presentAddress?.trim() ?? "",
      permanentAddress: permanentAddress?.trim() ?? "",
      avatar: avatar ?? (role === "artist" ? "🎨" : role === "management" ? "🎬" : role === "IT" ? "🖥️" : "💼"),
      bio: bio?.trim() || "Newest member of the crew ✨",
      projects: projects ?? [],
      leaves: [],
      leavesYear: CURRENT_YEAR(),
    });

    res.status(201).json({ employee: await prepareEmployee(employee) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.post("/:id/leave", async (req, res) => {
  const { type, reason, date } = req.body;
  const leaveType = toDbLeaveType(type);

  if (!["sick", "casual", "paid", "unpaid"].includes(leaveType)) {
    return res.status(400).json({ message: "Invalid leave type." });
  }
  if (!reason?.trim()) {
    return res.status(400).json({ message: "Leave reason is required." });
  }

  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const recordDate = date || new Date().toISOString().slice(0, 10);
    employee.leaves.unshift({
      date: recordDate,
      type: leaveType,
      reason: reason.trim(),
    });

    await employee.save({ validateModifiedOnly: true });
    res.status(201).json({ employee: await prepareEmployee(employee) });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee removed" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

router.get("/all-employees-info", async (req, res) => {
  try {
    const employees = await Employee.find();
    for (const employee of employees) {
      await syncEmployeeLeavePeriods(employee);
    }
    if (req.auth?.role === "hr") {
      await ensureBonusNotifications(employees);
    }
    res.json(employees.map(formatEmployee));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
