const Project = require("../models/Project");
const fs = require("fs");
const { default: mongoose } = require("mongoose");
const sfs = require("fs").promises;
const path = require("path");
const { use } = require("../routes/projectRoutes");
const { get } = require("http");

const createProject = async (req, res) => {
  try {
    console.log(req.user);
    const file = req.file?.path || "";
    const { title, description, tags, techstacks, collaborators, img } =
      req.body;
    const allData = {
      title,
      description,
      file,
      tags: JSON.parse(tags || "[]"),
      techstacks: JSON.parse(techstacks || "[]"),
      collaborators: JSON.parse(collaborators || "[]"),
      admin: req.user._id,
    };
    if (img) {
      allData.img = img;
    }
    const newData = new Project(allData);
    await newData.save();

    res
      .status(201)
      .send({ message: "File uploaded and data saved successfully!" });
  } catch (error) {
    console.error(error);
    const filePath = req.file?.path || "";
    if (filePath) {
      fs.unlinkSync(`./${filePath}`);
    }

    res.status(500).send({ message: "Error while Uploading" });
  }
};

const updateProject = async (req, res) => {
  try {
    const file = req.file?.path;
    let { title, description, tags, techstacks, collaborators, img } = req.body;
    const projectId = req.params.projectId;
    const old = await Project.findById(projectId).populate("admin");
    if (!old) {
      if (file) {
        fs.unlinkSync(`./${file}`);
      }
      return res.status(404).send({ message: "Project not found" });
    }
    if (old.admin.email !== req.user.email) {
      if (file) {
        fs.unlinkSync(`./${file}`);
      }
      return res.status(401).send({ message: "Unauthorized" });
    }

    if (typeof collaborators === "string") {
      collaborators = JSON.parse(collaborators); // Parse it to a real array
    }
    console.log(Array.isArray(collaborators));
    console.log(
      collaborators.every((id) => mongoose.Types.ObjectId.isValid(id))
    );
    // Validate the collaborators array
    if (
      !Array.isArray(collaborators) ||
      !collaborators.every((id) => mongoose.Types.ObjectId.isValid(id))
    ) {
      if (file) {
        fs.unlinkSync(`./${file}`);
      }
      return res.status(400).send({ message: "Invalid collaborators array" });
    }

    if (typeof tags === "string") {
      tags = JSON.parse(tags); // Parse it to a real array
    }

    // Validate the collaborators array
    if (!Array.isArray(tags)) {
      if (file) {
        fs.unlinkSync(`./${file}`);
      }
      return res.status(400).send({ message: "Invalid Tags array" });
    }

    if (typeof techstacks === "string") {
      techstacks = JSON.parse(techstacks); // Parse it to a real array
    }

    // Validate the collaborators array
    if (!Array.isArray(techstacks)) {
      if (file) {
        fs.unlinkSync(`./${file}`);
      }
      return res.status(400).send({ message: "Invalid Techstacks array" });
    }

    if (file) {
      const filePath = old.file;
      fs.unlinkSync(`./${filePath}`);
      old.file = file;
    }

    // Update the project with the new collaborators list
    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      {
        $set: {
          collaborators,
          title,
          description,
          img,
          techstacks,
          tags,
          file,
        },
      }, // Replace the collaborators array with the new list
      { new: true } // Return the updated project
    );

    // Send the updated project data
    res.status(200).send(updatedProject);
  } catch (error) {
    console.log(error);
    const file = req.file?.path;
    if (file) {
      fs.unlinkSync(`./${file}`);
    }
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    // console.log(req.params);
    const project = await Project.findById(projectId).populate("admin");
    if (!project) {
      return res.status(404).send({ message: "Project Not Found" });
    }
    if (project.admin.email !== req.user.email) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    const removedDoc = await Project.findByIdAndDelete(projectId);
    console.log("Removed document:", removedDoc);
    const filePath = removedDoc.file;
    fs.unlinkSync(`./${filePath}`);
    res.status(200).send({ message: "Deleted Sucessfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error While Deleting" });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const myAdminProjects = await Project.find({ admin: req.user._id })
      .populate("collaborators")
      .populate("admin");
    const myCollaboratorProjects = await Project.find({
      collaborators: req.user._id,
    })
      .populate("collaborators")
      .populate("admin");
    res.status(200).send({
      projects: myAdminProjects,
      collaboratedProjects: myCollaboratorProjects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const getUserProjects = async (req, res) => {
  try {
    const { userId } = req.params;
    const myAdminProjects = await Project.find({ admin: userId })
      .populate("collaborators")
      .populate("admin");
    const myCollaboratorProjects = await Project.find({
      collaborators: userId,
    })
      .populate("collaborators")
      .populate("admin");
    res.status(200).send({
      projects: myAdminProjects,
      collaboratedProjects: myCollaboratorProjects,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const limit = parseInt(req.query.limit) || 6; // Number of projects per page, default to 10
    const totalPages = Math.ceil(totalProjects / limit); // Total number of pages
    const startIndex = (page - 1) * limit;

    // Find all projects, sort by timestamp in descending order, and apply pagination
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate("admin")
      .populate("collaborators");

    // Send the paginated projects as a response
    res.send({ totalPages, projects: recentProjects });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const getProjectFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    const filePath = project.file;
    console.log(filePath);
    const rootPath = path.resolve(__dirname, "../");
    console.log(path.basename(filePath), "filename");
    const fullPath = path.join(rootPath, "uploads", filePath.substring(8));
    console.log(fullPath, "fullpath");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");
    res.status(200).sendFile(fullPath);
  } catch (error) {
    console.log(error);
    res.status(404).send({ message: "File Not Found" });
  }
};

const getSingleProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Use Mongoose to find the project by ID and populate the fields
    const project = await Project.findById(projectId)
      .populate("collaborators")
      .populate("admin");

    if (!project) {
      return res.status(404).send({ message: "Project not found" });
    }

    // Send the populated project details as a JSON response
    res.send(project);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const likeProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).send({ message: "Project not Found" });
    }
    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    let message = "";
    if (req.user.likedProjects.some((id) => id.equals(projectObjectId))) {
      req.user.likedProjects = req.user.likedProjects.filter(
        (id) => !id.equals(projectObjectId)
      );
      project.likeCount -= 1;
      message = "Disliked the Project";
    } else {
      req.user.likedProjects.push(projectId);
      project.likeCount += 1;
      message = "Liked the Project";
    }
    const updatedProject = await project.save();
    const updatedUser = await req.user.save();
    return res.status(200).send({ message, updatedProject, updatedUser });
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = {
  createProject,
  updateProject,
  deleteProject,
  getMyProjects,
  getUserProjects,
  getAllProjects,
  getSingleProject,
  getProjectFile,
  likeProject,
};
