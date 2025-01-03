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
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    skills: { type: [String], required: false },
    pic: {
      type: "String",
      required: true,
      default:
        "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
    },
  },
  { timestaps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
