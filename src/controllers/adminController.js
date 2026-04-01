const { query } = require('../db');

// --- Users ---
const getAllUsers = async (req, res) => {
  try {
    const result = await query(
      "SELECT id, email, name, role, tags, description, created_at FROM users WHERE role = 'user' ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllMentors = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at,
             mp.tags, mp.description, mp.company_type, mp.domain, mp.location
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.role = 'mentor'
      ORDER BY u.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Mentor Profile Management ---
const updateMentorProfile = async (req, res) => {
  const { mentorId } = req.params;
  const { tags, description, company_type, domain, location } = req.body;
  try {
    const mentorCheck = await query("SELECT id FROM users WHERE id = $1 AND role = 'mentor'", [mentorId]);
    if (!mentorCheck.rows.length) return res.status(404).json({ error: 'Mentor not found' });

    await query(`
      INSERT INTO mentor_profiles (user_id, tags, description, company_type, domain, location)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE
      SET tags = $2, description = $3, company_type = $4, domain = $5, location = $6, updated_at = NOW()
    `, [mentorId, tags || [], description || '', company_type || '', domain || '', location || '']);

    res.json({ message: 'Mentor profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Recommendations ---
const getRecommendations = async (req, res) => {
  const { userId, callType } = req.query;
  if (!userId || !callType) return res.status(400).json({ error: 'userId and callType required' });

  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!userResult.rows.length) return res.status(404).json({ error: 'User not found' });
    const user = userResult.rows[0];

    const mentorsResult = await query(`
      SELECT u.id, u.name, u.email, mp.tags, mp.description, mp.company_type, mp.domain, mp.location
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.role = 'mentor'
    `);
    const mentors = mentorsResult.rows;

    // Scoring logic based on call type and tags
    const scored = mentors.map(mentor => {
      let score = 0;
      const reasons = [];
      const mTags = mentor.tags || [];
      const uTags = user.tags || [];

      if (callType === 'resume_revamp') {
        if (mTags.includes('big_company') || mTags.includes('big_tech')) { score += 40; reasons.push('From big tech company'); }
        if (mTags.includes('senior_developer')) { score += 20; reasons.push('Senior developer'); }
        if (mTags.includes('good_communication')) { score += 20; reasons.push('Good communication skills'); }
      } else if (callType === 'job_market_guidance') {
        if (mTags.includes('good_communication')) { score += 50; reasons.push('Excellent communicator'); }
        if (mTags.includes('public_company')) { score += 20; reasons.push('Experience at public company'); }
        if (mentor.domain === 'human_resources' || mentor.domain === 'product_management') { score += 20; reasons.push('Relevant domain expertise'); }
      } else if (callType === 'mock_interview') {
        if (uTags.includes('tech') && mTags.includes('tech')) { score += 40; reasons.push('Same tech domain'); }
        if (uTags.includes('non_tech') && mTags.includes('non_tech')) { score += 40; reasons.push('Same non-tech domain'); }
        if (mTags.includes('senior_developer')) { score += 25; reasons.push('Senior with interview experience'); }
        if (mTags.includes('big_company') || mTags.includes('big_tech')) { score += 15; reasons.push('FAANG experience'); }
      }

      // Tag overlap bonus
      const overlap = uTags.filter(t => mTags.includes(t));
      score += overlap.length * 5;
      if (overlap.length > 0) reasons.push(`Shared interests: ${overlap.join(', ')}`);

      return { ...mentor, score, reasoning: reasons.join('. ') };
    });

    scored.sort((a, b) => b.score - a.score);
    res.json({ user, recommendations: scored });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// --- Bookings ---
const createBooking = async (req, res) => {
  const { user_id, mentor_id, call_type, scheduled_at, duration_minutes, notes } = req.body;
  if (!user_id || !mentor_id || !call_type || !scheduled_at) {
    return res.status(400).json({ error: 'user_id, mentor_id, call_type, scheduled_at required' });
  }
  try {
    const result = await query(
      `INSERT INTO bookings (user_id, mentor_id, admin_id, call_type, scheduled_at, duration_minutes, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, mentor_id, req.user.id, call_type, scheduled_at, duration_minutes || 60, notes || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*,
        u.name AS user_name, u.email AS user_email,
        m.name AS mentor_name, m.email AS mentor_email,
        a.name AS admin_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users m ON b.mentor_id = m.id
      LEFT JOIN users a ON b.admin_id = a.id
      ORDER BY b.scheduled_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateBookingStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  try {
    const result = await query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllUsers, getAllMentors, updateMentorProfile,
  getRecommendations, createBooking, getAllBookings, updateBookingStatus
};
