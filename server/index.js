import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import skillRoutes from './routes/skills.js';
import bookingRoutes from './routes/bookings.js';
import transactionRoutes from './routes/transactions.js';
import matchingRoutes from './routes/matching.js';
import profileRoutes from './routes/profiles.js';
import reviewRoutes from './routes/reviews.js';
import skillRequestRoutes from './routes/skillRequests.js';
import messageRoutes from './routes/messages.js';
import followRoutes from './routes/follows.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import disputeRoutes from './routes/disputes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Peer Skill Exchange API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/skill-requests', skillRequestRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/disputes', disputeRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
