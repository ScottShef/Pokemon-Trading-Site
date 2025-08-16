const jwt = require("jsonwebtoken");

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization; // Get token from headers
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  // Token format: "Bearer <token>"
  const token = authHeader.split(" ")[1];

  try {
    // Verify token and attach userId to request object
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next(); // Proceed to route
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
