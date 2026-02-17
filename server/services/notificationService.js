import pool from '../config/database.js';

export const createNotification = async (userId, type, title, content, link = null) => {
  try {
    await pool.execute(
      'INSERT INTO notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, content, link]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const notifyNewMessage = async (userId, senderName, conversationId) => {
  await createNotification(
    userId,
    'message',
    'New Message',
    `You have a new message from ${senderName}`,
    `/messages?conversation=${conversationId}`
  );
};

export const notifyBookingConfirmation = async (userId, bookingId, skillTitle) => {
  await createNotification(
    userId,
    'booking',
    'Booking Confirmed',
    `Your booking for "${skillTitle}" has been confirmed`,
    `/bookings`
  );
};

export const notifyReviewReceived = async (userId, reviewerName, rating) => {
  await createNotification(
    userId,
    'review',
    'New Review',
    `${reviewerName} left you a ${rating}-star review`,
    `/profile`
  );
};

export const notifyNewFollower = async (userId, followerName) => {
  await createNotification(
    userId,
    'follow',
    'New Follower',
    `${followerName} started following you`,
    `/profile`
  );
};

export const notifyProposalReceived = async (userId, requestTitle, teacherName) => {
  await createNotification(
    userId,
    'proposal',
    'New Proposal',
    `${teacherName} submitted a proposal for your request: "${requestTitle}"`,
    `/skill-requests`
  );
};
