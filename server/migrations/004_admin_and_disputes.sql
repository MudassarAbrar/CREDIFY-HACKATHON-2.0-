-- Admin role and Disputes
USE peer_skill_exchange;

-- Add role to users (user | admin)
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @colname = 'role';
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @colname) = 0,
  'ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT ''user''',
  'SELECT 1'
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  raised_by_user_id INT NOT NULL,
  status ENUM('open', 'in_review', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  proof_urls JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  resolved_by INT NULL,
  resolution_notes TEXT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (raised_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  INDEX idx_raised_by (raised_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dispute messages (thread between admin and parties)
CREATE TABLE IF NOT EXISTS dispute_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dispute_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dispute_id (dispute_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
