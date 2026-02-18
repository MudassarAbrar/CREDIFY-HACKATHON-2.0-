/**
 * Run migration 004 - Admin role and Disputes
 * Usage: node migrations/run-migration-004.js (from server dir) or node run-migration-004.js
 */
import pool from '../config/database.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function runMigration004() {
  try {
    const dbName = process.env.DB_NAME || 'peer_skill_exchange';

    // 1. Add role column to users if not exists
    const [cols] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'",
      [dbName]
    );
    if (cols.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'");
      console.log('  Added users.role');
    } else {
      console.log('  users.role already exists');
    }

    // 2. Create disputes table
    await pool.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  disputes table OK');

    // 3. Create dispute_messages table
    await pool.execute(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('  dispute_messages table OK');

    console.log('Migration 004 completed successfully.');
  } catch (err) {
    console.error('Migration 004 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration004();
