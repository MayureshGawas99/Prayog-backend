const express = require("express");
const multer = require("multer");
const { authenticateJWT, fetchuser } = require("../middlewares/middlewares");
const {
  createProject,
  updateProject,
  deleteProject,
  getMyProjects,
  getUserProjects,
  getAllProjects,
  getSingleProject,
  getProjectFile,
  likeProject,
} = require("../controllers/projectControllers");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads"); // Make sure 'uploads' is the correct path to your directory
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });
const router = express.Router();

router.route("/").get(getAllProjects);
router.route("/single/:projectId").get(getSingleProject);
router.route("/pdf/:projectId").get(getProjectFile);
router.route("/my-projects").get(authenticateJWT, getMyProjects);
router.route("/user-projects/:userId").get(authenticateJWT, getUserProjects);
router
  .route("/create")
  .post(authenticateJWT, upload.single("file"), createProject);
router
  .route("/update/:projectId")
  .put(authenticateJWT, upload.single("file"), updateProject);
router.route("/delete/:projectId").delete(authenticateJWT, deleteProject);
router.route("/like/:projectId").get(fetchuser, likeProject);

module.exports = router;
