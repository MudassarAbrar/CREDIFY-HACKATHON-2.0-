import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteMessage,
  deleteConversation,
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/conversations', authenticateToken, getConversations);
router.get('/conversations/:id', authenticateToken, getConversation);
router.post('/conversations', authenticateToken, createConversation);
router.post('/conversations/:id/messages', authenticateToken, sendMessage);
router.put('/conversations/:id/read', authenticateToken, markAsRead);
router.delete('/conversations/:conversationId/messages/:messageId', authenticateToken, deleteMessage);
router.delete('/conversations/:id', authenticateToken, deleteConversation);
router.get('/unread-count', authenticateToken, getUnreadCount);

export default router;
