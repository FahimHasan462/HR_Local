const router = require("express").Router();
const Employee = require("../models/Employee");

router.get("/", async (req, res) => {
   try {
    const employees = await Employee.find();  
    res.json(employees);                      
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;