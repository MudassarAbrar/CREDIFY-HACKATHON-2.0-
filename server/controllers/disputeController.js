import pool from '../config/database.js';
import { createNotification } from '../services/notificationHelper.js';

export const createDispute = async (req, res, next) => {
  try {
    const { booking_id, subject, description, proof_urls } = req.body;
    const raised_by_user_id = req.user.id;

    if (!booking_id || !subject || !description) {
      return res.status(400).json({ error: 'booking_id, subject, and description are required' });
    }

    const [bookings] = await pool.execute(
      'SELECT id, learner_id, teacher_id FROM bookings WHERE id = ?',
      [booking_id]
    );
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    const b = bookings[0];
    if (b.learner_id !== raised_by_user_id && b.teacher_id !== raised_by_user_id) {
      return res.status(403).json({ error: 'You can only open a dispute for your own booking' });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM disputes WHERE booking_id = ? AND status IN ('open', 'in_review')",
      [booking_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An open dispute already exists for this booking' });
    }

    const proofJson = proof_urls
      ? (Array.isArray(proof_urls) ? JSON.stringify(proof_urls) : JSON.stringify(String(proof_urls).split(/[\n,]/).map((s) => s.trim()).filter(Boolean)))
      : null;

    const [result] = await pool.execute(
      'INSERT INTO disputes (booking_id, raised_by_user_id, subject, description, proof_urls) VALUES (?, ?, ?, ?, ?)',
      [booking_id, raised_by_user_id, subject.trim(), description.trim(), proofJson]
    );
    const [dispute] = await pool.execute(
      'SELECT * FROM disputes WHERE id = ?',
      [result.insertId]
    );

    const otherUserId = b.learner_id === raised_by_user_id ? b.teacher_id : b.learner_id;
    await createNotification(otherUserId, 'system', 'Dispute opened', `A dispute was opened for a booking you are part of.`, `/disputes/${result.insertId}`);

    res.status(201).json({ dispute: dispute[0] });
  } catch (err) {
    next(err);
  }
};

export const getMyDisputes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [disputes] = await pool.execute(
      `SELECT d.*, b.learner_id, b.teacher_id, b.scheduled_at, b.credits_cost, b.status AS booking_status,
        s.title AS skill_title,
        u_learner.full_name AS learner_name, u_teacher.full_name AS teacher_name
       FROM disputes d
       JOIN bookings b ON d.booking_id = b.id
       JOIN skills s ON b.skill_id = s.id
       JOIN users u_learner ON b.learner_id = u_learner.id
       JOIN users u_teacher ON b.teacher_id = u_teacher.id
       WHERE b.learner_id = ? OR b.teacher_id = ?
       ORDER BY d.created_at DESC`,
      [userId, userId]
    );
    res.json({ disputes });
  } catch (err) {
    next(err);
  }
};

export const getDisputeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [disputes] = await pool.execute(
      `SELECT d.*, b.learner_id, b.teacher_id, b.credits_cost, b.scheduled_at, b.status AS booking_status,
        s.title AS skill_title,
        u_learner.full_name AS learner_name, u_teacher.full_name AS teacher_name
       FROM disputes d
       JOIN bookings b ON d.booking_id = b.id
       JOIN skills s ON b.skill_id = s.id
       JOIN users u_learner ON b.learner_id = u_learner.id
       JOIN users u_teacher ON b.teacher_id = u_teacher.id
       WHERE d.id = ?`,
      [id]
    );
    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    const d = disputes[0];
    if (d.learner_id !== userId && d.teacher_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this dispute' });
    }
    const [messages] = await pool.execute(
      `SELECT dm.*, u.full_name AS sender_name
       FROM dispute_messages dm
       JOIN users u ON dm.sender_id = u.id
       WHERE dm.dispute_id = ? AND dm.is_internal = 0
       ORDER BY dm.created_at ASC`,
      [id]
    );
    res.json({ dispute: d, messages });
  } catch (err) {
    next(err);
  }
};

export const postDisputeMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const userId = req.user.id;
    const [disputes] = await pool.execute(
      'SELECT d.id, b.learner_id, b.teacher_id FROM disputes d JOIN bookings b ON d.booking_id = b.id WHERE d.id = ?',
      [id]
    );
    if (disputes.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    const d = disputes[0];
    if (d.learner_id !== userId && d.teacher_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to post in this dispute' });
    }
    await pool.execute(
      'INSERT INTO dispute_messages (dispute_id, sender_id, content, is_internal) VALUES (?, ?, ?, 0)',
      [id, userId, content.trim()]
    );
    const [inserted] = await pool.execute(
      'SELECT id, dispute_id, sender_id, content, created_at FROM dispute_messages WHERE dispute_id = ? ORDER BY id DESC LIMIT 1',
      [id]
    );
    res.status(201).json({ message: inserted[0] });
  } catch (err) {
    next(err);
  }
};
