import pool from '../config/database.js';
import { createNotification } from '../services/notificationHelper.js';

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [conversations] = await pool.execute(
      `SELECT c.*, 
        CASE 
          WHEN c.participant1_id = ? THEN u2.id
          ELSE u1.id
        END as other_user_id,
        CASE 
          WHEN c.participant1_id = ? THEN u2.full_name
          ELSE u1.full_name
        END as other_user_name,
        CASE 
          WHEN c.participant1_id = ? THEN u2.email
          ELSE u1.email
        END as other_user_email,
        CASE 
          WHEN c.participant1_id = ? THEN u2.avatar_url
          ELSE u1.avatar_url
        END as other_user_avatar,
        (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.read_at IS NULL) as unread_count,
        (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
      FROM conversations c
      JOIN users u1 ON c.participant1_id = u1.id
      JOIN users u2 ON c.participant2_id = u2.id
      WHERE c.participant1_id = ? OR c.participant2_id = ?
      ORDER BY c.last_message_at DESC, c.created_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );

    res.json({ conversations });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get conversation with other user info for header
    const [conversations] = await pool.execute(
      `SELECT c.*,
        CASE WHEN c.participant1_id = ? THEN u2.id ELSE u1.id END as other_user_id,
        CASE WHEN c.participant1_id = ? THEN u2.full_name ELSE u1.full_name END as other_user_name,
        CASE WHEN c.participant1_id = ? THEN u2.email ELSE u1.email END as other_user_email,
        CASE WHEN c.participant1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END as other_user_avatar
      FROM conversations c
      JOIN users u1 ON c.participant1_id = u1.id
      JOIN users u2 ON c.participant2_id = u2.id
      WHERE c.id = ? AND (c.participant1_id = ? OR c.participant2_id = ?)`,
      [userId, userId, userId, userId, id, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const [messages] = await pool.execute(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC`,
      [id]
    );

    // Mark messages as read
    await pool.execute(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
      [id, userId]
    );

    res.json({
      conversation: conversations[0],
      messages,
    });
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { participant2_id, booking_id } = req.body;
    const participant1_id = req.user.id;

    if (!participant2_id) {
      return res.status(400).json({ error: 'participant2_id is required' });
    }

    if (parseInt(participant1_id) === parseInt(participant2_id)) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if conversation already exists
    const [existing] = await pool.execute(
      'SELECT * FROM conversations WHERE ((participant1_id = ? AND participant2_id = ?) OR (participant1_id = ? AND participant2_id = ?)) AND (booking_id = ? OR (? IS NULL AND booking_id IS NULL))',
      [participant1_id, participant2_id, participant2_id, participant1_id, booking_id || null, booking_id || null]
    );

    if (existing.length > 0) {
      return res.json({ conversation: existing[0] });
    }

    // Create new conversation
    const [result] = await pool.execute(
      'INSERT INTO conversations (participant1_id, participant2_id, booking_id) VALUES (?, ?, ?)',
      [participant1_id, participant2_id, booking_id || null]
    );

    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ conversation: conversations[0] });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if user is part of conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [id, senderId, senderId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create message
    const [result] = await pool.execute(
      'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
      [id, senderId, content]
    );

    // Update conversation last_message_at
    await pool.execute(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    const otherUserId = conversations[0].participant1_id === senderId
      ? conversations[0].participant2_id
      : conversations[0].participant1_id;
    const [senderRow] = await pool.execute('SELECT full_name, email FROM users WHERE id = ?', [senderId]);
    const senderName = senderRow[0]?.full_name || senderRow[0]?.email?.split('@')[0] || 'Someone';
    const preview = content.length > 50 ? content.slice(0, 47) + '...' : content;
    await createNotification(
      otherUserId,
      'message',
      `New message from ${senderName}`,
      preview,
      `/messages?conversation=${id}`
    );

    const [messages] = await pool.execute(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({ message: messages[0] });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is part of conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [id, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await pool.execute(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
      [id, userId]
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [result] = await pool.execute(
      `SELECT COUNT(*) as count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE (c.participant1_id = ? OR c.participant2_id = ?)
      AND m.sender_id != ?
      AND m.read_at IS NULL`,
      [userId, userId, userId]
    );

    res.json({ unreadCount: result[0]?.count || 0 });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { conversationId, messageId } = req.params;
    const userId = req.user.id;

    // Check if user is part of conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check if message exists and belongs to user
    const [messages] = await pool.execute(
      'SELECT * FROM messages WHERE id = ? AND conversation_id = ? AND sender_id = ?',
      [messageId, conversationId, userId]
    );

    if (messages.length === 0) {
      return res.status(404).json({ error: 'Message not found or you are not the sender' });
    }

    // Delete the message
    await pool.execute('DELETE FROM messages WHERE id = ?', [messageId]);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is part of conversation
    const [conversations] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)',
      [id, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Delete all messages in the conversation first
    await pool.execute('DELETE FROM messages WHERE conversation_id = ?', [id]);

    // Delete the conversation
    await pool.execute('DELETE FROM conversations WHERE id = ?', [id]);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};
