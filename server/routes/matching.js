import express from 'express';
import { getMatchingTeachers, getMatchingSkills } from '../controllers/matchingController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/skills/:skillId', authenticateToken, getMatchingTeachers);
router.get('/requests/:requestId', authenticateToken, getMatchingSkills);

export default router;
