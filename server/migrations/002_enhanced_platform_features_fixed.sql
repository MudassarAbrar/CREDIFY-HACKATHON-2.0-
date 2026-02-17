-- Enhanced Platform Features Migration
USE peer_skill_exchange;

-- Update users table - Add bio column if not exists
ALTER TABLE users ADD COLUMN bio TEXT;

-- Update users table - Add avatar_url column if not exists  
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

-- Update users table - Add rating column if not exists
ALTER TABLE users ADD COLUMN rating DECIMAL(3, 2) DEFAULT 0.00;

-- Update users table - Add total_reviews column if not exists
ALTER TABLE users ADD COLUMN total_reviews INT DEFAULT 0;

-- Update skills table - Add type column if not exists
ALTER TABLE skills ADD COLUMN type ENUM('offer', 'request') DEFAULT 'offer';

-- User Profile Extensions
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  portfolio_url VARCHAR(255),
  location VARCHAR(255),
  timezone VARCHAR(50),
  institution VARCHAR(255),
  degree VARCHAR(255),
  graduation_year INT,
  company VARCHAR(255),
  job_title VARCHAR(255),
  years_experience INT,
  languages JSON,
  availability_status ENUM('available', 'busy', 'away') DEFAULT 'available',
  response_time_hours INT DEFAULT 24,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reviewer_id INT NOT NULL,
  reviewee_id INT NOT NULL,
  booking_id INT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_type ENUM('as_teacher', 'as_learner') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  UNIQUE KEY unique_review (reviewer_id, reviewee_id, booking_id),
  INDEX idx_reviewee_id (reviewee_id),
  INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skill Requests
CREATE TABLE IF NOT EXISTS skill_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  preferred_rate_max DECIMAL(10, 2),
  urgency ENUM('low', 'medium', 'high') DEFAULT 'medium',
  budget DECIMAL(10, 2),
  status ENUM('open', 'in_progress', 'filled', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  participant1_id INT NOT NULL,
  participant2_id INT NOT NULL,
  booking_id INT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  UNIQUE KEY unique_conversation (participant1_id, participant2_id, booking_id),
  INDEX idx_participant1 (participant1_id),
  INDEX idx_participant2 (participant2_id),
  INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id (sender_id),
  INDEX idx_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Follows/Connections
CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  follower_id INT NOT NULL,
  followee_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, followee_id),
  INDEX idx_follower_id (follower_id),
  INDEX idx_followee_id (followee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('message', 'booking', 'review', 'follow', 'proposal', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  link VARCHAR(500),
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_read_at (read_at),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
