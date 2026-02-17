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

    const migrationFile = path.join(__dirname, '002_enhanced_platform_features_fixed.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split SQL by semicolon but handle multi-line statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'USE peer_skill_exchange');

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
          console.log(`✅ Executed: ${preview}...`);
        } catch (err) {
          // Ignore "duplicate column" and "table exists" errors
          if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
            const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
            console.log(`⚠️  Skipped (already exists): ${preview}...`);
          } else {
            console.error(`❌ Error executing: ${statement.substring(0, 60)}...`);
            console.error('Error details:', err.message);
            console.error('Error code:', err.code);
            throw err;
          }
        }
      }
    }
    
    console.log('✅ Migration 002 completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
