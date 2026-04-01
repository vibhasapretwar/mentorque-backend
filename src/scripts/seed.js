require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const SALT_ROUNDS = 10;

const mentors = [
  {
    name: 'Arjun Sharma',
    email: 'arjun@mentorque.com',
    password: 'mentor123',
    tags: ['tech', 'big_company', 'senior_developer', 'india'],
    description: 'Senior Software Engineer at Google with 10+ years in distributed systems. Ex-Amazon. Strong background in system design and algorithms.',
    company_type: 'big_tech',
    domain: 'backend_engineering',
    location: 'India',
  },
  {
    name: 'Priya Kapoor',
    email: 'priya@mentorque.com',
    password: 'mentor123',
    tags: ['tech', 'big_company', 'good_communication', 'india'],
    description: 'Staff Engineer at Microsoft. Expert in frontend architecture and career transitions. Known for exceptional communication and mentoring skills.',
    company_type: 'big_tech',
    domain: 'frontend_engineering',
    location: 'India',
  },
  {
    name: 'Cian Murphy',
    email: 'cian@mentorque.com',
    password: 'mentor123',
    tags: ['non_tech', 'public_company', 'good_communication', 'ireland'],
    description: 'Product Manager at Salesforce Ireland. Specializes in job market navigation, resume crafting, and interview preparation for product roles.',
    company_type: 'public_company',
    domain: 'product_management',
    location: 'Ireland',
  },
  {
    name: 'Rohit Verma',
    email: 'rohit@mentorque.com',
    password: 'mentor123',
    tags: ['tech', 'big_company', 'senior_developer', 'india'],
    description: 'Principal Engineer at Meta with deep expertise in mobile engineering (Android/iOS). Conducted 500+ technical interviews at FAANG companies.',
    company_type: 'big_tech',
    domain: 'mobile_engineering',
    location: 'India',
  },
  {
    name: 'Siobhan Walsh',
    email: 'siobhan@mentorque.com',
    password: 'mentor123',
    tags: ['non_tech', 'public_company', 'good_communication', 'ireland'],
    description: 'HR Director at LinkedIn Ireland. Expert in job market trends, salary negotiation, personal branding, and connecting talent with opportunities.',
    company_type: 'public_company',
    domain: 'human_resources',
    location: 'Ireland',
  },
];

const users = [
  {
    name: 'Aarav Patel',
    email: 'aarav@example.com',
    password: 'user123',
    tags: ['tech', 'good_communication'],
    description: 'Mid-level backend developer with 4 years experience in Python/Django. Looking to transition to a senior role at a top-tier tech company.',
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha@example.com',
    password: 'user123',
    tags: ['tech', 'asks_a_lot_of_questions'],
    description: 'Frontend developer with React expertise. Wants to crack FAANG interviews and improve system design skills. Currently at a startup.',
  },
  {
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    password: 'user123',
    tags: ['tech', 'good_communication'],
    description: 'Mobile engineer (iOS) at a mid-size company. Targeting big tech companies. Has 6 years of experience and needs mock interview practice.',
  },
  {
    name: 'Ananya Nair',
    email: 'ananya@example.com',
    password: 'user123',
    tags: ['non_tech', 'good_communication'],
    description: 'Aspiring Product Manager transitioning from a business analyst role. Needs guidance on the PM job market and resume optimization.',
  },
  {
    name: 'Rahul Gupta',
    email: 'rahul@example.com',
    password: 'user123',
    tags: ['tech', 'asks_a_lot_of_questions'],
    description: 'Recent CS graduate seeking first full-time role in backend engineering. Needs resume help and understanding of the current hiring landscape.',
  },
  {
    name: 'Meera Iyer',
    email: 'meera@example.com',
    password: 'user123',
    tags: ['tech', 'good_communication'],
    description: 'Data engineer at a financial services firm. Looking to move into ML engineering at big tech. Needs mock interviews for ML system design.',
  },
  {
    name: 'Karthik Balan',
    email: 'karthik@example.com',
    password: 'user123',
    tags: ['non_tech', 'asks_a_lot_of_questions'],
    description: 'Business development professional exploring a career shift into tech sales or product. Needs comprehensive job market guidance.',
  },
  {
    name: 'Divya Menon',
    email: 'divya@example.com',
    password: 'user123',
    tags: ['tech', 'good_communication'],
    description: 'DevOps/SRE engineer wanting to pivot to cloud architecture roles at top companies. Needs resume revamp and interview prep.',
  },
  {
    name: 'Suresh Kumar',
    email: 'suresh@example.com',
    password: 'user123',
    tags: ['tech', 'asks_a_lot_of_questions'],
    description: 'Android developer with 5 years experience at a startup. Targeting Google and Samsung. Needs mock interviews and system design coaching.',
  },
  {
    name: 'Pooja Sharma',
    email: 'pooja@example.com',
    password: 'user123',
    tags: ['non_tech', 'good_communication'],
    description: 'Marketing manager with 7 years of experience. Interested in transitioning to a growth/product role in a tech company.',
  },
];

const adminUser = {
  name: 'Admin User',
  email: process.env.ADMIN_EMAIL || 'admin@mentorque.com',
  password: process.env.ADMIN_PASSWORD || 'admin123',
};

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM recommendations');
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM availability');
    await client.query('DELETE FROM mentor_profiles');
    await client.query('DELETE FROM users');

    console.log('🗑️  Cleared existing data');

    // Create admin
    const adminHash = await bcrypt.hash(adminUser.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO users (email, password, name, role, tags, description)
       VALUES ($1, $2, $3, 'admin', '{}', 'System Administrator')`,
      [adminUser.email, adminHash, adminUser.name]
    );
    console.log('✅ Admin created');

    // Create mentors
    for (const mentor of mentors) {
      const hash = await bcrypt.hash(mentor.password, SALT_ROUNDS);
      const res = await client.query(
        `INSERT INTO users (email, password, name, role, tags, description)
         VALUES ($1, $2, $3, 'mentor', $4, $5) RETURNING id`,
        [mentor.email, hash, mentor.name, mentor.tags, mentor.description]
      );
      const mentorId = res.rows[0].id;

      await client.query(
        `INSERT INTO mentor_profiles (user_id, tags, description, company_type, domain, location)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [mentorId, mentor.tags, mentor.description, mentor.company_type, mentor.domain, mentor.location]
      );

      // Seed availability (Mon-Fri, 9am-5pm)
      for (let day = 1; day <= 5; day++) {
        await client.query(
          `INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_recurring)
           VALUES ($1, $2, '09:00', '17:00', true)`,
          [mentorId, day]
        );
      }
    }
    console.log('✅ 5 Mentors created with availability');

    // Create users
    for (const user of users) {
      const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
      const res = await client.query(
        `INSERT INTO users (email, password, name, role, tags, description)
         VALUES ($1, $2, $3, 'user', $4, $5) RETURNING id`,
        [user.email, hash, user.name, user.tags, user.description]
      );
      const userId = res.rows[0].id;

      // Seed availability (weekday evenings)
      for (let day = 1; day <= 5; day++) {
        await client.query(
          `INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_recurring)
           VALUES ($1, $2, '18:00', '21:00', true)`,
          [userId, day]
        );
      }
    }
    console.log('✅ 10 Users created with availability');

    await client.query('COMMIT');
    console.log('\n🎉 Seed complete!');
    console.log('\nLogin credentials:');
    console.log(`  Admin:   ${adminUser.email} / ${adminUser.password}`);
    console.log('  Mentors: arjun@mentorque.com ... siobhan@mentorque.com / mentor123');
    console.log('  Users:   aarav@example.com ... pooja@example.com / user123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
