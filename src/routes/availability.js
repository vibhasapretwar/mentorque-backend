const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getMyAvailability, addAvailability, deleteAvailability,
  getAvailabilityByUser, getOverlap
} = require('../controllers/availabilityController');

router.get('/', authenticate, getMyAvailability);
router.post('/', authenticate, requireRole('user', 'mentor'), addAvailability);
router.delete('/:id', authenticate, requireRole('user', 'mentor'), deleteAvailability);
router.get('/user/:userId', authenticate, requireRole('admin'), getAvailabilityByUser);
router.get('/overlap', authenticate, requireRole('admin'), getOverlap);

module.exports = router;
