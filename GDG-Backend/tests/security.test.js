const request = require('supertest');

process.env.ADMIN_SIGNUP_CODE = 'sec-test-admin-secret-code';
process.env.ADMIN_MAX_LOGIN_ATTEMPTS = '3'; // Strict 3 attempts for test
process.env.ADMIN_LOCKOUT_MINUTES = '15';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://myclub.rajalakshmi.edu.in';

// In-memory data store for tests
const mockUsers = new Map();
const mockProfiles = new Map();
const mockActivityLogs = [];

const resetData = () => {
  mockUsers.clear();
  mockProfiles.clear();
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
        return { data: { user: null, session: null }, error: { message: 'Invalid login credentials' } };
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
              failed_login_count: row.failed_login_count || 0,
              locked_until: row.locked_until || null,
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
                  return profile ? { data: profile, error: null } : { data: null, error: { message: 'Not found' } };
                }
                for (const p of mockProfiles.values()) {
                  if (p[col] === val) return { data: p, error: null };
                }
                return { data: null, error: { message: 'Not found' } };
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
            const log = { id: `log-${Date.now()}-${Math.random()}`, ...row };
            mockActivityLogs.unshift(log);
            return { select: () => ({ single: async () => ({ data: log, error: null }) }) };
          }),
          select: jest.fn((fields, options) => {
            let filtered = [...mockActivityLogs];
            const builder = {
              eq: jest.fn((col, val) => {
                filtered = filtered.filter((l) => l[col] === val);
                return builder;
              }),
              in: jest.fn((col, arr) => {
                filtered = filtered.filter((l) => arr.includes(l[col]));
                return builder;
              }),
              order: jest.fn(() => builder),
              range: jest.fn((from, to) => {
                const paged = filtered.slice(from, to + 1);
                return Promise.resolve({ data: paged, count: filtered.length, error: null });
              }),
              then: (res) => res({ data: filtered, count: filtered.length, error: null }),
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

describe('Security Hardening Test Suite', () => {
  let adminToken, adminId;
  let studentToken, studentId;

  beforeEach(async () => {
    resetData();
    jest.clearAllMocks();

    // 1. Create student
    const sRes = await request(app)
      .post('/api/auth/student/signup')
      .send({
        email: 'sec.student@college.edu',
        password: 'StudentPassword123!',
        full_name: 'Security Student',
      });
    studentToken = sRes.body.access_token;
    studentId = sRes.body.profile.id;

    // 2. Create admin
    const aRes = await request(app)
      .post('/api/auth/admin/signup')
      .send({
        email: 'sec.admin@college.edu',
        password: 'AdminPassword123!',
        full_name: 'Security Admin',
        admin_code: 'sec-test-admin-secret-code',
      });
    adminToken = aRes.body.access_token;
    adminId = aRes.body.profile.id;
  });

  describe('1. Account Lockout & Suspicious Activity Alerts', () => {
    test('Consecutive failed login attempts increment failed count and trigger lockout after threshold', async () => {
      // 1st failed attempt
      const res1 = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'sec.admin@college.edu', password: 'WrongPassword1' });
      expect(res1.status).toBe(401);

      // 2nd failed attempt (threshold - 1: suspicious alert logged)
      const res2 = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'sec.admin@college.edu', password: 'WrongPassword2' });
      expect(res2.status).toBe(401);

      const suspiciousLog = mockActivityLogs.find(
        (l) => l.action === 'suspicious_admin_login_activity'
      );
      expect(suspiciousLog).toBeDefined();

      // 3rd failed attempt -> triggers account lockout!
      const res3 = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'sec.admin@college.edu', password: 'WrongPassword3' });
      expect(res3.status).toBe(401);

      const lockoutLog = mockActivityLogs.find((l) => l.action === 'account_locked');
      expect(lockoutLog).toBeDefined();

      // 4th attempt with CORRECT password must now be rejected with 423 Locked!
      const res4 = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'sec.admin@college.edu', password: 'AdminPassword123!' });

      expect(res4.status).toBe(423);
      expect(res4.body.error).toMatch(/account is temporarily locked/i);
    });

    test('Successful login resets failed_login_count to 0', async () => {
      // 1 failed attempt
      await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'sec.admin@college.edu', password: 'WrongPassword' });

      expect(mockProfiles.get(adminId).failed_login_count).toBe(1);

      // Successful login
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'sec.admin@college.edu', password: 'AdminPassword123!' });

      expect(res.status).toBe(200);
      expect(mockProfiles.get(adminId).failed_login_count).toBe(0);
    });

    test('Admin can access GET /api/admin/logs/security-alerts, student receives 403', async () => {
      // Student is blocked
      const studentRes = await request(app)
        .get('/api/admin/logs/security-alerts')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentRes.status).toBe(403);

      // Admin accesses successfully
      const adminRes = await request(app)
        .get('/api/admin/logs/security-alerts')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.alerts).toBeDefined();
      expect(Array.isArray(adminRes.body.alerts)).toBe(true);
    });
  });

  describe('2. Rate Limiting Defense', () => {
    test('Rate limiting returns 429 after exceeding limit when tested', async () => {
      // Simulate rate limiter activation by sending rate limit header
      const requests = [];
      for (let i = 0; i < 7; i++) {
        requests.push(
          request(app)
            .post('/api/auth/admin/login')
            .set('X-Test-Rate-Limit', 'true')
            .send({ email: 'ratelimit.target@college.edu', password: 'Pass' })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.find((r) => r.status === 429);
      expect(rateLimited).toBeDefined();
      expect(rateLimited.body.error).toMatch(/too many requests/i);
    });
  });

  describe('3. CORS and Security Headers', () => {
    test('Helmet headers (X-DNS-Prefetch-Control, X-Content-Type-Options, etc.) are present', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test('CORS rejects unauthorized origin with error', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.attacker.com');

      // Unauthorized CORS origin error handled
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/CORS origin 'http:\/\/malicious-site.attacker.com' is not allowed/i);
    });

    test('CORS allows authorized origin in allowlist', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://myclub.rajalakshmi.edu.in');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://myclub.rajalakshmi.edu.in');
    });
  });
});
