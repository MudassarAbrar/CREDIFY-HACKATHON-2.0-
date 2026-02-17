import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import pool from '../config/database.js';

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export const register = async (req, res, next) => {
  try {
    const { email, password, user_type = 'student', full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password_hash, user_type, full_name, credit_balance) VALUES (?, ?, ?, ?, 100.00)',
      [email, password_hash, user_type, full_name || null]
    );

    const userId = result.insertId;

    // Generate JWT
    const token = jwt.sign(
      { id: userId, email, user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Get user data
    const [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: users[0]
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        credit_balance: user.credit_balance,
        full_name: user.full_name,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Google OAuth login: verify ID token from frontend, find or create user, return JWT
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential (id_token) is required' });
    }

    if (!googleClient) {
      return res.status(503).json({
        error: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in server .env',
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token: missing email' });
    }

    const email = payload.email;
    const fullName = payload.name || payload.given_name || payload.family_name || email.split('@')[0];
    const avatarUrl = payload.picture || null;

    let [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, created_at FROM users WHERE email = ?',
      [email]
    );

    let userRow;

    if (users.length > 0) {
      userRow = users[0];
      // Optionally update name/avatar if changed
      await pool.execute(
        'UPDATE users SET full_name = COALESCE(?, full_name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
        [fullName, avatarUrl, userRow.id]
      );
      const [updated] = await pool.execute(
        'SELECT id, email, user_type, credit_balance, full_name, created_at, avatar_url FROM users WHERE id = ?',
        [userRow.id]
      );
      userRow = updated[0];
    } else {
      // Create new user (no password - they use Google only; store a placeholder hash)
      const placeholderHash = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      const [result] = await pool.execute(
        `INSERT INTO users (email, password_hash, user_type, full_name, credit_balance, avatar_url)
         VALUES (?, ?, 'student', ?, 100.00, ?)`,
        [email, placeholderHash, fullName, avatarUrl]
      );
      const [newUser] = await pool.execute(
        'SELECT id, email, user_type, credit_balance, full_name, created_at, avatar_url FROM users WHERE id = ?',
        [result.insertId]
      );
      userRow = newUser[0];
    }

    const token = jwt.sign(
      { id: userRow.id, email: userRow.email, user_type: userRow.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: userRow.id,
        email: userRow.email,
        user_type: userRow.user_type,
        credit_balance: userRow.credit_balance,
        full_name: userRow.full_name,
        avatar_url: userRow.avatar_url,
        created_at: userRow.created_at,
      },
    });
  } catch (error) {
    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ error: 'Google sign-in expired. Please try again.' });
    }
    next(error);
  }
};
