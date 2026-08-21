const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');
const formRoutes = require('./formRoutes');
const dashboardRoutes = require('./dashboardRoutes');

const router = express.Router();

// Health Check Route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GDG College Club Backend API',
  });
});

// Mount modular sub-routers under /api
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/forms', formRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/', userRoutes); // Legacy /me, /student/dashboard, /admin/members

module.exports = router;
