import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getProfile, updateProfile, getUserStats } from '../controllers/profileController.js';

const router = express.Router();

router.get('/:userId', getProfile);
router.put('/:userId', authenticateToken, updateProfile);
router.get('/:userId/stats', getUserStats);

export default router;
