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
  sendConnectionRequest,
  acceptConnectionRequest,
  getConnectionRequests,
  rejectConnectionRequest,
  getConnections,
  getNetwork,
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
router.get("/connections", authenticateJWT, getConnections);
router.get("/network", authenticateJWT, getNetwork);

router.get("/connection/requests", authenticateJWT, getConnectionRequests);
router.get(
  "/connection/request/:userId",
  authenticateJWT,
  sendConnectionRequest
);
router.get(
  "/connection/accept/:userId",
  authenticateJWT,
  acceptConnectionRequest
);
router.get(
  "/connection/reject/:userId",
  authenticateJWT,
  rejectConnectionRequest
);

module.exports = router;
