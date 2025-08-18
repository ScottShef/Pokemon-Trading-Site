
import jwt from "jsonwebtoken"; // Changed from require to import

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  // Grab the token from the 'x-auth-token' header, which is a common convention
  const token = req.header('x-auth-token');

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ error: "No token provided, authorization denied." });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Attach the payload's user id to the request object
    next(); // Pass control to the next middleware or route handler
  } catch (err) {
    console.error("JWT verification error:", err.message);
    res.status(401).json({ error: "Token is not valid." });
  }
};

// --- This is the key change ---
export default authMiddleware; // Changed from module.exports to export default

