const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Auth middleware that supports two token modes:
 * - Real JWT tokens (signed with JWT_SECRET)
 * - Demo tokens in the form: demo-token-<userId>-<ts>
 *
 * This keeps the demo server working while still allowing real JWTs if configured.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const raw = req.header('Authorization') || '';
    const token = raw.replace('Bearer ', '').trim();

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Try verify as JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return res.status(401).json({ message: 'Token is not valid' });
      req.user = user;
      return next();
    } catch (jwtErr) {
      // Not a valid JWT — fall back to demo-token scheme
    }

    // Demo token format: demo-token-<userId>-<ts>
    if (token.startsWith('demo-token-')) {
      console.log('🔑 Processing demo token:', token);
      const parts = token.split('-');
      // parts: ['demo', 'token', '<userId>', '<ts>'] or ['demo', 'token', '<userId>'] depending on generation
      const possibleId = parts[2];
      if (!possibleId) {
        console.log('❌ Demo token malformed:', token);
        return res.status(401).json({ message: 'Demo token malformed' });
      }
      const user = await User.findById(possibleId).select('-passwordHash');
      if (!user) {
        console.log('❌ User not found for ID:', possibleId);
        return res.status(401).json({ message: 'Token is not valid' });
      }
      // Normalize to ensure downstream handlers can rely on req.user.id as a string
      user.id = user._id ? user._id.toString() : user.id;
      console.log('✅ User authenticated:', user._id, user.role);
      req.user = user;
      return next();
    }

    return res.status(401).json({ message: 'Token is not valid' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;