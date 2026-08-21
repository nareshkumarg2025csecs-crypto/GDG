const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getDashboard,
  updateDashboard,
} = require('../controllers/dashboardController');

const router = express.Router();

// Common user dashboard (Students and Admins view and update their own details)
router.get('/', requireAuth, getDashboard);
router.put('/', requireAuth, updateDashboard);

module.exports = router;
