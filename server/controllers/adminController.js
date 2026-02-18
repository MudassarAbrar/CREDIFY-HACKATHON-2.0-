import pool from '../config/database.js';

export const getStats = async (req, res, next) => {
  try {
    const [userCount] = await pool.execute('SELECT COUNT(*) AS total FROM users');
    const [skillCount] = await pool.execute(
      "SELECT COUNT(*) AS total FROM skills WHERE status = 'active'"
    );
    const [bookingCount] = await pool.execute('SELECT COUNT(*) AS total FROM bookings');
    const [disputeCount] = await pool.execute(
      "SELECT COUNT(*) AS total FROM disputes WHERE status = 'open'"
    );
    res.json({
      stats: {
        totalUsers: userCount[0].total,
        activeSkills: skillCount[0].total,
        totalBookings: bookingCount[0].total,
        openDisputes: disputeCount[0].total,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDisputes = async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);
    let query = `
      SELECT d.*, b.learner_id, b.teacher_id, b.credits_cost, b.scheduled_at, b.status AS booking_status,
        s.title AS skill_title,
        u_learner.full_name AS learner_name, u_learner.email AS learner_email,
        u_teacher.full_name AS teacher_name, u_teacher.email AS teacher_email,
        u_raised.full_name AS raised_by_name
      FROM disputes d
      JOIN bookings b ON d.booking_id = b.id
      JOIN skills s ON b.skill_id = s.id
      JOIN users u_learner ON b.learner_id = u_learner.id
      JOIN users u_teacher ON b.teacher_id = u_teacher.id
      JOIN users u_raised ON d.raised_by_user_id = u_raised.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE d.status = ?';
      params.push(status);
    }
    query += ` ORDER BY d.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

    const [disputes] = await pool.execute(query, params);
    res.json({ disputes });
  } catch (err) {
    next(err);
  }
};

export const getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [disputes] = await pool.execute(
      `SELECT d.*, b.learner_id, b.teacher_id, b.credits_cost, b.scheduled_at, b.status AS booking_status,
        s.title AS skill_title, s.id AS skill_id,
        u_learner.full_name AS learner_name, u_learner.email AS learner_email, u_learner.id AS learner_id,
        u_teacher.full_name AS teacher_name, u_teacher.email AS teacher_email, u_teacher.id AS teacher_id,
        u_raised.full_name AS raised_by_name, u_raised.email AS raised_by_email
       FROM disputes d
       JOIN bookings b ON d.booking_id = b.id
       JOIN skills s ON b.skill_id = s.id
       JOIN users u_learner ON b.learner_id = u_learner.id
       JOIN users u_teacher ON b.teacher_id = u_teacher.id
       JOIN users u_raised ON d.raised_by_user_id = u_raised.id
       WHERE d.id = ?`,
      [id]
    );
    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    const [messages] = await pool.execute(
      `SELECT dm.*, u.full_name AS sender_name, u.email AS sender_email
       FROM dispute_messages dm
       JOIN users u ON dm.sender_id = u.id
       WHERE dm.dispute_id = ?
       ORDER BY dm.created_at ASC`,
      [id]
    );
    res.json({ dispute: disputes[0], messages });
  } catch (err) {
    next(err);
  }
};

export const getBookingConversation = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const [bookings] = await pool.execute(
      'SELECT id, learner_id, teacher_id FROM bookings WHERE id = ?',
      [bookingId]
    );
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const { learner_id, teacher_id } = bookings[0];
    const [conversations] = await pool.execute(
      'SELECT id FROM conversations WHERE booking_id = ? AND ((participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?))',
      [bookingId, learner_id, teacher_id, teacher_id, learner_id]
    );
    if (conversations.length === 0) {
      return res.json({ conversation: null, messages: [] });
    }
    const convId = conversations[0].id;
    const [messages] = await pool.execute(
      `SELECT m.*, u.full_name AS sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [convId]
    );
    res.json({ conversation: { id: convId }, messages });
  } catch (err) {
    next(err);
  }
};

export const postDisputeMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, is_internal } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const [disputes] = await pool.execute('SELECT id FROM disputes WHERE id = ?', [id]);
    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    await pool.execute(
      'INSERT INTO dispute_messages (dispute_id, sender_id, content, is_internal) VALUES (?, ?, ?, ?)',
      [id, req.user.id, content.trim(), !!is_internal]
    );
    const [inserted] = await pool.execute(
      'SELECT id, dispute_id, sender_id, content, is_internal, created_at FROM dispute_messages WHERE dispute_id = ? ORDER BY id DESC LIMIT 1',
      [id]
    );
    res.status(201).json({ message: inserted[0] });
  } catch (err) {
    next(err);
  }
};

export const patchDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;
    const [disputes] = await pool.execute('SELECT id FROM disputes WHERE id = ?', [id]);
    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    const updates = [];
    const params = [];
    if (status) {
      const allowed = ['open', 'in_review', 'resolved', 'closed'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push(' status = ? ');
      params.push(status);
      if (status === 'resolved' || status === 'closed') {
        updates.push(' resolved_at = CURRENT_TIMESTAMP, resolved_by = ? ');
        params.push(req.user.id);
      }
    }
    if (resolution_notes !== undefined) {
      updates.push(' resolution_notes = ? ');
      params.push(resolution_notes);
    }
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    params.push(id);
    await pool.execute(
      `UPDATE disputes SET ${updates.join(',')} WHERE id = ?`,
      params
    );
    const [updated] = await pool.execute('SELECT * FROM disputes WHERE id = ?', [id]);
    res.json({ dispute: updated[0] });
  } catch (err) {
    next(err);
  }
};
