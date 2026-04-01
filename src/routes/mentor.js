const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProfile, getMyBookings } = require('../controllers/mentorController');

router.get('/profile', authenticate, requireRole('mentor'), getProfile);
router.get('/bookings', authenticate, requireRole('mentor'), getMyBookings);

module.exports = router;
