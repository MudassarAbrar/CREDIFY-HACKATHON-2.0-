import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
} from '../controllers/followController.js';

const router = express.Router();

router.post('/:userId', authenticateToken, followUser);
router.delete('/:userId', authenticateToken, unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/status', authenticateToken, isFollowing);

export default router;
