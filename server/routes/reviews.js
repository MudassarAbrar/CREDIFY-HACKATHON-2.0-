import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createReview, getUserReviews, updateReview, deleteReview } from '../controllers/reviewController.js';

const router = express.Router();

router.post('/', authenticateToken, createReview);
router.get('/user/:userId', getUserReviews);
router.put('/:reviewId', authenticateToken, updateReview);
router.delete('/:reviewId', authenticateToken, deleteReview);

export default router;
