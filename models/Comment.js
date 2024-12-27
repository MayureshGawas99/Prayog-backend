const mongoose = require("mongoose");

// Define Comment Schema
const commentSchema = new mongoose.Schema(
  {
    content: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Assuming you have a User model
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    likeCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// Define models
const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
