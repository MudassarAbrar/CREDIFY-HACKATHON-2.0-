import pool from '../config/database.js';

export const getTransactions = async (req, res, next) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT t.*,
             b.skill_id, b.learner_id, b.teacher_id, b.scheduled_at, b.duration, b.status as booking_status,
             s.title as skill_title,
             u_learner.full_name as learner_name, u_learner.email as learner_email,
             u_teacher.full_name as teacher_name, u_teacher.email as teacher_email
      FROM transactions t
      LEFT JOIN bookings b ON t.booking_id = b.id
      LEFT JOIN skills s ON b.skill_id = s.id
      LEFT JOIN users u_learner ON b.learner_id = u_learner.id
      LEFT JOIN users u_teacher ON b.teacher_id = u_teacher.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 100';

    const [transactions] = await pool.execute(query, params);

    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};
