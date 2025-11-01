const express = require('express')
const  { extractNewToken }= require('../Controllers/RefreshToken')
const { authenticateToken  }= require("../Middlewares/JWT.authentication");


const TokenRouter = express.Router()

TokenRouter.post("/refreshToken",authenticateToken, extractNewToken)

module.exports = TokenRouter;