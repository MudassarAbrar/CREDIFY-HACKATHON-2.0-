import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createDispute,
  getMyDisputes,
  getDisputeById,
  postDisputeMessage,
} from '../controllers/disputeController.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createDispute);
router.get('/', getMyDisputes);
router.get('/:id', getDisputeById);
router.post('/:id/messages', postDisputeMessage);

export default router;
