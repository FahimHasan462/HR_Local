const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors({
    origin: "http://192.168.0.197:8080", 
    credentials: true,
     methods: ["GET", "POST", "PUT", "DELETE"],
  }));
app.use(express.json());

// Routes
app.use("/api/employees",     require("./routes/employees"));
// app.use("/api/complaints",    require("./routes/complaints"));
// app.use("/api/notifications", require("./routes/notifications"));


mongoose
  .connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DB})
  .then(() => {
    console.log("Connected to Database:", mongoose.connection.name);
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed:", err);
  });