const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    name: { type: "String", required: true },
    email: { type: "String", unique: true, required: true },
    password: { type: "String", required: true },
    organization: { type: "String", required: false },
    headline: { type: "String", required: false },
    about: {
      type: "String",
      required: false,
    },
    skills: { type: [String], required: false },
    pic: {
      type: "String",
      required: true,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
    likedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: "blog" }],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "comment",
      },
    ],
    likedComments: [{ type: mongoose.Schema.Types.ObjectId, ref: "comment" }],
  },
  { timestaps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
