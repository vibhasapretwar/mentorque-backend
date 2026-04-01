const { query } = require('../db');

const getProfile = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.name, u.role, u.created_at,
             mp.tags, mp.description, mp.company_type, mp.domain, mp.location
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.id = $1
    `, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Mentor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*,
        u.name AS user_name, u.email AS user_email,
        u.tags AS user_tags, u.description AS user_description
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.mentor_id = $1
      ORDER BY b.scheduled_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProfile, getMyBookings };
