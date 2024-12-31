// server.js

// Import required modules
const connectDB = require("./config/db");
const express = require("express");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const commentRoutes = require("./routes/commentRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { addUsers } = require("./controllers/databaseControllers");

const app = express();
require("dotenv").config(); // Load environment variables from .env file

// Middleware to serve static files (if you want to serve static content)
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Basic route
app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use("/api/user", userRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Start the server
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
  // addUsers();
});
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  // Setup user socket connection
  socket.on("setup", (userData) => {
    if (!userData?._id) return console.log("User data missing in setup");
    socket.join(userData._id);
    console.log(`User joined personal room: ${userData._id}`);
    socket.emit("connected");
  });

  // Join chat room
  socket.on("join chat", (room) => {
    if (!room) return console.log("Room ID missing");
    socket.join(room);
    console.log("User Joined Room:", room);
  });

  // Handle typing indicators
  socket.on("typing", (room) => {
    if (!room) return console.log("Room ID missing for typing");
    socket.in(room).emit("typing");
  });

  socket.on("stop typing", (room) => {
    if (!room) return console.log("Room ID missing for stop typing");
    socket.in(room).emit("stop typing");
  });

  // Handle new messages
  socket.on("new message", (newMessageRecieved) => {
    if (!newMessageRecieved?.chat || !newMessageRecieved.chat?.users) {
      return console.log("chat or chat.users not defined in new message");
    }
    console.log(newMessageRecieved);

    const { chat } = newMessageRecieved;

    // Emit to all users in the chat except the sender
    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;
      socket.to(user._id).emit("message received", newMessageRecieved);
      console.log(`User ${user._id} sent a message`);
    });
  });

  // Cleanup on disconnect
  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    socket.leaveAll();
  });
});
