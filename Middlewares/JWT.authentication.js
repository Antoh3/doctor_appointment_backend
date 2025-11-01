const jwt = require('jsonwebtoken');

// Generate token for both doctor and patient
const generateToken = (userId, userType) => {
  const payload = { id: userId, role: userType }; // Include the role (doctor or patient)
  const secret = process.env.JWT_SECRET;
  const options = { expiresIn: '1d' };

  return jwt.sign(payload, secret, options);
};

const generateRefreshToken = (userId,userType) =>{
  const payload = { id: userId, role: userType }; // Include the role (doctor or patient)
  const secret = process.env.JWT_REFRESH_SECRET;
  const options = { expiresIn: '7d' };

  return jwt.sign(payload, secret, options);
}

// Authenticate and extract user ID and role
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized if no token is provided
  }

  await jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403); // Forbidden if token is invalid
    }
    req.userId = decoded.id; // Use 'id' from the decoded token
    req.userRole = decoded.role; // Include role (doctor or patient) from the token
    console.log('Decoded token:', decoded.id); // For debugging
    next();
  });
};

module.exports = { authenticateToken, generateToken,generateRefreshToken };
