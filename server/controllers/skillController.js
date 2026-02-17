import pool from '../config/database.js';

export const getSkills = async (req, res, next) => {
  try {
    const { category, min_rate, max_rate, user_type, complexity, status = 'active' } = req.query;

    let query = `
      SELECT s.*, u.email as teacher_email, u.full_name as teacher_name, u.user_type as teacher_type
      FROM skills s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = ?
    `;
    const params = [status];

    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    if (min_rate) {
      query += ' AND s.rate_per_hour >= ?';
      params.push(parseFloat(min_rate));
    }

    if (max_rate) {
      query += ' AND s.rate_per_hour <= ?';
      params.push(parseFloat(max_rate));
    }

    if (user_type) {
      query += ' AND u.user_type = ?';
      params.push(user_type);
    }

    if (complexity) {
      query += ' AND s.complexity = ?';
      params.push(complexity);
    }

    query += ' ORDER BY s.created_at DESC';

    const [skills] = await pool.execute(query, params);

    res.json({ skills });
  } catch (error) {
    next(error);
  }
};

export const getSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [skills] = await pool.execute(
      `SELECT s.*, u.email as teacher_email, u.full_name as teacher_name, u.user_type as teacher_type
       FROM skills s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );

    if (skills.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json({ skill: skills[0] });
  } catch (error) {
    next(error);
  }
};

export const createSkill = async (req, res, next) => {
  try {
    const { title, description, category, rate_per_hour, complexity = 'moderate' } = req.body;

    if (!title || !rate_per_hour) {
      return res.status(400).json({ error: 'Title and rate_per_hour are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO skills (user_id, title, description, category, rate_per_hour, complexity) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, category || null, rate_per_hour, complexity]
    );

    const [skills] = await pool.execute(
      'SELECT * FROM skills WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ skill: skills[0] });
  } catch (error) {
    next(error);
  }
};

export const updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, rate_per_hour, complexity, status } = req.body;

    // Check ownership
    const [skills] = await pool.execute('SELECT user_id FROM skills WHERE id = ?', [id]);

    if (skills.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skills[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own skills' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (rate_per_hour !== undefined) {
      updates.push('rate_per_hour = ?');
      values.push(rate_per_hour);
    }
    if (complexity !== undefined) {
      updates.push('complexity = ?');
      values.push(complexity);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);

    await pool.execute(`UPDATE skills SET ${updates.join(', ')} WHERE id = ?`, values);

    const [updated] = await pool.execute('SELECT * FROM skills WHERE id = ?', [id]);

    res.json({ skill: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [skills] = await pool.execute('SELECT user_id FROM skills WHERE id = ?', [id]);

    if (skills.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (skills[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own skills' });
    }

    await pool.execute('DELETE FROM skills WHERE id = ?', [id]);

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const createSkillRequest = async (req, res, next) => {
  try {
    const { title, description, category, preferred_rate_max, urgency, budget } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // For MVP, we'll store skill requests as skills with a special status
    // In a full implementation, you might want a separate skill_requests table
    const [result] = await pool.execute(
      'INSERT INTO skills (user_id, title, description, category, rate_per_hour, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, category || null, preferred_rate_max || 0, 'inactive']
    );

    res.status(201).json({
      message: 'Skill request created successfully',
      request_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
};
