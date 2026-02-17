import express from 'express';
import { getTransactions } from '../controllers/transactionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getTransactions);

export default router;
