import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getSkillRequests,
  getSkillRequest,
  createSkillRequest,
  updateSkillRequest,
  closeSkillRequest,
} from '../controllers/skillRequestController.js';

const router = express.Router();

router.get('/', getSkillRequests);
router.get('/:id', getSkillRequest);
router.post('/', authenticateToken, createSkillRequest);
router.put('/:id', authenticateToken, updateSkillRequest);
router.put('/:id/close', authenticateToken, closeSkillRequest);

export default router;
