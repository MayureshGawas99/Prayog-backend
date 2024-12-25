const PendingUser = require("../models/PendingUser");
const User = require("../models/User");
const uuid = require("uuid");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { email, name, password } = req.body;

  // Validate email format
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).send({ message: "Invalid email format" });
  }

  try {
    // Generate a unique verification token
    const verificationToken = uuid.v4();

    // Create or update the user in the database
    let user = await User.findOne({ email });

    const salt = await bcrypt.genSalt(10); // Generate salt
    const hashedPassword = await bcrypt.hash(password, salt);

    if (!user) {
      let pendingUser = await PendingUser.findOne({ email });
      if (pendingUser) {
        pendingUser.verificationToken = verificationToken;
        pendingUser.password = hashedPassword;
        pendingUser.name = name;
        await pendingUser.save();
      } else {
        user = new PendingUser({
          email,
          name,
          password: hashedPassword,
          verificationToken,
        });
        await user.save();
      }
    } else {
      return res.status(400).send({ message: "User already exists" });
    }

    // Set up Nodemailer transporter using your email service (e.g., Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Please verify your email address",
      text: `Click the link to verify your email: ${process.env.BACKEND_URL}/api/user/verify/${verificationToken}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .send({ message: "Error sending verification email" });
      }
      res.send({ message: "Verification email sent to your email." });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

const VerifyUser = async (req, res) => {
  const { token } = req.params;

  try {
    // Find user by verification token
    const user = await PendingUser.findOne({ verificationToken: token });

    if (!user) {
      return res
        .status(400)
        .send({ message: "Invalid or expired verification token" });
    }

    // Optionally, nullify the token after verification
    const verifiedUser = new User({
      email: user.email,
      name: user.name,
      password: user.password,
    });
    await verifiedUser.save();
    //delete user from pending user
    await PendingUser.deleteOne({ verificationToken: token });

    res.status(200).send(`
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Verification Successful</title>
            <meta http-equiv="refresh" content="2;url=${process.env.FRONTEND_URL}" />
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f9;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              .container {
                text-align: center;
                background-color: #fff;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                width: 80%;
                max-width: 500px;
              }
              h1 {
                color: #4caf50;
                font-size: 2.5em;
                margin-bottom: 20px;
              }
              p {
                font-size: 1.2em;
                color: #555;
              }
              .message {
                color: #4caf50;
                font-weight: bold;
                font-size: 1.3em;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>User Verified Successfully!</h1>
              <p>You will be redirected shortly...</p>
              <p class="message">Thank you for verifying your account.</p>
            </div>
          </body>
        </html>
      `);
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error verifying email" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body; // Extract email and password from the request body

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "User not found" }); // If no user is found
    }

    // Compare the provided password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Invalid credentials" }); // If passwords don't match
    }

    // Generate a JWT token with the user's ID (you can include other info too)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7D",
    });

    // Send the response with the token, email, and name
    res.status(200).send({
      message: "Login successful",
      token, // Send the generated JWT token
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Server error during login" });
  }
};

const searchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};
  const users = await User.find(keyword)
    .find({ _id: { $ne: req.user._id } })
    .limit(5);
  res.status(200).send(users);
};

const getMyDetails = async (req, res) => {
  try {
    res.status(200).send(req.user);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDetails = await User.findById(userId);
    res.status(200).send(userDetails);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error fetching user details" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    let { name, about, organization, pic, skills, headline } = req.body;
    const old = await User.findById(req.user._id);
    if (!old) {
      return res.status(404).send({ message: "User not found" });
    }

    // Update the project with the new collaborators list
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          name,
          about,
          organization,
          pic,
          skills,
          headline,
        },
      }, // Replace the collaborators array with the new list
      { new: true } // Return the updated project
    );

    res.status(200).send(updatedUser);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = {
  registerUser,
  VerifyUser,
  loginUser,
  searchUsers,
  getMyDetails,
  getUserDetails,
  updateUserProfile,
};
