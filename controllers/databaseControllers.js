const User = require("../models/User");

const users = [
  {
    name: "Alice Johnson",
    email: "alice.johnson@example.com",
    pass: "12345678",
  },
  {
    name: "Bob Smith",
    email: "bob.smith@example.com",
    pass: "12345678",
  },
  {
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    pass: "12345678",
  },
  {
    name: "Diana Ross",
    email: "diana.ross@example.com",
    pass: "12345678",
  },
  {
    name: "Eva Green",
    email: "eva.green@example.com",
    pass: "12345678",
  },
  {
    name: "Frank White",
    email: "frank.white@example.com",
    pass: "12345678",
  },
  {
    name: "Grace Lee",
    email: "grace.lee@example.com",
    pass: "12345678",
  },
  {
    name: "Henry Turner",
    email: "henry.turner@example.com",
    pass: "12345678",
  },
  {
    name: "Isla Davis",
    email: "isla.davis@example.com",
    pass: "12345678",
  },
  {
    name: "Jack Morgan",
    email: "jack.morgan@example.com",
    pass: "12345678",
  },
];

const addUsers = async () => {
  try {
    const updatedUsers = users.map((user) => ({
      password: "$2a$10$nU9ay.vfOX8tDwHBgkNvEOGt9CEKx762c2Avmk.ajwzRXA1eW2ftS",
      name: user.name,
      email: user.email,
    }));
    await User.insertMany(updatedUsers);
    console.log("Users added successfully");
  } catch (error) {
    console.error("Error adding users:", error);
  }
};

module.exports = { addUsers };
