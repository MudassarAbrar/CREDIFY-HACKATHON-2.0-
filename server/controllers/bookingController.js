import pool from '../config/database.js';
import { calculateSpentCredits, hasSufficientCredits } from '../services/creditService.js';
import { calculateEarnedCredits } from '../services/creditService.js';
import { createNotification } from '../services/notificationHelper.js';

export const getBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const userId = req.user.id;

    let query = `
      SELECT b.*, 
             s.title as skill_title, s.description as skill_description,
             u1.email as learner_email, u1.full_name as learner_name,
             u2.email as teacher_email, u2.full_name as teacher_name,
             b.learner_confirmed_completion,
             b.teacher_confirmed_completion,
             b.learner_confirmed_at,
             b.teacher_confirmed_at,
             b.completed_at,
             b.credits_released
      FROM bookings b
      JOIN skills s ON b.skill_id = s.id
      JOIN users u1 ON b.learner_id = u1.id
      JOIN users u2 ON b.teacher_id = u2.id
      WHERE (b.learner_id = ? OR b.teacher_id = ?)
    `;
    const params = [userId, userId];

    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }

    query += ' ORDER BY b.scheduled_at DESC';

    const [bookings] = await pool.execute(query, params);

    res.json({ bookings });
  } catch (error) {
    next(error);
  }
};

export const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [bookings] = await pool.execute(
      `SELECT b.*, 
              s.title as skill_title, s.description as skill_description, s.complexity,
              u1.email as learner_email, u1.full_name as learner_name, u1.user_type as learner_type,
              u2.email as teacher_email, u2.full_name as teacher_name, u2.user_type as teacher_type
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u1 ON b.learner_id = u1.id
       JOIN users u2 ON b.teacher_id = u2.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: bookings[0] });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const { skill_id, scheduled_at, duration } = req.body;

    if (!skill_id || !scheduled_at || !duration) {
      return res.status(400).json({ error: 'skill_id, scheduled_at, and duration are required' });
    }

    // Get skill details
    const [skills] = await pool.execute(
      'SELECT s.*, u.user_type as teacher_type FROM skills s JOIN users u ON s.user_id = u.id WHERE s.id = ?',
      [skill_id]
    );

    if (skills.length === 0) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skill = skills[0];

    if (skill.user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot book your own skill' });
    }

    // Calculate credits cost
    const creditsCost = calculateSpentCredits(
      skill.rate_per_hour,
      duration,
      req.user.user_type,
      skill.complexity
    );

    // Check if user has sufficient credits
    const [users] = await pool.execute(
      'SELECT credit_balance, user_type FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    if (!hasSufficientCredits(user.credit_balance, creditsCost)) {
      return res.status(400).json({
        error: 'Insufficient credits',
        required: creditsCost,
        available: user.credit_balance
      });
    }

    // Create booking
    const [result] = await pool.execute(
      'INSERT INTO bookings (skill_id, learner_id, teacher_id, scheduled_at, duration, credits_cost) VALUES (?, ?, ?, ?, ?, ?)',
      [skill_id, req.user.id, skill.user_id, scheduled_at, duration, creditsCost]
    );

    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [result.insertId]
    );

    const [learnerRows] = await pool.execute('SELECT full_name, email FROM users WHERE id = ?', [req.user.id]);
    const learnerName = learnerRows[0]?.full_name || learnerRows[0]?.email?.split('@')[0] || 'Someone';
    await createNotification(
      skill.user_id,
      'booking',
      'New booking request',
      `${learnerName} requested to learn "${skill.title}"`,
      '/bookings'
    );

    res.status(201).json({ booking: bookings[0] });
  } catch (error) {
    next(error);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if booking exists and user is the teacher
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    if (booking.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the teacher can confirm this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending status' });
    }

    // Get skill title and teacher name for description
    const [[info]] = await pool.execute(
      'SELECT s.title as skill_title, u.full_name as teacher_name FROM bookings b JOIN skills s ON b.skill_id = s.id JOIN users u ON b.teacher_id = u.id WHERE b.id = ?',
      [id]
    );
    const skillTitle = info?.skill_title || 'Session';
    const teacherName = info?.teacher_name || 'Teacher';
    const spendDesc = `Spent credits for session with ${teacherName} (${skillTitle})`;

    // Deduct credits from learner
    await pool.execute(
      'UPDATE users SET credit_balance = credit_balance - ? WHERE id = ?',
      [booking.credits_cost, booking.learner_id]
    );

    // Create transaction for learner (spend)
    await pool.execute(
      'INSERT INTO transactions (user_id, type, amount, booking_id, description) VALUES (?, ?, ?, ?, ?)',
      [booking.learner_id, 'spend', booking.credits_cost, id, spendDesc]
    );

    // Update booking status
    await pool.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['confirmed', id]
    );

    await createNotification(
      booking.learner_id,
      'booking',
      'Booking confirmed',
      'Your session has been confirmed. Check your bookings.',
      '/bookings'
    );

    const [updated] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);

    res.json({ booking: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [bookings] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Only learner or teacher can cancel
    if (booking.learner_id !== req.user.id && booking.teacher_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' });
    }

    // If confirmed, refund credits to learner
    if (booking.status === 'confirmed') {
      await pool.execute(
        'UPDATE users SET credit_balance = credit_balance + ? WHERE id = ?',
        [booking.credits_cost, booking.learner_id]
      );
    }

    await pool.execute('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', id]);

    const [updated] = await pool.execute('SELECT * FROM bookings WHERE id = ?', [id]);

    res.json({ booking: updated[0] });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm session completion (can be called by either learner or teacher)
 * Payment is released when BOTH parties confirm, or after one party confirms and 72 hours pass
 */
export const confirmCompletion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [bookings] = await pool.execute(
      `SELECT b.*, s.complexity, s.rate_per_hour, u.user_type as teacher_type
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u ON b.teacher_id = u.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Booking must be confirmed before marking as complete' });
    }

    // Check if user is part of this booking
    const isLearner = booking.learner_id === userId;
    const isTeacher = booking.teacher_id === userId;

    if (!isLearner && !isTeacher) {
      return res.status(403).json({ error: 'You are not part of this booking' });
    }

    // Update confirmation based on role
    if (isLearner && !booking.learner_confirmed_completion) {
      await pool.execute(
        'UPDATE bookings SET learner_confirmed_completion = TRUE, learner_confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } else if (isTeacher && !booking.teacher_confirmed_completion) {
      await pool.execute(
        'UPDATE bookings SET teacher_confirmed_completion = TRUE, teacher_confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    // Re-fetch to check if both confirmed
    const [updatedBookings] = await pool.execute(
      `SELECT b.*, s.complexity, s.rate_per_hour, u.user_type as teacher_type
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u ON b.teacher_id = u.id
       WHERE b.id = ?`,
      [id]
    );
    const updatedBooking = updatedBookings[0];

    // Release payment if both parties confirmed
    if (updatedBooking.learner_confirmed_completion && updatedBooking.teacher_confirmed_completion && !updatedBooking.credits_released) {
      await releasePayment(id, updatedBooking);
    }

    const [finalBooking] = await pool.execute(
      `SELECT b.*, s.title as skill_title,
              u1.full_name as learner_name, u1.email as learner_email,
              u2.full_name as teacher_name, u2.email as teacher_email
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u1 ON b.learner_id = u1.id
       JOIN users u2 ON b.teacher_id = u2.id
       WHERE b.id = ?`,
      [id]
    );

    res.json({ 
      booking: finalBooking[0],
      message: updatedBooking.learner_confirmed_completion && updatedBooking.teacher_confirmed_completion
        ? 'Both parties confirmed. Payment released!'
        : `Confirmation recorded. Waiting for ${isLearner ? 'teacher' : 'learner'} to confirm.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to release payment (credits to teacher)
 */
const releasePayment = async (bookingId, booking) => {
  // Get skill title and learner name for description
  const [[info]] = await pool.execute(
    'SELECT s.title as skill_title, u.full_name as learner_name FROM bookings b JOIN skills s ON b.skill_id = s.id JOIN users u ON b.learner_id = u.id WHERE b.id = ?',
    [bookingId]
  );
  const skillTitle = info?.skill_title || 'Session';
  const learnerName = info?.learner_name || 'Learner';
  const earnDesc = `Earned credits from session with ${learnerName} (${skillTitle})`;

  // Calculate credits earned by teacher
  const creditsEarned = calculateEarnedCredits(
    booking.rate_per_hour,
    booking.duration,
    booking.teacher_type,
    booking.complexity
  );

  // Add credits to teacher
  await pool.execute(
    'UPDATE users SET credit_balance = credit_balance + ? WHERE id = ?',
    [creditsEarned, booking.teacher_id]
  );

  // Create transaction for teacher (earn)
  await pool.execute(
    'INSERT INTO transactions (user_id, type, amount, booking_id, description) VALUES (?, ?, ?, ?, ?)',
    [booking.teacher_id, 'earn', creditsEarned, bookingId, earnDesc]
  );

  // Update booking status to completed and mark credits as released
  await pool.execute(
    'UPDATE bookings SET status = ?, completed_at = CURRENT_TIMESTAMP, credits_released = TRUE WHERE id = ?',
    ['completed', bookingId]
  );

  await createNotification(
    booking.teacher_id,
    'booking',
    'Payment released',
    'Credits have been added to your wallet.',
    '/wallet'
  );
  await createNotification(
    booking.learner_id,
    'booking',
    'Session completed',
    'The session is complete. You can leave a review on the Reviews page.',
    '/reviews'
  );
};

/**
 * Legacy complete booking - now triggers the confirmation flow
 * Teacher can complete which triggers their confirmation
 */
export const completeBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [bookings] = await pool.execute(
      `SELECT b.*, s.complexity, s.rate_per_hour, u.user_type as teacher_type
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u ON b.teacher_id = u.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ error: 'Booking must be confirmed before completion' });
    }

    // Check if user is part of this booking
    const isLearner = booking.learner_id === userId;
    const isTeacher = booking.teacher_id === userId;

    if (!isLearner && !isTeacher) {
      return res.status(403).json({ error: 'You are not part of this booking' });
    }

    // Record the confirmation for this user
    if (isLearner) {
      await pool.execute(
        'UPDATE bookings SET learner_confirmed_completion = TRUE, learner_confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } else if (isTeacher) {
      await pool.execute(
        'UPDATE bookings SET teacher_confirmed_completion = TRUE, teacher_confirmed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    // Re-fetch to check status
    const [updatedBookings] = await pool.execute(
      `SELECT b.*, s.complexity, s.rate_per_hour, u.user_type as teacher_type
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u ON b.teacher_id = u.id
       WHERE b.id = ?`,
      [id]
    );
    const updatedBooking = updatedBookings[0];

    // Check if both parties have confirmed
    if (updatedBooking.learner_confirmed_completion && updatedBooking.teacher_confirmed_completion) {
      // Both confirmed - release payment
      if (!updatedBooking.credits_released) {
        await releasePayment(id, updatedBooking);
      }
    }

    const [finalBooking] = await pool.execute(
      `SELECT b.*, s.title as skill_title,
              u1.full_name as learner_name, u1.email as learner_email,
              u2.full_name as teacher_name, u2.email as teacher_email
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u1 ON b.learner_id = u1.id
       JOIN users u2 ON b.teacher_id = u2.id
       WHERE b.id = ?`,
      [id]
    );

    const bothConfirmed = updatedBooking.learner_confirmed_completion && updatedBooking.teacher_confirmed_completion;

    res.json({ 
      booking: finalBooking[0],
      message: bothConfirmed 
        ? 'Session completed. Payment released to teacher!'
        : `Your confirmation recorded. Waiting for ${isLearner ? 'teacher' : 'learner'} to confirm completion.`,
      paymentReleased: bothConfirmed
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status for a booking
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [bookings] = await pool.execute(
      `SELECT b.*, s.title as skill_title, s.rate_per_hour,
              u1.full_name as learner_name,
              u2.full_name as teacher_name
       FROM bookings b
       JOIN skills s ON b.skill_id = s.id
       JOIN users u1 ON b.learner_id = u1.id
       JOIN users u2 ON b.teacher_id = u2.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];

    // Check if user is part of this booking
    if (booking.learner_id !== userId && booking.teacher_id !== userId) {
      return res.status(403).json({ error: 'You are not part of this booking' });
    }

    res.json({
      bookingId: booking.id,
      status: booking.status,
      creditsCost: booking.credits_cost,
      learnerConfirmed: booking.learner_confirmed_completion || false,
      teacherConfirmed: booking.teacher_confirmed_completion || false,
      creditsReleased: booking.credits_released || false,
      completedAt: booking.completed_at,
      learnerConfirmedAt: booking.learner_confirmed_at,
      teacherConfirmedAt: booking.teacher_confirmed_at,
    });
  } catch (error) {
    next(error);
  }
};
