const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { createEventReminder, getMyCalendarEvents } = require('../controllers/calendarController');
const { getFormsByEvent } = require('../controllers/formController');
const {
  validateCreateEvent,
  validateUpdateEvent,
} = require('../middleware/validator');

const router = express.Router();

// Authenticated Calendar Reminder Query (must be before /:id)
router.get('/calendar-reminders/me', requireAuth, getMyCalendarEvents);

// Public Event Routes (no auth required to browse/view events and their forms)
router.get('/', listEvents);
router.get('/:id', getEventById);
router.get('/:eventId/forms', getFormsByEvent);

// Admin-only Event Management (strictly audited: requireAuth + requireRole('admin'))
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  validateCreateEvent,
  createEvent
);

router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  validateUpdateEvent,
  updateEvent
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  deleteEvent
);

// Google Calendar Event Reminder Route
router.post('/:eventId/calendar-reminder', requireAuth, createEventReminder);

module.exports = router;
