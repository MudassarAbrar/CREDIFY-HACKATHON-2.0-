import pool from '../config/database.js';

export const createReview = async (req, res, next) => {
  try {
    const { booking_id, rating, review_text, review_type } = req.body;
    const reviewerId = req.user.id;

    if (!booking_id || !rating || !review_type) {
      return res.status(400).json({ error: 'booking_id, rating, and review_type are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Get booking details
    const [bookings] = await pool.execute(
      'SELECT learner_id, teacher_id FROM bookings WHERE id = ?',
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    const revieweeId = review_type === 'as_teacher' ? booking.learner_id : booking.teacher_id;

    if (parseInt(revieweeId) === reviewerId) {
      return res.status(400).json({ error: 'Cannot review yourself' });
    }

    // Check if review already exists
    const [existing] = await pool.execute(
      'SELECT id FROM reviews WHERE reviewer_id = ? AND booking_id = ? AND review_type = ?',
      [reviewerId, booking_id, review_type]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    // Create review
    const [result] = await pool.execute(
      'INSERT INTO reviews (reviewer_id, reviewee_id, booking_id, rating, review_text, review_type) VALUES (?, ?, ?, ?, ?, ?)',
      [reviewerId, revieweeId, booking_id, rating, review_text || null, review_type]
    );

    // Update user stats
    const [ratingResult] = await pool.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?',
      [revieweeId]
    );

    const avgRating = parseFloat(ratingResult[0]?.avg_rating || 0);
    const totalReviews = ratingResult[0]?.total || 0;

    await pool.execute(
      'UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?',
      [avgRating, totalReviews, revieweeId]
    );

    const [reviews] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ review: reviews[0] });
  } catch (error) {
    next(error);
  }
};

/** GET /reviews/my - reviews written by current user (for filtering "already reviewed" bookings) */
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [reviews] = await pool.execute(
      'SELECT id, booking_id, review_type FROM reviews WHERE reviewer_id = ?',
      [userId]
    );
    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    let query = 'SELECT r.*, u.email as reviewer_email, u.full_name as reviewer_name FROM reviews r JOIN users u ON r.reviewer_id = u.id WHERE r.reviewee_id = ?';
    const params = [userId];

    if (type) {
      query += ' AND r.review_type = ?';
      params.push(type);
    }

    query += ' ORDER BY r.created_at DESC';

    const [reviews] = await pool.execute(query, params);

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;

    // Check ownership
    const [reviews] = await pool.execute(
      'SELECT reviewer_id, reviewee_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (parseInt(reviews[0].reviewer_id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own reviews' });
    }

    const updates = [];
    const values = [];

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      updates.push('rating = ?');
      values.push(rating);
    }

    if (review_text !== undefined) {
      updates.push('review_text = ?');
      values.push(review_text);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    values.push(reviewId);
    await pool.execute(
      `UPDATE reviews SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    // Recalculate reviewee rating
    const revieweeId = reviews[0].reviewee_id;
    const [ratingResult] = await pool.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?',
      [revieweeId]
    );

    const avgRating = parseFloat(ratingResult[0]?.avg_rating || 0);
    const totalReviews = ratingResult[0]?.total || 0;

    await pool.execute(
      'UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?',
      [avgRating, totalReviews, revieweeId]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({ review: updated[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // Check ownership
    const [reviews] = await pool.execute(
      'SELECT reviewer_id, reviewee_id FROM reviews WHERE id = ?',
      [reviewId]
    );

    if (reviews.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (parseInt(reviews[0].reviewer_id) !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    const revieweeId = reviews[0].reviewee_id;

    await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId]);

    // Recalculate reviewee rating
    const [ratingResult] = await pool.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE reviewee_id = ?',
      [revieweeId]
    );

    const avgRating = parseFloat(ratingResult[0]?.avg_rating || 0);
    const totalReviews = ratingResult[0]?.total || 0;

    await pool.execute(
      'UPDATE users SET rating = ?, total_reviews = ? WHERE id = ?',
      [avgRating, totalReviews, revieweeId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
