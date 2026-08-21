const request = require('supertest');

process.env.ADMIN_SIGNUP_CODE = 'test-admin-secret-code';

// In-memory data store for tests
const mockUsers = new Map();
const mockProfiles = new Map();
const mockEvents = new Map();
const mockForms = new Map();
const mockSubmissions = new Map();
const mockGoogleTokens = new Map();

// Helper to reset stores
const resetData = () => {
  mockUsers.clear();
  mockProfiles.clear();
  mockEvents.clear();
  mockForms.clear();
  mockSubmissions.clear();
  mockGoogleTokens.clear();
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
      signInWithOAuth: jest.fn(async ({ provider, options }) => {
        return {
          data: {
            url: `https://supabase-auth-oauth.com/google?scopes=${encodeURIComponent(options.scopes)}`,
            provider,
          },
          error: null,
        };
      }),
      linkIdentity: jest.fn(async ({ provider, options }) => {
        return {
          data: {
            url: `https://supabase-auth-link.com/google?scopes=${encodeURIComponent(options.scopes)}`,
            provider,
          },
          error: null,
        };
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
      admin: {
        getUserById: jest.fn(async (userId) => {
          const user = mockUsers.get(userId);
          if (!user) return { data: { user: null }, error: { message: 'User not found' } };
          return { data: { user }, error: null };
        }),
      },
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
                  return profile ? { data: profile, error: null } : { data: null, error: { message: 'Profile not found' } };
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
                  const existing = mockProfiles.get(val) || {};
                  const updated = { ...existing, ...updates };
                  mockProfiles.set(val, updated);
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
            order: jest.fn(() => ({
              then: (resolve) => resolve({ data: Array.from(mockEvents.values()), error: null }),
            })),
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
                  if (!existing) return { data: null, error: { message: 'Event not found' } };
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
                  if (!existing) return { data: null, error: { message: 'Event not found' } };
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
              order: jest.fn(() => ({
                then: (resolve) =>
                  resolve({
                    data: Array.from(mockForms.values()).filter((f) => f.event_id === val),
                    error: null,
                  }),
              })),
              single: async () => {
                const form = mockForms.get(val);
                return form ? { data: form, error: null } : { data: null, error: { message: 'Form not found' } };
              },
            })),
          })),
          update: jest.fn((updates) => ({
            eq: jest.fn((col, val) => ({
              select: () => ({
                single: async () => {
                  const existing = mockForms.get(val);
                  if (!existing) return { data: null, error: { message: 'Form not found' } };
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
                  if (!existing) return { data: null, error: { message: 'Form not found' } };
                  mockForms.delete(val);
                  return { data: existing, error: null };
                },
              }),
            })),
          })),
        };
      }

      if (table === 'form_submissions') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const id = `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
            const submission = { id, ...row };
            mockSubmissions.set(id, submission);
            return { select: () => ({ single: async () => ({ data: submission, error: null }) }) };
          }),
          select: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              order: jest.fn(() => ({
                then: (resolve) =>
                  resolve({
                    data: Array.from(mockSubmissions.values()).filter(
                      (s) => s.form_id === val || s.user_id === val
                    ),
                    error: null,
                  }),
              })),
            })),
          })),
        };
      }

      if (table === 'user_google_tokens') {
        return {
          upsert: jest.fn((data) => {
            mockGoogleTokens.set(data.user_id, data);
            return { select: () => ({ single: async () => ({ data, error: null }) }) };
          }),
          select: jest.fn(() => ({
            eq: jest.fn((col, val) => ({
              maybeSingle: async () => {
                const token = mockGoogleTokens.get(val);
                return { data: token || null, error: null };
              },
            })),
          })),
        };
      }

      if (table === 'activity_logs') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            return { select: () => ({ single: async () => ({ data: { id: 'mock-log-id', ...row }, error: null }) }) };
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

// Mock fetch for Google Calendar API
global.fetch = jest.fn(async (url, options) => {
  if (url.includes('googleapis.com/calendar/v3')) {
    return {
      ok: true,
      json: async () => ({
        id: 'cal-event-12345',
        htmlLink: 'https://calendar.google.com/calendar/event?eid=12345',
        status: 'confirmed',
      }),
    };
  }
  if (url.includes('oauth2.googleapis.com/token')) {
    return {
      ok: true,
      json: async () => ({
        access_token: 'refreshed-mock-google-token',
        expires_in: 3600,
      }),
    };
  }
  return { ok: false, json: async () => ({ error: 'Not found' }) };
});

const app = require('../src/app');

describe('Extended Features Test Suite', () => {
  let studentToken, studentId;
  let adminToken, adminId;

  beforeEach(async () => {
    resetData();
    jest.clearAllMocks();

    // Register a student
    const studentRes = await request(app)
      .post('/api/auth/student/signup')
      .send({
        email: 'student.feat@college.edu',
        password: 'Password123!',
        full_name: 'Student Feature',
        details: { department: 'Computer Science', year: 2 },
      });
    studentToken = studentRes.body.access_token;
    studentId = studentRes.body.profile.id;

    // Register an admin
    const adminRes = await request(app)
      .post('/api/auth/admin/signup')
      .send({
        email: 'admin.feat@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Admin Feature',
        admin_code: 'test-admin-secret-code',
      });
    adminToken = adminRes.body.access_token;
    adminId = adminRes.body.profile.id;
  });

  // ==========================================
  // 1. EVENT MANAGEMENT (Admin CRUD & Student Read)
  // ==========================================
  describe('Event Management Access Control', () => {
    let createdEventId;

    test('Admin can create an event with JSONB details (201)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Google Cloud Workshop',
          details: {
            venue: 'Auditorium A',
            startTime: '2026-09-20T10:00:00Z',
            endTime: '2026-09-20T12:00:00Z',
            tags: ['cloud', 'gcp', 'workshop'],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.event.title).toBe('Google Cloud Workshop');
      expect(res.body.event.details.venue).toBe('Auditorium A');
      createdEventId = res.body.event.id;
    });

    test('Student CANNOT create an event (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Unauthorized Student Event',
        });

      expect(res.status).toBe(403);
    });

    test('Students and Admins can list events (200)', async () => {
      // First admin creates an event
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Hackathon 2026', details: { prizes: '$1000' } });

      const studentList = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentList.status).toBe(200);
      expect(studentList.body.events.length).toBeGreaterThanOrEqual(1);

      const adminList = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
    });

    test('Admin can update an event (200)', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Old Title', details: { room: '101' } });

      const eventId = createRes.body.event.id;

      const updateRes = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Updated Title', details: { room: '102' } });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.event.title).toBe('New Updated Title');
      expect(updateRes.body.event.details.room).toBe('102');
    });

    test('Student CANNOT update an event (403 Forbidden)', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Event To Protect' });

      const eventId = createRes.body.event.id;

      const updateRes = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hacked Title' });

      expect(updateRes.status).toBe(403);
    });

    test('Admin can delete an event (200), Student is blocked (403)', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Event to Delete' });
      const eventId = createRes.body.event.id;

      const studentDel = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentDel.status).toBe(403);

      const adminDel = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminDel.status).toBe(200);
    });
  });

  // ==========================================
  // 2. FORMS & DYNAMIC SUBMISSIONS
  // ==========================================
  describe('Form Management and Submissions', () => {
    let eventId;
    let formId;

    beforeEach(async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'AI Hackathon' });
      eventId = eventRes.body.event.id;
    });

    test('Admin creates a dynamic form with JSONB schema (201)', async () => {
      const res = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          event_id: eventId,
          title: 'Registration & Team Info',
          schema: {
            fields: [
              { name: 'team_name', type: 'text', required: true },
              { name: 'experience_level', type: 'select', options: ['Beginner', 'Advanced'] },
            ],
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.form.title).toBe('Registration & Team Info');
      expect(res.body.form.schema.fields.length).toBe(2);
      formId = res.body.form.id;
    });

    test('Student CANNOT create a form (403)', async () => {
      const res = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ event_id: eventId, title: 'Unauthorized Form' });

      expect(res.status).toBe(403);
    });

    test('Student submits answers to dynamic form (201)', async () => {
      const formRes = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ event_id: eventId, title: 'Feedback Form' });
      const fId = formRes.body.form.id;

      const submitRes = await request(app)
        .post(`/api/forms/${fId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: {
            rating: 5,
            favorite_track: 'Machine Learning',
            comments: 'Great workshop!',
          },
        });

      expect(submitRes.status).toBe(201);
      expect(submitRes.body.submission.answers.rating).toBe(5);
      expect(submitRes.body.submission.user_id).toBe(studentId);
    });

    test('Admin can view form submissions, student views own submissions', async () => {
      const formRes = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ event_id: eventId, title: 'Survey Form' });
      const fId = formRes.body.form.id;

      await request(app)
        .post(`/api/forms/${fId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { question1: 'Answer 1' } });

      const adminView = await request(app)
        .get(`/api/forms/${fId}/submissions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminView.status).toBe(200);
      expect(adminView.body.submissions.length).toBe(1);

      const studentOwn = await request(app)
        .get('/api/forms/submissions/my')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentOwn.status).toBe(200);
      expect(studentOwn.body.submissions.length).toBe(1);
    });
  });

  // ==========================================
  // 3. DASHBOARD GET & UPDATE
  // ==========================================
  describe('User Dashboard (JSONB details & Owner Protection)', () => {
    test('User can fetch own dashboard details (200)', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.dashboard.email).toBe('student.feat@college.edu');
      expect(res.body.dashboard.details.department).toBe('Computer Science');
    });

    test('User can update own dashboard details (200) without tampering role', async () => {
      const updateRes = await request(app)
        .put('/api/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          full_name: 'Updated Student Name',
          details: {
            github: 'https://github.com/student',
            skills: ['Node.js', 'React'],
          },
          // Attempting to tamper role or email:
          role: 'admin',
          email: 'hacked@admin.edu',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.dashboard.full_name).toBe('Updated Student Name');
      expect(updateRes.body.dashboard.role).toBe('student'); // MUST REMAIN STUDENT
      expect(updateRes.body.dashboard.details.github).toBe('https://github.com/student');
    });
  });

  // ==========================================
  // 4. GOOGLE CALENDAR REMINDERS & LINKING
  // ==========================================
  describe('Google Calendar Reminders Branching Flow', () => {
    let eventId;

    beforeEach(async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Google DevFest 2026',
          details: {
            startTime: '2026-10-01T09:00:00Z',
            endTime: '2026-10-01T17:00:00Z',
            venue: 'Main Campus Hall',
          },
        });
      eventId = eventRes.body.event.id;
    });

    test('Email/Password user with NO linked Google account receives "Connect First" response', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/calendar-reminder`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
      expect(res.body.action_required).toBe('CONNECT_GOOGLE_CALENDAR');
      expect(res.body.message).toMatch(/connect your Google account/i);
    });

    test('Google OAuth endpoint returns linking URL', async () => {
      const linkRes = await request(app)
        .get('/api/auth/google/link')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(linkRes.status).toBe(200);
      expect(linkRes.body.url).toBeDefined();
      expect(linkRes.body.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
    });

    test('User links Google account with tokens and successfully creates calendar reminder', async () => {
      // 1. Link tokens
      const saveTokensRes = await request(app)
        .post('/api/auth/google/tokens')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          access_token: 'mock-google-oauth-access-token',
          refresh_token: 'mock-google-oauth-refresh-token',
          expires_in: 3600,
        });

      expect(saveTokensRes.status).toBe(200);

      // 2. Check link status
      const statusRes = await request(app)
        .get('/api/auth/google/status')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(statusRes.body.connected).toBe(true);

      // 3. Now request calendar reminder -> directly succeeds!
      const reminderRes = await request(app)
        .post(`/api/events/${eventId}/calendar-reminder`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(reminderRes.status).toBe(200);
      expect(reminderRes.body.success).toBe(true);
      expect(reminderRes.body.connected).toBe(true);
      expect(reminderRes.body.calendar_event_id).toBe('cal-event-12345');
    });
  });
});
