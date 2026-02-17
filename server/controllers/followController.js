import pool from '../config/database.js';

export const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    if (parseInt(userId) === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const [existing] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    await pool.execute(
      'INSERT INTO follows (follower_id, followee_id) VALUES (?, ?)',
      [followerId, userId]
    );

    res.status(201).json({ message: 'User followed successfully' });
  } catch (error) {
    next(error);
  }
};

export const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const [result] = await pool.execute(
      'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [followers] = await pool.execute(
      `SELECT f.*, u.id as user_id, u.email, u.full_name, u.avatar_url, u.user_type
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.followee_id = ?
      ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ followers });
  } catch (error) {
    next(error);
  }
};

export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [following] = await pool.execute(
      `SELECT f.*, u.id as user_id, u.email, u.full_name, u.avatar_url, u.user_type
      FROM follows f
      JOIN users u ON f.followee_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ following });
  } catch (error) {
    next(error);
  }
};

export const isFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    const [result] = await pool.execute(
      'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, userId]
    );

    res.json({ isFollowing: result.length > 0 });
  } catch (error) {
    next(error);
  }
};
