const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { getProfile, updateProfile, getMyBookings } = require('../controllers/userController');

router.get('/profile', authenticate, requireRole('user'), getProfile);
router.put('/profile', authenticate, requireRole('user'), updateProfile);
router.get('/bookings', authenticate, requireRole('user'), getMyBookings);

module.exports = router;
