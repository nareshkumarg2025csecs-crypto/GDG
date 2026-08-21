const request = require('supertest');

process.env.ADMIN_SIGNUP_CODE = 'test-admin-secret-code';

// In-memory mock store for testing
const mockUsers = new Map();
const mockProfiles = new Map();

// Helper to reset store
const resetMockData = () => {
  mockUsers.clear();
  mockProfiles.clear();
};

// Mock the Supabase module
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    auth: {
      signUp: jest.fn(async ({ email, password, options }) => {
        const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const user = {
          id,
          email,
          user_metadata: options?.data || {},
        };
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
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
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
        if (!user) {
          return { data: { user: null }, error: { message: 'User not found' } };
        }
        return {
          data: {
            user: {
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString(),
            },
          },
          error: null,
        };
      }),
      admin: {
        deleteUser: jest.fn(async (id) => {
          mockUsers.delete(id);
          mockProfiles.delete(id);
          return { data: {}, error: null };
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
              created_at: new Date().toISOString(),
            };
            mockProfiles.set(row.id, profile);
            return {
              select: () => ({
                single: async () => ({ data: profile, error: null }),
              }),
            };
          }),
          select: jest.fn((fields) => ({
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
            order: jest.fn(() => ({
              then: (resolve) => resolve({ data: Array.from(mockProfiles.values()), error: null }),
            })),
          })),
          update: jest.fn((updates) => ({
            eq: jest.fn((col, val) => {
              if (col === 'id') {
                const existing = mockProfiles.get(val) || {};
                const updated = { ...existing, ...updates };
                mockProfiles.set(val, updated);
                return {
                  select: () => ({ single: async () => ({ data: updated, error: null }) }),
                  then: (res) => res({ data: updated, error: null }),
                };
              }
              return {
                select: () => ({ single: async () => ({ data: null, error: null }) }),
                then: (res) => res({ data: null, error: null }),
              };
            }),
          })),
        };
      }

      if (table === 'activity_logs') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            return {
              select: () => ({
                single: async () => ({ data: { id: 'mock-log-id', ...row }, error: null }),
              }),
            };
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

describe('College Club Backend API Tests', () => {
  beforeEach(() => {
    resetMockData();
    jest.clearAllMocks();
  });

  describe('Health and Root Endpoint', () => {
    test('GET /api/health returns status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Authentication - Sign Up', () => {
    test('POST /api/auth/student/signup registers a student successfully with role "student" (no code required)', async () => {
      const payload = {
        email: 'student@college.edu',
        password: 'Password123!',
        full_name: 'Alex Student',
        // Attempting to pass role in body should be ignored:
        role: 'admin',
      };

      const res = await request(app)
        .post('/api/auth/student/signup')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.role).toBe('student'); // Must be 'student', ignoring request body
      expect(res.body.profile.full_name).toBe('Alex Student');
      expect(res.body.profile.email).toBe('student@college.edu');
      expect(res.body.access_token).toBeDefined();
    });

    test('POST /api/auth/admin/signup registers an admin successfully when valid admin_code is provided', async () => {
      const payload = {
        email: 'admin@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Morgan Admin',
        admin_code: 'test-admin-secret-code',
      };

      const res = await request(app)
        .post('/api/auth/admin/signup')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.role).toBe('admin'); // Must be 'admin'
      expect(res.body.profile.full_name).toBe('Morgan Admin');
      expect(res.body.access_token).toBeDefined();
    });

    test('POST /api/auth/admin/signup REJECTS admin signup when admin_code is missing (403)', async () => {
      const payload = {
        email: 'admin.nocode@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Morgan NoCode',
      };

      const res = await request(app)
        .post('/api/auth/admin/signup')
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or missing admin signup code/i);
    });

    test('POST /api/auth/admin/signup REJECTS admin signup when admin_code is wrong (403)', async () => {
      const payload = {
        email: 'admin.wrongcode@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Morgan WrongCode',
        admin_code: 'completely-wrong-code',
      };

      const res = await request(app)
        .post('/api/auth/admin/signup')
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or missing admin signup code/i);
    });

    test('POST /api/auth/student/signup fails on missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/student/signup')
        .send({ email: 'incomplete@college.edu' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Validation error/i);
    });

    test('POST /api/auth/student/signup fails when password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'shortpass@college.edu',
          password: '123',
          full_name: 'Short Pass User',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 6 characters/i);
    });
  });

  describe('Authentication - Login & Role Verification', () => {
    let studentToken;
    let adminToken;

    beforeEach(async () => {
      // Create student
      const studentRes = await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'student.login@college.edu',
          password: 'StudentPassword123',
          full_name: 'Test Student',
        });
      studentToken = studentRes.body.access_token;

      // Create admin
      const adminRes = await request(app)
        .post('/api/auth/admin/signup')
        .send({
          email: 'admin.login@college.edu',
          password: 'AdminPassword123',
          full_name: 'Test Admin',
          admin_code: 'test-admin-secret-code',
        });
      adminToken = adminRes.body.access_token;
    });

    test('POST /api/auth/student/login succeeds with student credentials', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .send({
          email: 'student.login@college.edu',
          password: 'StudentPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.profile.role).toBe('student');
    });

    test('POST /api/auth/admin/login succeeds with admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'admin.login@college.edu',
          password: 'AdminPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.profile.role).toBe('admin');
    });

    test('POST /api/auth/admin/login REJECTS a student user even with valid credentials (403)', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({
          email: 'student.login@college.edu',
          password: 'StudentPassword123',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Role mismatch.*student.*admin/i);
    });

    test('POST /api/auth/student/login REJECTS an admin user even with valid credentials (403)', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .send({
          email: 'admin.login@college.edu',
          password: 'AdminPassword123',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Role mismatch.*admin.*student/i);
    });

    test('POST /api/auth/student/login fails on wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/student/login')
        .send({
          email: 'student.login@college.edu',
          password: 'WrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid email or password/i);
    });
  });

  describe('Protected Routes & Role-Based Access Control', () => {
    let studentToken;
    let adminToken;

    beforeEach(async () => {
      const studentRes = await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'student.rbac@college.edu',
          password: 'Password123',
          full_name: 'RBAC Student',
        });
      studentToken = studentRes.body.access_token;

      const adminRes = await request(app)
        .post('/api/auth/admin/signup')
        .send({
          email: 'admin.rbac@college.edu',
          password: 'Password123',
          full_name: 'RBAC Admin',
          admin_code: 'test-admin-secret-code',
        });
      adminToken = adminRes.body.access_token;
    });

    // 1. Route: /api/me (all authenticated users)
    describe('GET /api/me', () => {
      test('fails with 401 when no token is provided', async () => {
        const res = await request(app).get('/api/me');
        expect(res.status).toBe(401);
      });

      test('succeeds (200) for authenticated student', async () => {
        const res = await request(app)
          .get('/api/me')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.profile.role).toBe('student');
        expect(res.body.profile.full_name).toBe('RBAC Student');
      });

      test('succeeds (200) for authenticated admin', async () => {
        const res = await request(app)
          .get('/api/me')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.profile.role).toBe('admin');
        expect(res.body.profile.full_name).toBe('RBAC Admin');
      });
    });

    // 2. Route: /api/student/dashboard (student only)
    describe('GET /api/student/dashboard', () => {
      test('fails with 401 when unauthenticated', async () => {
        const res = await request(app).get('/api/student/dashboard');
        expect(res.status).toBe(401);
      });

      test('succeeds (200) for student', async () => {
        const res = await request(app)
          .get('/api/student/dashboard')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.dashboard).toBeDefined();
        expect(res.body.dashboard.student_info.role).toBe('student');
      });

      test('fails with 403 Forbidden for admin user', async () => {
        const res = await request(app)
          .get('/api/student/dashboard')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Forbidden/i);
      });
    });

    // 3. Route: /api/admin/members (admin only)
    describe('GET /api/admin/members', () => {
      test('fails with 401 when unauthenticated', async () => {
        const res = await request(app).get('/api/admin/members');
        expect(res.status).toBe(401);
      });

      test('succeeds (200) for admin', async () => {
        const res = await request(app)
          .get('/api/admin/members')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.members).toBeDefined();
        expect(res.body.summary).toBeDefined();
      });

      test('fails with 403 Forbidden for student user', async () => {
        const res = await request(app)
          .get('/api/admin/members')
          .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(403);
        expect(res.body.error).toMatch(/Forbidden/i);
      });
    });
  });
});
