const mongoose = require("mongoose");

const pendingUserSchema = mongoose.Schema(
  {
    name: { type: "String", required: true },
    email: { type: "String", unique: true, required: true },
    password: { type: "String", required: true },
    verificationToken: { type: String, required: true },
  },
  { timestaps: true }
);

const PendingUser = mongoose.model("PendingUser", pendingUserSchema);

module.exports = PendingUser;
