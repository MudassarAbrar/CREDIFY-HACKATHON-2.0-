import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Load .env file from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverDir, '.env') });

async function runMigrations() {
  let connection;
  try {
    // First, connect without database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'peer_skill_exchange'}\``);
    console.log('✅ Database created/verified');

    // Switch to the database
    await connection.query(`USE \`${process.env.DB_NAME || 'peer_skill_exchange'}\``);

    // Read and execute migration file
    const migrationFile = path.join(__dirname, '001_create_database.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => {
      const trimmed = stmt.trim();
      return trimmed.length > 0 && 
             !trimmed.toLowerCase().includes('create database') &&
             !trimmed.toLowerCase().startsWith('use ');
    });
    
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        try {
          await connection.query(trimmed);
          const preview = trimmed.substring(0, 60).replace(/\s+/g, ' ');
          console.log(`✅ Executed: ${preview}...`);
        } catch (err) {
          // Ignore "table already exists" errors
          if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_ENTRY') {
            throw err;
          }
          console.log(`⚠️  Table/index already exists, skipping...`);
        }
      }
    }
    
    console.log('✅ Database migrations completed successfully');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

runMigrations();
