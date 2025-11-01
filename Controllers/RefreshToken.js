const jwt = require('jsonwebtoken');
const { generateToken,generateRefreshToken } = require('../Middlewares/JWT.authentication')


const extractNewToken = async (req, res) => {
    const refreshToken = req.headers['authorization']?.split(' ')[1];


    if (!refreshToken) {
        return res.sendStatus(401);
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
        if (err) {
            console.error('Refresh token verification error:', err);
            return res.sendStatus(403); // Forbidden if refresh token is invalid
        }

        // Generate a new access token using the decoded information
        // const newAccessToken = generateToken(decoded.id, decoded.role);
        const newAccessToken = generateToken(decoded.id,decoded.role)
        // console.log("Decoded token", decoded);
        
        res.json({ accessToken: newAccessToken });
    });
}

module.exports={
    extractNewToken
}