const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

//@access          Protected
const allMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      return res
        .status(400)
        .send({ message: "ChatId param not sent with request" });
    }
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.status(200).send(messages);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).send({ message: "Please Fill all the Feilds" });
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.status(201).send(message);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports = { allMessages, sendMessage };
