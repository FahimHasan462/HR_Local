const router = require("express").Router();
const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
//reset password
router.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;
  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    employee.password = password; 
    await employee.save();
    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

//Log in route for employees
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const isMatch = await bcrypt.compare(password, employee.password);
    console.log("Password match:", isMatch); // Debugging line
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    res.json({ message: "Login successful", employee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all employees info (for management and HR)
router.get("/all-employees-info", async (req, res) => {
   try {
    const employees = await Employee.find();  
    res.json(employees);                      
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;