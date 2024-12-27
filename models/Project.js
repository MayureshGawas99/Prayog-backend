const { admin } = require("googleapis/build/src/apis/admin");
const mongoose = require("mongoose");

const defaultImages = [
  "https://res.cloudinary.com/djuseai07/image/upload/v1734519942/1679422597271_jjgtts.jpg",
  "https://www.liquidplanner.com/wp-content/uploads/2019/04/HiRes-17.jpg",
  "https://sourcebae.com/blog/wp-content/uploads/2023/09/project-planning-header@2x-678x381-1.png",
  "https://info.erdosmiller.com/hubfs/project%20management.jpg",
  "https://es.celoxis.com/cassets/img/pmc/project-management.png",
  "https://img.freepik.com/premium-vector/project-management-marketing-analysis-development-online-successful-strategy-motivation_501813-2156.jpg",
  "https://www.teamly.com/blog/wp-content/uploads/2021/12/Transparency-in-project-management.png",
];

// Function to return a random image URL
function getRandomDefaultImage() {
  return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

const projectSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    tags: { type: [String], required: false },
    description: { type: String, required: false },
    techstacks: { type: [String], required: false },
    collaborators: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    ],
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    file: { type: String, required: false },
    img: {
      type: "String",
      required: false,
      default: getRandomDefaultImage,
    },
    likeCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    commentCount: { type: Number, default: 0 },
    totalCommentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
