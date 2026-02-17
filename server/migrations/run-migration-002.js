import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverDir, '.env') });

async function runMigration() {
  let connection;
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'peer_skill_exchange',
      port: process.env.DB_PORT || 3306,
      multipleStatements: true,
    });

    console.log('✅ Connected to MySQL database');

    const migrationFile = path.join(__dirname, '002_enhanced_platform_features.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0 && !stmt.trim().startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log(`✅ Executed: ${statement.trim().substring(0, 60)}...`);
        } catch (err) {
          // Ignore "Duplicate column" errors for ALTER TABLE
          if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠️  Skipped (already exists): ${statement.trim().substring(0, 60)}...`);
          } else {
            throw err;
          }
        }
      }
    }

    console.log('✅ Migration 002 completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
