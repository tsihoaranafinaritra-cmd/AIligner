const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.NEON_DATABASE_URL);

const createTables = async () => {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        gender VARCHAR(20),
        passport_photo TEXT,
        subscription_code VARCHAR(100),
        subscription_type VARCHAR(50),
        role VARCHAR(20) DEFAULT 'user',
        is_banned BOOLEAN DEFAULT false,
        total_earned DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tasks table
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        task_text TEXT,
        voice_recording TEXT,
        status VARCHAR(20) DEFAULT 'in_progress',
        admin_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Exams table
    await sql`
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        exam_type VARCHAR(50),
        answers JSONB,
        recording_files JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        score INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Withdrawals table
    await sql`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        amount DECIMAL(10,2),
        method VARCHAR(50),
        details JSONB,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        admin_message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Subscription codes table
    await sql`
      CREATE TABLE IF NOT EXISTS subscription_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) UNIQUE NOT NULL,
        type VARCHAR(50),
        is_used BOOLEAN DEFAULT false,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

module.exports = { sql, createTables };