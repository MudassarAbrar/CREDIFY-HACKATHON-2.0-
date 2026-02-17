/**
 * Run migration 003 - Payment confirmation flow
 * Usage: node run-migration.js
 */
import pool from './config/database.js';

const COLUMNS = [
  { name: 'learner_confirmed_completion', sql: 'ALTER TABLE bookings ADD COLUMN learner_confirmed_completion BOOLEAN DEFAULT FALSE' },
  { name: 'teacher_confirmed_completion', sql: 'ALTER TABLE bookings ADD COLUMN teacher_confirmed_completion BOOLEAN DEFAULT FALSE' },
  { name: 'learner_confirmed_at', sql: 'ALTER TABLE bookings ADD COLUMN learner_confirmed_at TIMESTAMP NULL' },
  { name: 'teacher_confirmed_at', sql: 'ALTER TABLE bookings ADD COLUMN teacher_confirmed_at TIMESTAMP NULL' },
  { name: 'completed_at', sql: 'ALTER TABLE bookings ADD COLUMN completed_at TIMESTAMP NULL' },
  { name: 'credits_released', sql: 'ALTER TABLE bookings ADD COLUMN credits_released BOOLEAN DEFAULT FALSE' },
  { name: 'notes', sql: 'ALTER TABLE bookings ADD COLUMN notes TEXT' },
];

async function runMigration() {
  try {
    const [rows] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings'",
      [process.env.DB_NAME || 'peer_skill_exchange']
    );
    const existing = new Set(rows.map(r => r.COLUMN_NAME));

    for (const col of COLUMNS) {
      if (existing.has(col.name)) {
        console.log(`  Skip ${col.name} (already exists)`);
      } else {
        await pool.execute(col.sql);
        console.log(`  Added ${col.name}`);
      }
    }
    console.log('Migration 003 completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
