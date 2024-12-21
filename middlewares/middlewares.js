const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateJWT = async (req, res, next) => {
  // Get the token from the Authorization header
  try {
    const bearerToken = req.header("Authorization"); // Assuming token is sent as Bearer token

    if (!bearerToken) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }

    token = bearerToken.split(" ")[1];

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret here

    req.user = await User.findById(decoded.userId).select("-password");
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    // If token is invalid or expired
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const fetchuser = async (req, res, next) => {
  try {
    const bearerToken = req.header("Authorization"); // Assuming token is sent as Bearer token
    const token = bearerToken.split(" ")[1];

    if (!token) {
      return res.status(401).send({ message: "Invalid token" });
    }
    const data = jwt.verify(token, process.env.JWT_SECRET);
    console.log(data);
    const user = await User.findById(data.userId).select("-password");
    if (!user) {
      return res.status(401).send({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: "Invalid token" });
  }
};

const haveUser = async (req, res, next) => {
  try {
    const bearerToken = req.header("Authorization"); // Assuming token is sent as Bearer token
    const token = bearerToken.split(" ")[1];
    if (!token) {
      return next();
    }
    const data = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(data.userId).select("-password");
    if (!user) {
      next();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ message: "Invalid token" });
  }
};

module.exports = { authenticateJWT, fetchuser, haveUser };
