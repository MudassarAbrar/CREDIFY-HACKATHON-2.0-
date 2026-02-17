import express from 'express';
import {
  getBookings,
  getBooking,
  createBooking,
  confirmBooking,
  cancelBooking,
  completeBooking,
  confirmCompletion,
  getPaymentStatus
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getBookings);
router.get('/:id/payment-status', authenticateToken, getPaymentStatus);
router.get('/:id', authenticateToken, getBooking);
router.post('/', authenticateToken, createBooking);
router.put('/:id/confirm', authenticateToken, confirmBooking);
router.put('/:id/cancel', authenticateToken, cancelBooking);
router.put('/:id/complete', authenticateToken, completeBooking);
router.put('/:id/confirm-completion', authenticateToken, confirmCompletion);

export default router;
