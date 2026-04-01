const { query } = require('../db');

const getMyAvailability = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM availability WHERE user_id = $1 ORDER BY day_of_week, start_time',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const addAvailability = async (req, res) => {
  const { day_of_week, start_time, end_time, is_recurring, specific_date } = req.body;
  if (day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({ error: 'day_of_week, start_time, end_time are required' });
  }
  try {
    const result = await query(
      `INSERT INTO availability (user_id, day_of_week, start_time, end_time, is_recurring, specific_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, day_of_week, start_time, end_time, is_recurring ?? true, specific_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      'DELETE FROM availability WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Slot not found or not owned by you' });
    res.json({ message: 'Deleted', id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAvailabilityByUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await query(
      'SELECT * FROM availability WHERE user_id = $1 ORDER BY day_of_week, start_time',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getOverlap = async (req, res) => {
  const { userId, mentorId } = req.query;
  if (!userId || !mentorId) return res.status(400).json({ error: 'userId and mentorId required' });
  try {
    const result = await query(
      `SELECT u.day_of_week, u.start_time, u.end_time,
              GREATEST(u.start_time, m.start_time) AS overlap_start,
              LEAST(u.end_time, m.end_time) AS overlap_end
       FROM availability u
       JOIN availability m ON u.day_of_week = m.day_of_week
         AND u.start_time < m.end_time AND u.end_time > m.start_time
       WHERE u.user_id = $1 AND m.user_id = $2`,
      [userId, mentorId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getMyAvailability, addAvailability, deleteAvailability, getAvailabilityByUser, getOverlap };
