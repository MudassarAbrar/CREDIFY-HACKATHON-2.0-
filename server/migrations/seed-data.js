import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(serverDir, '.env') });

const users = [
  {
    email: 'sarah.student@example.com',
    password: 'password123',
    user_type: 'student',
    full_name: 'Sarah Martinez',
    credit_balance: 150.00
  },
  {
    email: 'david.pro@example.com',
    password: 'password123',
    user_type: 'professional',
    full_name: 'David Kim',
    credit_balance: 200.00
  },
  {
    email: 'emma.student@example.com',
    password: 'password123',
    user_type: 'student',
    full_name: 'Emma Lee',
    credit_balance: 120.00
  },
  {
    email: 'john.pro@example.com',
    password: 'password123',
    user_type: 'professional',
    full_name: 'John Smith',
    credit_balance: 180.00
  },
  {
    email: 'lisa.student@example.com',
    password: 'password123',
    user_type: 'student',
    full_name: 'Lisa Chen',
    credit_balance: 100.00
  },
];

const skills = [
  {
    user_id: 2, // David Kim
    title: 'Web Development',
    description: 'Learn modern web development with React, Node.js, and best practices. Perfect for beginners and intermediate developers.',
    category: 'Programming',
    rate_per_hour: 25.00,
    complexity: 'moderate',
    status: 'active'
  },
  {
    user_id: 4, // John Smith
    title: 'Graphic Design',
    description: 'Master Adobe Photoshop, Illustrator, and design principles. Create stunning visuals and build your portfolio.',
    category: 'Design',
    rate_per_hour: 30.00,
    complexity: 'moderate',
    status: 'active'
  },
  {
    user_id: 2, // David Kim
    title: 'Data Science',
    description: 'Introduction to Python, pandas, and machine learning. Learn to analyze data and build predictive models.',
    category: 'Programming',
    rate_per_hour: 35.00,
    complexity: 'complex',
    status: 'active'
  },
  {
    user_id: 4, // John Smith
    title: 'Digital Marketing',
    description: 'Learn SEO, social media marketing, and content strategy. Grow your online presence and reach your audience.',
    category: 'Marketing',
    rate_per_hour: 20.00,
    complexity: 'simple',
    status: 'active'
  },
  {
    user_id: 2, // David Kim
    title: 'Mobile App Development',
    description: 'Build iOS and Android apps using React Native. From setup to deployment, learn the full mobile development cycle.',
    category: 'Programming',
    rate_per_hour: 40.00,
    complexity: 'complex',
    status: 'active'
  },
];

async function seedDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'peer_skill_exchange',
    });

    console.log('✅ Connected to database');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    await connection.query('DELETE FROM transactions');
    await connection.query('DELETE FROM bookings');
    await connection.query('DELETE FROM skills');
    await connection.query('DELETE FROM user_skills');
    await connection.query('DELETE FROM users WHERE email LIKE ?', ['%@example.com']);

    // Insert users
    console.log('👥 Creating users...');
    const userIds = [];
    for (const user of users) {
      const password_hash = await bcrypt.hash(user.password, 10);
      const [result] = await connection.query(
        'INSERT INTO users (email, password_hash, user_type, full_name, credit_balance) VALUES (?, ?, ?, ?, ?)',
        [user.email, password_hash, user.user_type, user.full_name, user.credit_balance]
      );
      userIds.push(result.insertId);
      console.log(`  ✅ Created user: ${user.full_name} (${user.email})`);
    }

    // Update skill user_ids to match inserted users
    skills[0].user_id = userIds[1]; // David Kim
    skills[1].user_id = userIds[3]; // John Smith
    skills[2].user_id = userIds[1]; // David Kim
    skills[3].user_id = userIds[3]; // John Smith
    skills[4].user_id = userIds[1]; // David Kim

    // Insert skills
    console.log('📚 Creating skills...');
    for (const skill of skills) {
      await connection.query(
        'INSERT INTO skills (user_id, title, description, category, rate_per_hour, complexity, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [skill.user_id, skill.title, skill.description, skill.category, skill.rate_per_hour, skill.complexity, skill.status]
      );
      console.log(`  ✅ Created skill: ${skill.title}`);
    }

    // Create some bookings
    console.log('📅 Creating sample bookings...');
    const [skillRows] = await connection.query('SELECT id, user_id, rate_per_hour, complexity FROM skills LIMIT 2');
    
    if (skillRows.length >= 2) {
      const skill1 = skillRows[0];
      const skill2 = skillRows[1];
      const learnerId = userIds[0]; // Sarah Martinez
      const teacherId1 = skill1.user_id;
      const teacherId2 = skill2.user_id;

      // Create a completed booking
      const scheduledAt1 = new Date();
      scheduledAt1.setDate(scheduledAt1.getDate() - 2);
      const [booking1] = await connection.query(
        'INSERT INTO bookings (skill_id, learner_id, teacher_id, scheduled_at, duration, status, credits_cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [skill1.id, learnerId, teacherId1, scheduledAt1, 2, 'completed', 40.00]
      );

      // Create transaction for completed booking
      await connection.query(
        'INSERT INTO transactions (user_id, type, amount, booking_id, description) VALUES (?, ?, ?, ?, ?)',
        [teacherId1, 'earn', 60.00, booking1.insertId, 'Earned credits from completed session']
      );
      await connection.query(
        'INSERT INTO transactions (user_id, type, amount, booking_id, description) VALUES (?, ?, ?, ?, ?)',
        [learnerId, 'spend', 40.00, booking1.insertId, 'Spent credits for learning session']
      );

      // Create a confirmed booking
      const scheduledAt2 = new Date();
      scheduledAt2.setDate(scheduledAt2.getDate() + 3);
      await connection.query(
        'INSERT INTO bookings (skill_id, learner_id, teacher_id, scheduled_at, duration, status, credits_cost) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [skill2.id, learnerId, teacherId2, scheduledAt2, 1.5, 'confirmed', 30.00]
      );

      console.log('  ✅ Created sample bookings');
    }

    // Create user skills (proficiencies)
    console.log('🎯 Creating user skills...');
    await connection.query(
      'INSERT INTO user_skills (user_id, skill_name, proficiency_level, endorsements_count) VALUES (?, ?, ?, ?)',
      [userIds[0], 'Web Development', 'intermediate', 5]
    );
    await connection.query(
      'INSERT INTO user_skills (user_id, skill_name, proficiency_level, endorsements_count) VALUES (?, ?, ?, ?)',
      [userIds[1], 'Full Stack Development', 'expert', 12]
    );
    await connection.query(
      'INSERT INTO user_skills (user_id, skill_name, proficiency_level, endorsements_count) VALUES (?, ?, ?, ?)',
      [userIds[2], 'Graphic Design', 'beginner', 2]
    );
    console.log('  ✅ Created user skills');

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Test Accounts:');
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} / password123 (${user.user_type})`);
    });

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

seedDatabase();
