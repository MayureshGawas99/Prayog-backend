const express = require("express");

const { authenticateJWT } = require("../middlewares/middlewares");
const {
  accessChat,
  fetchChats,
  fetchAcceptedChats,
  fetchPendingChats,
  acceptChat,
  rejectChat,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
  leaveGroup,
  checkChat,
  fetchGroupChats,
  deleteGroup,
} = require("../controllers/chatControllers");

const router = express.Router();

router.route("/").get(authenticateJWT, fetchChats);
router.route("/check/:userId").get(authenticateJWT, checkChat);
router.route("/accepted").get(authenticateJWT, fetchAcceptedChats);
router.route("/pending").get(authenticateJWT, fetchPendingChats);
router.route("/user/:userId").get(authenticateJWT, accessChat);
router.route("/accept/:chatId").get(authenticateJWT, acceptChat);
router.route("/reject/:chatId").get(authenticateJWT, rejectChat);
router.route("/group").get(authenticateJWT, fetchGroupChats);
router.route("/group/create").post(authenticateJWT, createGroupChat);
router.route("/group/rename").put(authenticateJWT, renameGroup);
router.route("/group/remove").put(authenticateJWT, removeFromGroup);
router.route("/group/add").put(authenticateJWT, addToGroup);
router.route("/group/leave").put(authenticateJWT, leaveGroup);
router.route("/group/delete/:chatId").delete(authenticateJWT, deleteGroup);

module.exports = router;
