import express from 'express';
import { getUser, updateUser, getUserSkills } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/:id', getUser);
router.put('/:id', authenticateToken, updateUser);
router.get('/:id/skills', getUserSkills);

export default router;
