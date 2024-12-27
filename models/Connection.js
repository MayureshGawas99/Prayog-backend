const mongoose = require("mongoose");

const connectionModel = mongoose.Schema(
  {
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    acceptedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Connection = mongoose.model("Connection", connectionModel);

module.exports = Connection;
