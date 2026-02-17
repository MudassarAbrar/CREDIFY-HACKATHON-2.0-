import pool from '../config/database.js';

export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unread_only } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND read_at IS NULL';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const [notifications] = await pool.execute(query, params);

    res.json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [notifications] = await pool.execute(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (parseInt(notifications[0].user_id) !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.execute(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await pool.execute(
      'UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const [notifications] = await pool.execute(
      'SELECT user_id FROM notifications WHERE id = ?',
      [id]
    );

    if (notifications.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (parseInt(notifications[0].user_id) !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await pool.execute('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};
