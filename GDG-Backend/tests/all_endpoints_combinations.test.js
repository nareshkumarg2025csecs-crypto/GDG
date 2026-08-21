const request = require('supertest');

process.env.ADMIN_SIGNUP_CODE = 'combo-admin-secret-code';

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
                const profile = mockProfiles.get(val);
                return profile
                  ? { data: profile, error: null }
                  : { data: null, error: { message: 'Profile not found' } };
              },
              maybeSingle: async () => {
                const profile = mockProfiles.get(val);
                return { data: profile || null, error: null };
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

// Mock Google Calendar API fetch calls
global.fetch = jest.fn(async (url) => {
  if (url.includes('googleapis.com/calendar/v3')) {
    return {
      ok: true,
      json: async () => ({
        id: 'cal-mock-event-999',
        htmlLink: 'https://calendar.google.com/event?eid=999',
        status: 'confirmed',
      }),
    };
  }
  if (url.includes('oauth2.googleapis.com/token')) {
    return {
      ok: true,
      json: async () => ({
        access_token: 'refreshed-access-token-999',
        expires_in: 3600,
      }),
    };
  }
  return { ok: false, json: async () => ({ error: 'Not found' }) };
});

const app = require('../src/app');

describe('Comprehensive API Endpoint & Combination Tests', () => {
  let studentToken, studentId;
  let adminToken, adminId;

  beforeEach(async () => {
    resetData();
    jest.clearAllMocks();

    // 1. Sign up student (no code required)
    const sRes = await request(app)
      .post('/api/auth/student/signup')
      .send({
        email: 'combo.student@college.edu',
        password: 'StudentPassword123!',
        full_name: 'Combination Student',
        details: { department: 'CS' },
      });
    studentToken = sRes.body.access_token;
    studentId = sRes.body.profile.id;

    // 2. Sign up admin with valid code
    const aRes = await request(app)
      .post('/api/auth/admin/signup')
      .send({
        email: 'combo.admin@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Combination Admin',
        admin_code: 'combo-admin-secret-code',
      });
    adminToken = aRes.body.access_token;
    adminId = aRes.body.profile.id;
  });

  // =========================================================================
  // 1. AUTH COMBINATIONS & ADMIN_SIGNUP_CODE TESTS
  // =========================================================================
  describe('1. Auth Routes Combinations & Admin Code Security', () => {
    test('POST /api/auth/student/signup succeeds without any admin_code (student unaffected)', async () => {
      const res = await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'unaffected.student@college.edu',
          password: 'PassWord123!',
          full_name: 'Unaffected Student',
        });
      expect(res.status).toBe(201);
      expect(res.body.profile.role).toBe('student');
    });

    test('POST /api/auth/admin/signup REJECTS when admin_code is missing (403)', async () => {
      const res = await request(app)
        .post('/api/auth/admin/signup')
        .send({
          email: 'admin.nocode@college.edu',
          password: 'AdminPassword123!',
          full_name: 'No Code Admin',
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or missing admin signup code/i);
    });

    test('POST /api/auth/admin/signup REJECTS when admin_code is wrong (403)', async () => {
      const res = await request(app)
        .post('/api/auth/admin/signup')
        .send({
          email: 'admin.wrongcode@college.edu',
          password: 'AdminPassword123!',
          full_name: 'Wrong Code Admin',
          admin_code: 'wrong-secret-code',
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or missing admin signup code/i);
    });

    test('GET /api/auth/google/url with role=admin REJECTS if admin_code is invalid (403)', async () => {
      const res = await request(app).get('/api/auth/google/url?role=admin&admin_code=wrong');
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or missing admin signup code/i);
    });

    test('GET /api/auth/google/url with role=admin SUCCEEDS with valid admin_code', async () => {
      const res = await request(app).get(
        '/api/auth/google/url?role=admin&admin_code=combo-admin-secret-code'
      );
      expect(res.status).toBe(200);
      expect(res.body.url).toContain('supabase-auth-oauth.com');
      expect(res.body.role_requested).toBe('admin');
    });

    test('POST /api/auth/google/sync-profile with role=admin REJECTS when admin_code is missing/wrong (403)', async () => {
      const res = await request(app)
        .post('/api/auth/google/sync-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          role: 'admin',
          admin_code: 'invalid-code',
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or missing admin signup code/i);
    });

    test('POST /api/auth/student/signup with missing email returns 400', async () => {
      const res = await request(app)
        .post('/api/auth/student/signup')
        .send({ password: 'Pass123!', full_name: 'No Email' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation error/i);
    });

    test('POST /api/auth/student/login with invalid password returns 401', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .send({ email: 'combo.student@college.edu', password: 'WrongPassword' });
      expect(res.status).toBe(401);
    });

    test('POST /api/auth/admin/login rejects student account (403 Role Mismatch)', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'combo.student@college.edu', password: 'StudentPassword123!' });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Role mismatch/i);
    });

    test('POST /api/auth/student/login rejects admin account (403 Role Mismatch)', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .send({ email: 'combo.admin@college.edu', password: 'AdminPassword123!' });
      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Role mismatch/i);
    });

    test('GET /api/auth/google/url returns Google OAuth URL with Calendar scopes for default student', async () => {
      const res = await request(app).get('/api/auth/google/url');
      expect(res.status).toBe(200);
      expect(res.body.url).toContain('supabase-auth-oauth.com');
      expect(res.body.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
    });
  });

  // =========================================================================
  // 2. EVENT MANAGEMENT COMBINATIONS (Admin only vs Student read)
  // =========================================================================
  describe('2. Event Routes Combinations', () => {
    let testEventId;

    test('Admin creates event with flexible JSONB details (201)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Google DevFest 2026',
          details: {
            venue: 'Main Auditorium',
            tracks: ['Web', 'Cloud', 'AI'],
            capacity: 200,
          },
        });
      expect(res.status).toBe(201);
      expect(res.body.event.title).toBe('Google DevFest 2026');
      expect(res.body.event.details.tracks.length).toBe(3);
      testEventId = res.body.event.id;
    });

    test('Admin create event fails without title (400)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ details: { venue: 'Hall' } });
      expect(res.status).toBe(400);
    });

    test('Student attempting to create event is blocked (403)', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Student Event' });
      expect(res.status).toBe(403);
    });

    test('Unauthenticated user cannot create or list events (401)', async () => {
      const createRes = await request(app).post('/api/events').send({ title: 'Anon' });
      expect(createRes.status).toBe(401);

      const listRes = await request(app).get('/api/events');
      expect(listRes.status).toBe(401);
    });

    test('Student and Admin can view event list and get event by ID (200)', async () => {
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Hackathon 2026', details: { prize: '$5000' } });
      const eventId = createRes.body.event.id;

      const studentView = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentView.status).toBe(200);
      expect(studentView.body.event.title).toBe('Hackathon 2026');

      const adminList = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminList.status).toBe(200);
      expect(adminList.body.events.length).toBeGreaterThanOrEqual(1);
    });

    test('Get non-existent event ID returns 404', async () => {
      const res = await request(app)
        .get('/api/events/non-existent-id')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // 3. DYNAMIC FORMS & SCHEMA VALIDATION COMBINATIONS
  // =========================================================================
  describe('3. Dynamic Forms & Exact Schema Matching Combinations', () => {
    let eventId;
    let formId;

    beforeEach(async () => {
      // Create an event for the form
      const eventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'AI Hackathon' });
      eventId = eventRes.body.event.id;

      // Create a dynamic form with strict field schema
      const formRes = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          event_id: eventId,
          title: 'Team Registration Form',
          schema: {
            fields: [
              { name: 'team_name', label: 'Team Name', type: 'text', required: true, minLength: 3 },
              { name: 'team_size', label: 'Team Size', type: 'number', required: true, min: 1, max: 4 },
              { name: 'track', label: 'Competition Track', type: 'select', options: ['AI', 'Web', 'Cloud'], required: true },
              { name: 'lead_email', label: 'Team Lead Email', type: 'email', required: true },
              { name: 'need_mentor', label: 'Need a Mentor?', type: 'boolean', required: false },
            ],
          },
        });
      formId = formRes.body.form.id;
    });

    test('Student submission with VALID answers matching schema succeeds (201)', async () => {
      const validAnswers = {
        team_name: 'Neural Ninjas',
        team_size: 3,
        track: 'AI',
        lead_email: 'lead@college.edu',
        need_mentor: true,
      };

      const res = await request(app)
        .post(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: validAnswers });

      expect(res.status).toBe(201);
      expect(res.body.submission.answers.team_name).toBe('Neural Ninjas');
      expect(res.body.submission.user_id).toBe(studentId);
    });

    test('Submission FAILS when required field (team_name) is missing (400)', async () => {
      const invalidAnswers = {
        team_size: 2,
        track: 'AI',
        lead_email: 'lead@college.edu',
      };

      const res = await request(app)
        .post(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: invalidAnswers });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/validation failed/i);
      expect(res.body.validation_errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/Field 'Team Name' is required/i)])
      );
    });

    test('Submission FAILS when number validation fails (team_size > max) (400)', async () => {
      const invalidAnswers = {
        team_name: 'Big Team',
        team_size: 10, // Max is 4
        track: 'Web',
        lead_email: 'lead@college.edu',
      };

      const res = await request(app)
        .post(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: invalidAnswers });

      expect(res.status).toBe(400);
      expect(res.body.validation_errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/at most 4/i)])
      );
    });

    test('Submission FAILS when select option is invalid (400)', async () => {
      const invalidAnswers = {
        team_name: 'Valid Name',
        team_size: 2,
        track: 'Blockchain', // Not in ['AI', 'Web', 'Cloud']
        lead_email: 'lead@college.edu',
      };

      const res = await request(app)
        .post(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: invalidAnswers });

      expect(res.status).toBe(400);
      expect(res.body.validation_errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/Allowed options: \[AI, Web, Cloud\]/i)])
      );
    });

    test('Submission FAILS when email format is invalid (400)', async () => {
      const invalidAnswers = {
        team_name: 'Valid Name',
        team_size: 2,
        track: 'AI',
        lead_email: 'not-an-email-string',
      };

      const res = await request(app)
        .post(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: invalidAnswers });

      expect(res.status).toBe(400);
      expect(res.body.validation_errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/valid email address/i)])
      );
    });

    test('Admin creates form with non-existent event_id returns 404', async () => {
      const res = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ event_id: 'non-existent-event', title: 'Orphan Form' });
      expect(res.status).toBe(404);
    });

    test('Student CANNOT create form (403)', async () => {
      const res = await request(app)
        .post('/api/forms')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ event_id: eventId, title: 'Student Form' });
      expect(res.status).toBe(403);
    });

    test('Admin can view form submissions, Student views own submissions (200)', async () => {
      // Valid submission
      await request(app)
        .post(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: {
            team_name: 'Alpha Team',
            team_size: 2,
            track: 'Web',
            lead_email: 'alpha@college.edu',
          },
        });

      const adminSubmissions = await request(app)
        .get(`/api/forms/${formId}/submissions`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminSubmissions.status).toBe(200);
      expect(adminSubmissions.body.submissions.length).toBe(1);

      const mySubmissions = await request(app)
        .get('/api/forms/submissions/my')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(mySubmissions.status).toBe(200);
      expect(mySubmissions.body.submissions.length).toBe(1);
    });
  });

  // =========================================================================
  // 4. USER DASHBOARD COMBINATIONS
  // =========================================================================
  describe('4. User Dashboard Combinations', () => {
    test('GET /api/dashboard returns user info and JSONB details', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.dashboard.role).toBe('student');
      expect(res.body.dashboard.details.department).toBe('CS');
    });

    test('PUT /api/dashboard updates details and strips role tampering', async () => {
      const res = await request(app)
        .put('/api/dashboard')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          full_name: 'Alex Johnson Updated',
          details: {
            github: 'https://github.com/alexj',
            graduation_year: 2028,
          },
          role: 'admin', // Malicious attempt to elevate role
        });

      expect(res.status).toBe(200);
      expect(res.body.dashboard.full_name).toBe('Alex Johnson Updated');
      expect(res.body.dashboard.role).toBe('student'); // MUST STAY STUDENT
      expect(res.body.dashboard.details.graduation_year).toBe(2028);
    });
  });

  // =========================================================================
  // 5. GOOGLE CALENDAR REMINDER COMBINATIONS
  // =========================================================================
  describe('5. Google Calendar Reminders Combinations', () => {
    let eventId;

    beforeEach(async () => {
      const eventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Google Cloud Workshop',
          details: { startTime: '2026-10-15T10:00:00Z', endTime: '2026-10-15T12:00:00Z' },
        });
      eventId = eventRes.body.event.id;
    });

    test('Unlinked email/password user receives prompt to connect Google (connected: false)', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/calendar-reminder`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.connected).toBe(false);
      expect(res.body.action_required).toBe('CONNECT_GOOGLE_CALENDAR');
    });

    test('Linking Google tokens enables successful calendar event insertion', async () => {
      // 1. Link token
      await request(app)
        .post('/api/auth/google/tokens')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ access_token: 'mock-google-token', expires_in: 3600 });

      // 2. Request reminder
      const res = await request(app)
        .post(`/api/events/${eventId}/calendar-reminder`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.calendar_event_id).toBe('cal-mock-event-999');
    });
  });
});
