import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) 
    return res.status(401).json({ message: "No token provided" });

  // Allow both "Bearer <token>" and just "<token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
  if (!token)
    return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) 
      return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
}
