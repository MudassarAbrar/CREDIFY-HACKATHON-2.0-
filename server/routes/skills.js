import express from 'express';
import {
  getSkills,
  getSkill,
  createSkill,
  updateSkill,
  deleteSkill,
  createSkillRequest
} from '../controllers/skillController.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getSkills);
router.get('/:id', getSkill);
router.post('/', authenticateToken, createSkill);
router.put('/:id', authenticateToken, updateSkill);
router.delete('/:id', authenticateToken, deleteSkill);
router.post('/request', authenticateToken, createSkillRequest);

export default router;
