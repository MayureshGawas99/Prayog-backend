const express = require("express");
const {
  test,
  registerUser,
  VerifyUser,
  loginUser,
  searchUsers,
  getMyDetails,
  getUserDetails,
  updateUserProfile,
} = require("../controllers/userControllers");
const { authenticateJWT } = require("../middlewares/middlewares");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/verify/:token").get(VerifyUser);
router.route("/search").get(authenticateJWT, searchUsers);
router.route("/details/self").get(authenticateJWT, getMyDetails);
router.route("/details/:userId").get(authenticateJWT, getUserDetails);
router.put("/update", authenticateJWT, updateUserProfile);

module.exports = router;
