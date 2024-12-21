const express = require("express");
const { fetchuser, haveUser } = require("../middlewares/middlewares");
const {
  createComment,
  editComment,
  likeComment,
  getProjectComments,
  getCommentReplies,
  deleteComment,
} = require("../controllers/commentControllers");

const router = express.Router();

router.route("/create").post(fetchuser, createComment);
router.route("/edit").put(fetchuser, editComment);
router.route("/like/:commentId").get(fetchuser, likeComment);
router.route("/get-comments/:projectId").get(haveUser, getProjectComments);
router.route("/get-replies/:commentId").get(haveUser, getCommentReplies);
router.route("/delete/:commentId").delete(fetchuser, deleteComment);

module.exports = router;
