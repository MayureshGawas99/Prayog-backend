const express = require("express");

const { authenticateJWT } = require("../middlewares/middlewares");
const { accessChat } = require("../controllers/chatControllers");

const router = express.Router();

router.route("/").post(authenticateJWT, accessChat);
// router.route("/").get(authenticateJWT, fetchChats);
// router.route("/group").post(authenticateJWT, createGroupChat);
// router.route("/rename").put(authenticateJWT, renameGroup);
// router.route("/groupremove").put(authenticateJWT, removeFromGroup);
// router.route("/groupadd").put(authenticateJWT, addToGroup);

module.exports = router;
