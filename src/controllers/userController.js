const { query } = require('../db');

const getProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, name, role, tags, description, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  const { tags, description } = req.body;
  try {
    const result = await query(
      'UPDATE users SET tags = $1, description = $2 WHERE id = $3 RETURNING id, email, name, role, tags, description',
      [tags || [], description || '', req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyBookings = async (req, res) => {
  try {
    const result = await query(`
      SELECT b.*,
        m.name AS mentor_name, m.email AS mentor_email,
        mp.domain, mp.company_type
      FROM bookings b
      LEFT JOIN users m ON b.mentor_id = m.id
      LEFT JOIN mentor_profiles mp ON m.id = mp.user_id
      WHERE b.user_id = $1
      ORDER BY b.scheduled_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getProfile, updateProfile, getMyBookings };
