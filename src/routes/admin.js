const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getAllUsers, getAllMentors, updateMentorProfile,
  getRecommendations, createBooking, getAllBookings, updateBookingStatus
} = require('../controllers/adminController');

const adminOnly = [authenticate, requireRole('admin')];

router.get('/users', ...adminOnly, getAllUsers);
router.get('/mentors', ...adminOnly, getAllMentors);
router.put('/mentors/:mentorId/profile', ...adminOnly, updateMentorProfile);
router.get('/recommendations', ...adminOnly, getRecommendations);
router.post('/bookings', ...adminOnly, createBooking);
router.get('/bookings', ...adminOnly, getAllBookings);
router.patch('/bookings/:id/status', ...adminOnly, updateBookingStatus);

module.exports = router;
