// const asyncHandler = require("express-async-handler");
const Chat = require("../models/Chat");
const Connection = require("../models/Connection");
const Message = require("../models/Message");
const User = require("../models/User");

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = async (req, res) => {
  try {
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
};

const checkChat = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res
        .status(400)
        .send({ message: "UserId param not sent with request" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const existingChat = await Chat.findOne({
      users: { $all: [req.user._id, user._id] },
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage");
    const populatedChat = await User.populate(existingChat, {
      path: "latestMessage.sender",
    });
    if (existingChat) {
      return res.status(200).send(populatedChat);
    } else {
      return res.status(404).send({ message: "No connection found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};
//@description     Fetch all accepted chats for a user
//@route           GET /api/chat/accepted
//@access          Protected
const fetchAcceptedChats = async (req, res) => {
  try {
    Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { acceptedUsers: { $elemMatch: { $eq: req.user._id } } },
        { isGroupChat: false },
      ],
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          // select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//@description     Fetch all accepted chats for a user
//@route           GET /api/chat/accepted
//@access          Protected
const fetchPendingChats = async (req, res) => {
  try {
    Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { acceptedUsers: { $nin: [req.user._id] } },
      ],
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      console.log("UserId param not sent with request");
      return res
        .status(400)
        .send({ message: "UserId param not sent with request" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    const existingConnection = await Connection.findOne({
      users: { $all: [req.user._id, user._id] },
    });

    var isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: user._id } } },
      ],
    })
      .populate("users", "-password")
      .populate("latestMessage");

    isChat = await User.populate(isChat, {
      path: "latestMessage.sender",
      // select: "name pic email",
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: "sender",
        acceptedUsers: existingConnection
          ? [req.user._id, user._id]
          : [req.user._id],
        users: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const acceptChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res
        .status(400)
        .send({ message: "ChatId param not sent with request" });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    if (!chat.users.includes(req.user._id)) {
      return res.status(404).send({ message: "Unauthorized" });
    }
    if (chat.acceptedUsers.includes(req.user._id)) {
      return res.status(404).send({ message: "User already accepted" });
    }

    const reqChat = await Chat.findOneAndUpdate(
      {
        _id: chatId, // Match by chat ID
        users: req.user._id, // Check if the user ID is in the array of users
        acceptedUsers: { $nin: [req.user._id] }, // Check if the user ID is NOT in the array of accepted users
      },
      {
        $push: { acceptedUsers: req.user._id },
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).send(reqChat);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const rejectChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res
        .status(400)
        .send({ message: "ChatId param not sent with request" });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).send({ message: "Chat not found" });
    }
    if (!chat.users.includes(req.user._id)) {
      return res.status(404).send({ message: "Unauthorized" });
    }
    if (chat.acceptedUsers.includes(req.user._id)) {
      return res.status(404).send({ message: "User already accepted" });
    }

    // Step 1: Find and delete the chat by its chatId
    await Chat.findByIdAndDelete(chatId);

    // Step 2: Delete all messages with the same chatId
    await Message.deleteMany({ chat: chatId });
    res.status(200).send("Deleted Succesfully");
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const fetchGroupChats = async (req, res) => {
  try {
    Chat.find({
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { acceptedUsers: { $elemMatch: { $eq: req.user._id } } },
        { isGroupChat: true },
      ],
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          // select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = async (req, res) => {
  try {
    if (!req.body.users || !req.body.name) {
      return res.status(400).send({ message: "Please Fill all the feilds" });
    }

    var users = req.body.users;

    if (users.length < 2) {
      return res
        .status(400)
        .send("More than 2 users are required to form a group chat");
    }

    users.push(req.user._id);

    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
      acceptedUsers: [req.user._id],
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = async (req, res) => {
  try {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      {
        chatName: chatName,
      },
      {
        new: true,
      }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!updatedChat) {
      return res.status(404).send({ message: "Group Chat Not Found" });
    } else {
      res.status(200).send(updatedChat);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    if (!chatId || !userId) {
      return res
        .status(400)
        .send({ message: "ChatId or UserId param not sent with request" });
    }

    // check if the requester is admin
    const reqChat = await Chat.findById(chatId);
    if (!reqChat) {
      return res.status(404).send({ message: "Chat Not Found" });
    } else if (reqChat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Not Allowed" });
    } else {
      const removed = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { users: userId, acceptedUsers: userId },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!removed) {
        return res.status(404).send({ message: "Chat Not Found" });
      } else {
        res.status(200).send(removed);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.body;
    if (!chatId || !userId) {
      return res
        .status(400)
        .send({ message: "ChatId or UserId param not sent with request" });
    }
    const reqChat = await Chat.findById(chatId);
    if (!reqChat) {
      return res.status(404).send({ message: "Chat Not Found" });
    } else if (reqChat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).send({ message: "Not Allowed" });
    } else {
      const added = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { users: userId },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!added) {
        return res.status(404).send({ message: "Chat Not Found" });
      } else {
        res.status(200).send(added);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res
        .status(400)
        .send({ message: "ChatId param not sent with request" });
    }
    const reqChat = await Chat.findById(chatId);
    if (!reqChat) {
      return res.status(404).send({ message: "Chat Not Found" }); // Chat not found
    } else if (!reqChat.users.includes(req.user._id)) {
      return res.status(403).send({ message: "Not Allowed" }); // Not allowed
    } else {
      const left = await Chat.findByIdAndUpdate(
        chatId,
        {
          $pull: { users: req.user._id, acceptedUsers: req.user._id },
        },
        {
          new: true,
        }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      if (!left) {
        return res.status(404).send({ message: "Chat Not Found" }); // Chat not found
      } else {
        res.status(200).send(left);
      }
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = {
  fetchChats,
  checkChat,
  fetchAcceptedChats,
  fetchPendingChats,
  accessChat,
  acceptChat,
  rejectChat,
  fetchGroupChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  leaveGroup,
};
