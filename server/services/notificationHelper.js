import pool from '../config/database.js';

/**
 * Create a notification for a user.
 * @param {number} userId - Target user id
 * @param {string} type - 'message' | 'booking' | 'review' | 'follow' | 'proposal' | 'system'
 * @param {string} title - Short title
 * @param {string} [content] - Optional body
 * @param {string} [link] - Optional URL to open (e.g. /bookings, /messages?conversation=1)
 */
export async function createNotification(userId, type, title, content = null, link = null) {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, content, link]
    );
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
}
