const prisma = require("../prisma/prismaClient");


// Create a new user
const createUser = async (req, res) => {
    const { name, email } = req.body;
    console.log(email,name);
    
    try {
      const user = await prisma.user1.create({
        data: { name, email },
      });
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: 'User creation failed' });
    }
  };
  
  // Get all users
  const getUsers = async (req, res) => {
    try {
      const users = await prisma.user1.findMany();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  // Send a message
const sendMessage = async (req, res) => {
    const { senderId, receiverId, content,replyToMessageId } = req.body;
    console.log(content);
    
    try {
      const message = await prisma.message.create({
        data: { 
          senderId, 
          receiverId, 
          content, 
          replyToMessageId: replyToMessageId || null
        },
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: 'Failed to send message' });
    }
  };
  
  // Get messages between two users
  const getMessages = async (req, res) => {
    const { user1, user2 } = req.query;
    try {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: parseInt(user1), receiverId: parseInt(user2) },
            { senderId: parseInt(user2), receiverId: parseInt(user1) },
          ],
        },
        include:{
          replyToMessage:true
        },
        orderBy: { createdAt: 'asc' },
      });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  };

  const deleteMessage = async (req,res) => {
    const { messageId } = req.params;

    await prisma.message.delete({
      where:{
        id:parseInt(messageId)
      }
    })

    return res.status(200).json({message1:"message deleted"});
  }

  module.exports = {
    createUser,
    getUsers,
    getMessages,
    sendMessage,
    deleteMessage,
  }