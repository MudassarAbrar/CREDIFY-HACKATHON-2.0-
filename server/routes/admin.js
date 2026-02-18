import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getStats,
  getDisputes,
  getDisputeById,
  getBookingConversation,
  postDisputeMessage,
  patchDispute,
} from '../controllers/adminController.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

router.get('/stats', getStats);
router.get('/disputes', getDisputes);
router.get('/disputes/:id', getDisputeById);
router.get('/bookings/:bookingId/conversation', getBookingConversation);
router.post('/disputes/:id/messages', postDisputeMessage);
router.patch('/disputes/:id', patchDispute);

export default router;
