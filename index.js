// server.js

// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const commentRoutes = require("./routes/commentRoutes");
const cors = require("cors");

require("dotenv").config(); // Load environment variables from .env file

const app = express();

// Middleware to serve static files (if you want to serve static content)
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// MongoDB connection
const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Basic route
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use("/api/user", userRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/comment", commentRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
