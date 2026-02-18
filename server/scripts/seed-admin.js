/**
 * Create or update admin user. Run after migrations.
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env (or use defaults below).
 * Usage: cd server && node scripts/seed-admin.js  (so server/.env is loaded)
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import pool from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const DEFAULT_ADMIN_EMAIL = 'admin@credify.local';
const DEFAULT_ADMIN_PASSWORD = 'Admin123!';

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

  try {
    const [users] = await pool.execute('SELECT id, role FROM users WHERE email = ?', [email]);
    const password_hash = await bcrypt.hash(password, 10);

    if (users.length === 0) {
      await pool.execute(
        'INSERT INTO users (email, password_hash, user_type, full_name, credit_balance, role) VALUES (?, ?, ?, ?, ?, ?)',
        [email, password_hash, 'professional', 'Platform Admin', 0, 'admin']
      );
      console.log(`Admin user created: ${email}`);
    } else {
      await pool.execute('UPDATE users SET role = ?, password_hash = ? WHERE id = ?', [
        'admin',
        password_hash,
        users[0].id,
      ]);
      console.log(`Admin user updated (role set, password updated): ${email}`);
    }
    console.log('Login with the above email and your ADMIN_PASSWORD (or default).');
  } catch (err) {
    console.error('seed-admin failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
