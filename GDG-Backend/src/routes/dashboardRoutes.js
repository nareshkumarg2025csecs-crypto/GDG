const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getDashboard,
  updateDashboard,
  getUserNotifications,
} = require('../controllers/dashboardController');

const router = express.Router();

// Common user dashboard (Students and Admins view and update their own details)
router.get('/', requireAuth, getDashboard);
router.put('/', requireAuth, updateDashboard);
router.get('/notifications', requireAuth, getUserNotifications);

module.exports = router;
