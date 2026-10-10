const request = require('supertest');

process.env.ADMIN_SIGNUP_CODE = 'test-lifecycle-admin-code';
process.env.CLIENT_URL = 'http://localhost:8081';

const mockUsers = new Map();
const mockProfiles = new Map();
const mockRevokedTokens = new Set();

const resetData = () => {
  mockUsers.clear();
  mockProfiles.clear();
  mockRevokedTokens.clear();
};

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
      signInWithOAuth: jest.fn(async ({ provider, options }) => {
        return {
          data: {
            url: `https://mock.supabase.co/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(options?.redirectTo || '')}`,
          },
          error: null,
        };
      }),
    },
  };

  const mockSupabaseAdmin = {
    auth: {
      getUser: jest.fn(async (token) => {
        if (!token || !token.startsWith('mock-jwt-token-for-') || mockRevokedTokens.has(token)) {
          return { data: { user: null }, error: { message: 'Invalid or revoked token' } };
        }
        if (token.includes('-expired')) {
          return { data: { user: null }, error: { message: 'JWT expired' } };
        }
        const userId = token.replace('mock-jwt-token-for-', '').replace('-refreshed', '');
        const user = mockUsers.get(userId);
        if (!user) return { data: { user: null }, error: { message: 'User not found' } };
        return { data: { user: { id: user.id, email: user.email } }, error: null };
      }),
      admin: {
        signOut: jest.fn(async (token) => {
          if (token) mockRevokedTokens.add(token);
          return { data: {}, error: null };
        }),
      },
    },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return {
          insert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const profile = { id: row.id, email: row.email, full_name: row.full_name, role: row.role };
            mockProfiles.set(row.id, profile);
            return { select: () => ({ single: async () => ({ data: profile, error: null }) }) };
          }),
          upsert: jest.fn((rows) => {
            const row = Array.isArray(rows) ? rows[0] : rows;
            const existing = mockProfiles.get(row.id) || {};
            const profile = { ...existing, ...row };
            mockProfiles.set(row.id, profile);
            return { select: () => ({ single: async () => ({ data: profile, error: null }) }) };
          }),
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
          select: jest.fn((fields) => ({
            eq: jest.fn((col, val) => ({
              single: async () => {
                const profile = mockProfiles.get(val);
                return profile ? { data: profile, error: null } : { data: null, error: { message: 'Profile not found' } };
              },
              maybeSingle: async () => {
                const profile = mockProfiles.get(val);
                return { data: profile || null, error: null };
              },
            })),
          })),
        };
      }
      if (table === 'activity_logs') {
        return {
          insert: jest.fn(() => ({
            select: () => ({ single: async () => ({ data: { id: 'log-1' }, error: null }) }),
          })),
        };
      }
      return {};
    }),
  };

  const createIsolatedAuthClient = jest.fn(() => ({
    auth: {
      refreshSession: jest.fn(async ({ refresh_token }) => {
        if (!refresh_token || !refresh_token.startsWith('mock-refresh-token-for-')) {
          return { data: { session: null, user: null }, error: { message: 'Invalid refresh token' } };
        }
        const userId = refresh_token.replace('mock-refresh-token-for-', '');
        const user = mockUsers.get(userId);
        if (!user) {
          return { data: { session: null, user: null }, error: { message: 'User not found' } };
        }
        const rotatedToken = `mock-refresh-token-for-${userId}-rotated-${Date.now()}`;
        return {
          data: {
            user: { id: user.id, email: user.email },
            session: {
              access_token: `mock-jwt-token-for-${userId}-refreshed`,
              refresh_token: rotatedToken,
            },
          },
          error: null,
        };
      }),
    },
  }));

  return {
    supabase: mockSupabase,
    supabaseAdmin: mockSupabaseAdmin,
    createIsolatedAuthClient,
  };
});

const app = require('../src/app');

describe('Full Authentication Lifecycle & Session Invalidation Test Suite', () => {
  let studentToken;
  let studentRefreshToken;
  let studentUserId;

  beforeEach(async () => {
    resetData();
    jest.clearAllMocks();

    const signupRes = await request(app)
      .post('/api/auth/student/signup')
      .send({
        email: 'lifecycle.student@college.edu',
        password: 'Password123!',
        full_name: 'Lifecycle Student',
      });

    studentToken = signupRes.body.access_token;
    studentRefreshToken = signupRes.body.refresh_token;
    studentUserId = signupRes.body.profile.id;
  });

  describe('1. Session Token Refresh & Rotation (Phase 4)', () => {
    test('POST /api/auth/refresh returns 200 with new access_token and rotated refresh_token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: studentRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
      expect(res.body.access_token).toContain('-refreshed');
      expect(res.body.refresh_token).toContain('-rotated-');
      expect(res.body.user.id).toBe(studentUserId);
      expect(res.body.profile.role).toBe('student');
    });

    test('POST /api/auth/refresh-token alias route behaves identically', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refresh_token: studentRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
    });

    test('POST /api/auth/refresh rejects missing or empty refresh_token with 400', async () => {
      const res1 = await request(app).post('/api/auth/refresh').send({});
      expect(res1.status).toBe(400);

      const res2 = await request(app).post('/api/auth/refresh').send({ refresh_token: '   ' });
      expect(res2.status).toBe(400);
    });

    test('POST /api/auth/refresh rejects invalid or expired refresh_token with 401', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: 'invalid-or-revoked-refresh-token' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Invalid or expired refresh token/i);
    });

    test('Concurrent refresh requests execute with isolated clients without cross-session pollution', async () => {
      // Create a second student
      const user2Res = await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'user2@college.edu',
          password: 'Password123!',
          full_name: 'User Two',
        });
      const user2RefreshToken = user2Res.body.refresh_token;

      // Fire concurrent refreshes simultaneously
      const [res1, res2] = await Promise.all([
        request(app).post('/api/auth/refresh').send({ refresh_token: studentRefreshToken }),
        request(app).post('/api/auth/refresh').send({ refresh_token: user2RefreshToken }),
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.user.id).toBe(studentUserId);
      expect(res2.body.user.id).toBe(user2Res.body.profile.id);
      expect(res1.body.access_token).not.toEqual(res2.body.access_token);
    });
  });

  describe('2. Logout and Session Invalidation (Phase 6)', () => {
    test('POST /api/auth/logout invalidates session and rejects subsequent protected requests', async () => {
      // 1. Verify access works initially
      const initialMe = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(initialMe.status).toBe(200);

      // 2. Perform logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toMatch(/logged out successfully/i);

      // 3. Subsequent request with the logged-out token is rejected with 401
      const revokedMe = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(revokedMe.status).toBe(401);
    });

    test('POST /api/auth/logout succeeds cleanly even if access token is already expired or missing', async () => {
      const resMissing = await request(app).post('/api/auth/logout');
      expect(resMissing.status).toBe(200);

      const resExpired = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer expired-or-invalid-token');
      expect(resExpired.status).toBe(200);
    });
  });

  describe('3. Google OAuth Redirect Allowlist Validation (Phase 5 & 7)', () => {
    test('GET /api/auth/google/url allows registered localhost and client origin redirect destinations', async () => {
      const res = await request(app)
        .get('/api/auth/google/url?redirect_to=http://localhost:8081/auth/callback');

      expect(res.status).toBe(200);
      expect(res.body.url).toBeDefined();
    });

    test('GET /api/auth/google/url REJECTS unauthorized open-redirect destination with 400', async () => {
      const res = await request(app)
        .get('/api/auth/google/url?redirect_to=https://attacker-phishing.com/auth/callback');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Untrusted redirect URL origin/i);
    });

    test('GET /api/auth/google/url for admin role rejects without valid admin_code', async () => {
      const res = await request(app)
        .get('/api/auth/google/url?role=admin');

      expect(res.status).toBe(403);
    });

    test('POST /api/auth/google/sync-profile creates student profile for authenticated Google user', async () => {
      const syncRes = await request(app)
        .post('/api/auth/google/sync-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          role: 'student',
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.profile).toBeDefined();
      expect(syncRes.body.profile.role).toBe('student');
    });

    test('POST /api/auth/google/sync-profile rejects unauthorized admin escalation without valid admin_code', async () => {
      const syncRes = await request(app)
        .post('/api/auth/google/sync-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          role: 'admin',
          admin_code: 'wrong-admin-code',
        });

      expect(syncRes.status).toBe(403);
      expect(syncRes.body.error).toMatch(/Forbidden/i);
    });

    test('POST /api/auth/google/sync-profile allows admin escalation with valid admin_code', async () => {
      const syncRes = await request(app)
        .post('/api/auth/google/sync-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          role: 'admin',
          admin_code: 'test-lifecycle-admin-code',
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.profile.role).toBe('admin');
    });
  });

  describe('4. Access-Token Expiration & Protected Route Enforcement (Phase 3 & 7)', () => {
    test('Protected endpoint rejects expired access token with 401', async () => {
      const expiredToken = `mock-jwt-token-for-${studentUserId}-expired`;
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Unauthorized/i);
    });

    test('Silent refresh cycle restores access: expired token -> refresh -> new token succeeds', async () => {
      // 1. Expired token gets 401
      const expiredToken = `mock-jwt-token-for-${studentUserId}-expired`;
      const failedRes = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(failedRes.status).toBe(401);

      // 2. Client silently calls /api/auth/refresh with refresh token
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refresh_token: studentRefreshToken });
      expect(refreshRes.status).toBe(200);
      const newAccessToken = refreshRes.body.access_token;
      expect(newAccessToken).toBeDefined();

      // 3. Retrying protected request with new token succeeds with 200
      const retryRes = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${newAccessToken}`);
      expect(retryRes.status).toBe(200);
      expect(retryRes.body.user.email).toBe('lifecycle.student@college.edu');
    });
  });
});
