import pool from '../config/database.js';

export const getSkillRequests = async (req, res, next) => {
  try {
    const { category, status, urgency, max_rate } = req.query;

    let query = 'SELECT sr.*, u.email as user_email, u.full_name as user_name, u.user_type FROM skill_requests sr JOIN users u ON sr.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    } else {
      query += ' AND sr.status IN ("open", "in_progress")';
    }

    if (category) {
      query += ' AND sr.category = ?';
      params.push(category);
    }

    if (urgency) {
      query += ' AND sr.urgency = ?';
      params.push(urgency);
    }

    if (max_rate) {
      query += ' AND sr.preferred_rate_max <= ?';
      params.push(parseFloat(max_rate));
    }

    query += ' ORDER BY sr.created_at DESC';

    const [requests] = await pool.execute(query, params);

    res.json({ requests });
  } catch (error) {
    next(error);
  }
};

export const getSkillRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [requests] = await pool.execute(
      'SELECT sr.*, u.email as user_email, u.full_name as user_name, u.user_type FROM skill_requests sr JOIN users u ON sr.user_id = u.id WHERE sr.id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Skill request not found' });
    }

    res.json({ request: requests[0] });
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

    const [result] = await pool.execute(
      'INSERT INTO skill_requests (user_id, title, description, category, preferred_rate_max, urgency, budget) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || null, category || null, preferred_rate_max || null, urgency || 'medium', budget || null]
    );

    const [requests] = await pool.execute(
      'SELECT sr.*, u.email as user_email, u.full_name as user_name, u.user_type FROM skill_requests sr JOIN users u ON sr.user_id = u.id WHERE sr.id = ?',
      [result.insertId]
    );

    res.status(201).json({ request: requests[0] });
  } catch (error) {
    next(error);
  }
};

export const updateSkillRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, category, preferred_rate_max, urgency, budget, status } = req.body;

    // Check ownership
    const [requests] = await pool.execute(
      'SELECT user_id FROM skill_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Skill request not found' });
    }

    if (parseInt(requests[0].user_id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own requests' });
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
    if (preferred_rate_max !== undefined) {
      updates.push('preferred_rate_max = ?');
      values.push(preferred_rate_max);
    }
    if (urgency !== undefined) {
      updates.push('urgency = ?');
      values.push(urgency);
    }
    if (budget !== undefined) {
      updates.push('budget = ?');
      values.push(budget);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(id);
    await pool.execute(
      `UPDATE skill_requests SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const [updated] = await pool.execute(
      'SELECT sr.*, u.email as user_email, u.full_name as user_name, u.user_type FROM skill_requests sr JOIN users u ON sr.user_id = u.id WHERE sr.id = ?',
      [id]
    );

    res.json({ request: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const closeSkillRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check ownership
    const [requests] = await pool.execute(
      'SELECT user_id FROM skill_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ error: 'Skill request not found' });
    }

    if (parseInt(requests[0].user_id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only close your own requests' });
    }

    await pool.execute(
      'UPDATE skill_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status || 'closed', id]
    );

    const [updated] = await pool.execute(
      'SELECT sr.*, u.email as user_email, u.full_name as user_name, u.user_type FROM skill_requests sr JOIN users u ON sr.user_id = u.id WHERE sr.id = ?',
      [id]
    );

    res.json({ request: updated[0] });
  } catch (error) {
    next(error);
  }
};
