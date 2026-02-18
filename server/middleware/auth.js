import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

/** Require authenticated user to have role === 'admin'. Use after authenticateToken. */
export const requireAdmin = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0 || (rows[0].role || 'user') !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user.role = 'admin';
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};
