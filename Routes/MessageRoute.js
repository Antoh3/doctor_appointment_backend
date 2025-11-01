const express = require('express');
const MessageRouter = express.Router();
const {createUser,getUsers,getMessages,sendMessage,deleteMessage} = require('../Controllers/MessageController')


MessageRouter.post('/users',createUser);
MessageRouter.get('/users',getUsers);
MessageRouter.post('/messages',sendMessage);
MessageRouter.get('/messages',getMessages);
MessageRouter.delete('/message/:messageId',deleteMessage)


module.exports = MessageRouter;