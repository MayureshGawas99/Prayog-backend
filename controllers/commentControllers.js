const Comment = require("../models/Comment");
const Project = require("../models/Project");
const { isValidMongoId } = require("../utils/utils");

const createComment = async (req, res) => {
  try {
    const { content, projectId, parent } = req.body;
    const author = req.user._id;
    const user = req.user;
    if (!projectId) {
      return res.status(400).send({ message: "projectId is required" });
    }
    if (!isValidMongoId(projectId)) {
      return res
        .status(400)
        .send({ message: "Please provide a valid Project Id" });
    }

    if (!content) {
      return res.status(400).send({ message: "Comment text is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }
    if (!parent) {
      const comment = new Comment({ content, author, projectId: project._id });
      const createdComment = await comment.save();
      const newUser = await user.save();
      project.commentCount += 1;
    } else {
      if (!isValidMongoId(parent)) {
        return res
          .status(400)
          .send({ message: "Please provide a valid Parent Comment Id" });
      }
      const comment = new Comment({
        content,
        author,
        projectId: project._id,
        parent,
      });
      const createdComment = await comment.save();
      const parentComment = await Comment.findById(parent);
      parentComment.replies.push(createdComment._id);
      await parentComment.save();

      const newUser = await user.save();
    }

    project.totalCommentCount += 1;
    await project.save();

    res.status(201).send({ message: "Comment created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(400).send({ message: "commentId is required" });
    }
    if (!isValidMongoId(commentId)) {
      return res
        .status(400)
        .send({ message: "Please provide a valid Comment Id" });
    }
    const user = req.user;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send({ message: "Comment not found" });
    }
    if (!comment.author.equals(user._id)) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    comment.content = "";
    await comment.save();

    res.status(200).send({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const editComment = async (req, res) => {
  try {
    const { commentId, newContent } = req.body;
    const user = req.user;
    if (!commentId) {
      return res.status(400).send({ message: "commentId is required" });
    }
    if (!isValidMongoId(commentId)) {
      return res
        .status(400)
        .send({ message: "Please provide a valid Comment Id" });
    }
    if (!newContent) {
      return res.status(400).send({ message: "newContent is required" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send({ message: "Comment not found" });
    }
    if (!comment.author.equals(user._id)) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    if (comment.content === "") {
      return res.status(400).send({ message: "Comment is already deleted" });
    }

    comment.content = newContent;

    await comment.save();

    return res.status(200).send({ message: "Comment edited successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const user = req.user;

    if (!commentId) {
      return res.status(400).send({ message: "Comment ID is required." });
    }
    if (!isValidMongoId(commentId)) {
      return res
        .status(400)
        .send({ message: "Please provide a valid Comment ID" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send({ message: "Comment not found." });
    }

    // Check if req.user._id is already in likes of comment
    const alreadyLikedIndex = comment.likedBy.indexOf(user._id);

    if (alreadyLikedIndex === -1) {
      // If paper is not liked, like it
      comment.likedBy.push(user._id);

      comment.likeCount++;
      await comment.save();

      return res.status(200).send({ message: "Comment liked successfully." });
    } else {
      // If user_id is already rhere then remove it

      comment.likedBy.splice(alreadyLikedIndex, 1);

      comment.likeCount--;
      await comment.save();
      return res
        .status(200)
        .send({ message: "Comment disliked successfully." });
    }
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).send({ message: "Internal server error." });
  }
};

const getProjectComments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const page = parseInt(req.query.page) || 1; // Get page from query or default to 1
    const limit = 5; // Set the limit of comments per page

    if (!projectId) {
      return res.status(400).send({ message: "projectId is required" });
    }
    if (!isValidMongoId(projectId)) {
      return res
        .status(400)
        .send({ message: "Please provide a valid Project Id" });
    }

    // Fetch top-level comments with pagination
    const topComments = await Comment.find({
      projectId: projectId,
      parent: null,
    })
      .populate("author")
      .populate("replies")
      .sort({ createdAt: -1 })
      .limit(limit * page);

    // Add isLiked property if user is logged in
    if (req.user) {
      const updatedComments = topComments.map((comment) => {
        if (comment.likedBy.includes(req.user._id)) {
          return { ...comment._doc, isLiked: true };
        } else {
          return { ...comment._doc, isLiked: false };
        }
      });

      return res.status(200).send(updatedComments);
    }

    return res.status(200).send(topComments);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    if (!commentId) {
      return res.status(400).send({ message: "commentId is required" });
    }
    if (!isValidMongoId(commentId)) {
      return res
        .status(400)
        .send({ message: "Please provide a valid Comment Id" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send({ message: "Comment not found" });
    }
    const replies = await Comment.find({ parent: commentId })
      .populate("replies")
      .populate("author")
      .sort({ createdAt: -1 });
    if (req.user) {
      const updatedReplies = replies.map((comment) => {
        if (comment.likedBy.includes(req.user._id)) {
          return { ...comment._doc, isLiked: true };
        } else {
          return { ...comment._doc, isLiked: false };
        }
      });

      return res.status(200).send(updatedReplies);
    }

    return res.status(200).send(replies);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = {
  createComment,
  deleteComment,
  editComment,
  getProjectComments,
  likeComment,
  getCommentReplies,
};
