const request = require('supertest');

process.env.ADMIN_SIGNUP_CODE = 'log-test-admin-code';

// In-memory data store for tests
const mockUsers = new Map();
const mockProfiles = new Map();
const mockEvents = new Map();
const mockForms = new Map();
const mockSubmissions = new Map();
const mockActivityLogs = [];

// Helper to reset stores
const resetData = () => {
  mockUsers.clear();
  mockProfiles.clear();
  mockEvents.clear();
  mockForms.clear();
  mockSubmissions.clear();
  mockActivityLogs.length = 0;
};

// Mock Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    auth: {
      signUp: jest.fn(async ({ email, password, options }) => {
        const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const user = { id, email, user_metadata: options?.data || {} };
        mockUsers.set(id, { ...user, password });
        return {
          data: {
            user,
            session: {
              access_token: `mock-jwt-token-for-${id}`,
              refresh_token: `mock-refresh-token-for-${id}`,
            },
          },
          error: null,
        };
      }),
      signInWithPassword: jest.fn(async ({ email, password }) => {
        for (const [id, user] of mockUsers.entries()) {
          if (user.email === email && user.password === password) {
            return {
              data: {
                user: { id: user.id, email: user.email },
                session: {
                  access_token: `mock-jwt-token-for-${user.id}`,
                  refresh_token: `mock-refresh-token-for-${user.id}`,
                },
              },
              error: null,
            };
          }
        }
        return { data: { user: null, session: null }, error: { message: 'Invalid credentials' } };
      }),
    },
  };

  const mockSupabaseAdmin = {
    auth: {
      getUser: jest.fn(async (token) => {
        if (!token || !token.startsWith('mock-jwt-token-for-')) {
          return { data: { user: null }, error: { message: 'Invalid token' } };
        }
        const userId = token.replace('mock-jwt-token-for-', '');
        const user = mockUsers.get(userId);
        if (!user) return { data: { user: null }, error: { message: 'User not found' } };
        return { data: { user: { id: user.id, email: user.email } }, error: null };
      }),
    },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const profile = {
              id: row.id,
              email: row.email,
              full_name: row.full_name,
              role: row.role,
              details: row.details || {},
              created_at: new Date().toISOString(),
            };
            mockProfiles.set(row.id, profile);
            return { select: () => ({ single: async () => ({ data: profile, error: null }) }) };
          }),
          select: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              single: async () => {
                if (col === 'id') {
                  const profile = mockProfiles.get(val);
                  return profile
                    ? { data: profile, error: null }
                    : { data: null, error: { message: 'Profile not found' } };
                }
                for (const p of mockProfiles.values()) {
                  if (p[col] === val) return { data: p, error: null };
                }
                return { data: null, error: { message: 'Profile not found' } };
              },
              maybeSingle: async () => {
                if (col === 'id') {
                  const profile = mockProfiles.get(val);
                  return { data: profile || null, error: null };
                }
                for (const p of mockProfiles.values()) {
                  if (p[col] === val) return { data: p, error: null };
                }
                return { data: null, error: null };
              },
            })),
          })),
          update: jest.fn((updates) => ({
            eq: jest.fn((col, val) => ({
              select: () => ({
                single: async () => {
                  const existing = col === 'id' ? mockProfiles.get(val) : (() => {
                    for (const p of mockProfiles.values()) if (p[col] === val) return p;
                  })();
                  if (!existing) return { data: null, error: { message: 'Not found' } };
                  const updated = { ...existing, ...updates };
                  mockProfiles.set(existing.id, updated);
                  return { data: updated, error: null };
                },
              }),
            })),
          })),
        };
      }

      if (table === 'events') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const event = { id, ...row };
            mockEvents.set(id, event);
            return { select: () => ({ single: async () => ({ data: event, error: null }) }) };
          }),
          select: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              single: async () => {
                const event = mockEvents.get(val);
                return event ? { data: event, error: null } : { data: null, error: { message: 'Not found' } };
              },
            })),
          })),
          update: jest.fn((updates) => ({
            eq: jest.fn((col, val) => ({
              select: () => ({
                single: async () => {
                  const existing = mockEvents.get(val);
                  if (!existing) return { data: null, error: { message: 'Not found' } };
                  const updated = { ...existing, ...updates };
                  mockEvents.set(val, updated);
                  return { data: updated, error: null };
                },
              }),
            })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              select: () => ({
                single: async () => {
                  const existing = mockEvents.get(val);
                  if (!existing) return { data: null, error: { message: 'Not found' } };
                  mockEvents.delete(val);
                  return { data: existing, error: null };
                },
              }),
            })),
          })),
        };
      }

      if (table === 'forms') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const id = `form-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const form = { id, ...row };
            mockForms.set(id, form);
            return { select: () => ({ single: async () => ({ data: form, error: null }) }) };
          }),
          select: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              single: async () => {
                const form = mockForms.get(val);
                return form ? { data: form, error: null } : { data: null, error: { message: 'Not found' } };
              },
            })),
          })),
          update: jest.fn((updates) => ({
            eq: jest.fn((col, val) => ({
              select: () => ({
                single: async () => {
                  const existing = mockForms.get(val);
                  if (!existing) return { data: null, error: { message: 'Not found' } };
                  const updated = { ...existing, ...updates };
                  mockForms.set(val, updated);
                  return { data: updated, error: null };
                },
              }),
            })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              select: () => ({
                single: async () => {
                  const existing = mockForms.get(val);
                  if (!existing) return { data: null, error: { message: 'Not found' } };
                  mockForms.delete(val);
                  return { data: existing, error: null };
                },
              }),
            })),
          })),
        };
      }

      if (table === 'activity_logs') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const log = { id, ...row };
            mockActivityLogs.unshift(log); // Prepend so newest first
            return { select: () => ({ single: async () => ({ data: log, error: null }) }) };
          }),
          select: jest.fn((fields, options) => {
            let filtered = [...mockActivityLogs];
            const builder = {
              eq: jest.fn((col, val) => {
                filtered = filtered.filter((l) => l[col] === val);
                return builder;
              }),
              gte: jest.fn((col, val) => {
                filtered = filtered.filter((l) => new Date(l[col]) >= new Date(val));
                return builder;
              }),
              lte: jest.fn((col, val) => {
                filtered = filtered.filter((l) => new Date(l[col]) <= new Date(val));
                return builder;
              }),
              order: jest.fn((col, { ascending = true } = {}) => {
                filtered.sort((a, b) =>
                  ascending
                    ? new Date(a[col]) - new Date(b[col])
                    : new Date(b[col]) - new Date(a[col])
                );
                return builder;
              }),
              range: jest.fn((from, to) => {
                const paged = filtered.slice(from, to + 1);
                return Promise.resolve({
                  data: paged,
                  count: filtered.length,
                  error: null,
                });
              }),
              then: (resolve) =>
                resolve({ data: filtered, count: filtered.length, error: null }),
            };
            return builder;
          }),
        };
      }

      return {};
    }),
  };

  return {
    supabase: mockSupabase,
    supabaseAdmin: mockSupabaseAdmin,
  };
});

const app = require('../src/app');

describe('Audit & Activity Logs Test Suite', () => {
  let studentToken, studentId;
  let adminToken, adminId;

  beforeEach(async () => {
    resetData();
    jest.clearAllMocks();

    // 1. Sign up student
    const sRes = await request(app)
      .post('/api/auth/student/signup')
      .set('X-Forwarded-For', '203.0.113.195')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0)')
      .send({
        email: 'audit.student@college.edu',
        password: 'Password123!',
        full_name: 'Audit Student',
      });
    studentToken = sRes.body.access_token;
    studentId = sRes.body.profile.id;

    // 2. Sign up admin
    const aRes = await request(app)
      .post('/api/auth/admin/signup')
      .set('X-Forwarded-For', '198.51.100.25')
      .send({
        email: 'audit.admin@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Audit Admin',
        admin_code: 'log-test-admin-code',
      });
    adminToken = aRes.body.access_token;
    adminId = aRes.body.profile.id;
  });

  describe('1. Authentication Activity Logging', () => {
    test('Successful login creates an activity log entry with IP and action "login"', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .set('X-Forwarded-For', '203.0.113.50')
        .set('User-Agent', 'TestRunner/1.0')
        .send({
          email: 'audit.student@college.edu',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);

      const loginLog = mockActivityLogs.find(
        (l) => l.action === 'login' && l.user_id === studentId
      );
      expect(loginLog).toBeDefined();
      expect(loginLog.ip_address).toBe('203.0.113.50');
      expect(loginLog.user_agent).toBe('TestRunner/1.0');
      expect(loginLog.location).toBeDefined();
    });

    test('Failed login creates an activity log entry with user_id: null and action "login_failed"', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .set('X-Forwarded-For', '198.51.100.99')
        .send({
          email: 'nonexistent@college.edu',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);

      const failedLog = mockActivityLogs.find((l) => l.action === 'login_failed');
      expect(failedLog).toBeDefined();
      expect(failedLog.user_id).toBeNull();
      expect(failedLog.details.email).toBe('nonexistent@college.edu');
      expect(failedLog.ip_address).toBe('198.51.100.99');
    });

    test('Logout creates an activity log entry with action "logout"', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);

      const logoutLog = mockActivityLogs.find(
        (l) => l.action === 'logout' && l.user_id === studentId
      );
      expect(logoutLog).toBeDefined();
    });
  });

  describe('2. Event & Form Activity Logging', () => {
    let eventId;
    let formId;

    test('Admin creating, updating, and deleting an event generates corresponding audit logs', async () => {
      // 1. Create Event
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Audit Test Workshop' });

      expect(createRes.status).toBe(201);
      eventId = createRes.body.event.id;

      const createLog = mockActivityLogs.find((l) => l.action === 'event_created');
      expect(createLog).toBeDefined();
      expect(createLog.user_id).toBe(adminId);
      expect(createLog.details.event_id).toBe(eventId);

      // 2. Update Event
      const updateRes = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Audit Workshop' });

      expect(updateRes.status).toBe(200);
      const updateLog = mockActivityLogs.find((l) => l.action === 'event_updated');
      expect(updateLog).toBeDefined();
      expect(updateLog.details.event_id).toBe(eventId);

      // 3. Delete Event
      const deleteRes = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(200);
      const deleteLog = mockActivityLogs.find((l) => l.action === 'event_deleted');
      expect(deleteLog).toBeDefined();
      expect(deleteLog.details.event_id).toBe(eventId);
    });

    test('Admin creating, updating, and deleting a form generates corresponding audit logs', async () => {
      // First create event
      const eventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Hackathon Event' });
      const evtId = eventRes.body.event.id;

      // 1. Create Form
      const formCreate = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ event_id: evtId, title: 'RSVP Form' });

      expect(formCreate.status).toBe(201);
      formId = formCreate.body.form.id;

      const formCreateLog = mockActivityLogs.find((l) => l.action === 'form_created');
      expect(formCreateLog).toBeDefined();
      expect(formCreateLog.details.form_id).toBe(formId);

      // 2. Update Form
      const formUpdate = await request(app)
        .put(`/api/forms/${formId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated RSVP Form' });

      expect(formUpdate.status).toBe(200);
      const formUpdateLog = mockActivityLogs.find((l) => l.action === 'form_updated');
      expect(formUpdateLog).toBeDefined();

      // 3. Delete Form
      const formDelete = await request(app)
        .delete(`/api/forms/${formId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(formDelete.status).toBe(200);
      const formDeleteLog = mockActivityLogs.find((l) => l.action === 'form_deleted');
      expect(formDeleteLog).toBeDefined();
    });
  });

  describe('3. Admin Activity Log Access & Filtering (GET /api/admin/logs)', () => {
    test('Student CANNOT access activity logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    test('Admin can fetch paginated activity logs (200 OK)', async () => {
      const res = await request(app)
        .get('/api/admin/logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs).toBeDefined();
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });

    test('Admin can filter activity logs by action', async () => {
      const res = await request(app)
        .get('/api/admin/logs?action=signup')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.logs.every((l) => l.action === 'signup')).toBe(true);
    });
  });
});
