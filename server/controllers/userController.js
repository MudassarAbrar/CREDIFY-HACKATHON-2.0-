import pool from '../config/database.js';

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: users[0] });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { full_name, user_type } = req.body;

    // Check if user exists and is the owner or admin
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const updates = [];
    const values = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(full_name);
    }

    if (user_type !== undefined) {
      updates.push('user_type = ?');
      values.push(user_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [users] = await pool.execute(
      'SELECT id, email, user_type, credit_balance, full_name, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ user: users[0] });
  } catch (error) {
    next(error);
  }
};

export const getUserSkills = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [skills] = await pool.execute(
      'SELECT * FROM user_skills WHERE user_id = ? ORDER BY created_at DESC',
      [id]
    );

    res.json({ skills });
  } catch (error) {
    next(error);
  }
};
