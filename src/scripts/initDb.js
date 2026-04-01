require('dotenv').config();
const { pool } = require('../db');

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user','mentor','admin')),
        tags TEXT[] DEFAULT '{}',
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS mentor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        tags TEXT[] DEFAULT '{}',
        description TEXT DEFAULT '',
        company_type VARCHAR(50) DEFAULT '',
        domain VARCHAR(100) DEFAULT '',
        location VARCHAR(100) DEFAULT '',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_recurring BOOLEAN DEFAULT TRUE,
        specific_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        call_type VARCHAR(50) NOT NULL CHECK (call_type IN ('resume_revamp','job_market_guidance','mock_interview')),
        scheduled_at TIMESTAMP NOT NULL,
        duration_minutes INT DEFAULT 60,
        status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        call_type VARCHAR(50),
        score NUMERIC(5,2) DEFAULT 0,
        reasoning TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDb().catch(console.error);
