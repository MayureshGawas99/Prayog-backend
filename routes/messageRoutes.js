const express = require("express");

const { authenticateJWT } = require("../middlewares/middlewares");
const {
  allMessages,
  sendMessage,
} = require("../controllers/messageControllers");

const router = express.Router();

router.route("/:chatId").get(authenticateJWT, allMessages);
router.route("/").post(authenticateJWT, sendMessage);

module.exports = router;
