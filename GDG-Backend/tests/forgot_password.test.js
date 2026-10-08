const request = require('supertest');

const mockUsers = new Map();
const mockProfiles = new Map();

// Mock GmailApiService
const mockSendMail = jest.fn().mockResolvedValue({ success: true, messageId: 'mock-reset-msg-123' });
jest.mock('../src/services/gmailApiService', () => ({
  sendMail: mockSendMail,
}));

// Mock Supabase module
jest.mock('../src/config/supabase', () => {
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
        generateLink: jest.fn(async ({ type, email, options }) => {
          const user = Array.from(mockUsers.values()).find((u) => u.email === email);
          const action_link = `https://mock.supabase.co/auth/v1/verify?token=mock_recovery_token&type=${type}&redirect_to=${encodeURIComponent(options?.redirectTo || '')}`;
          return {
            data: {
              user: user || { id: 'mock-recovery-user', email },
              properties: { action_link },
            },
            error: null,
          };
        }),
        updateUserById: jest.fn(async (id, { password }) => {
          const user = mockUsers.get(id);
          if (user) {
            user.password = password;
            mockUsers.set(id, user);
          }
          return { data: { user }, error: null };
        }),
      },
    },
    from: jest.fn((table) => {
      if (table === 'profiles') {
        return {
          select: jest.fn((fields) => ({
            eq: jest.fn((col, val) => ({
              single: async () => {
                if (col === 'id') {
                  const p = mockProfiles.get(val);
                  return p ? { data: p, error: null } : { data: null, error: { message: 'Not found' } };
                }
                for (const p of mockProfiles.values()) {
                  if (p[col] === val) return { data: p, error: null };
                }
                return { data: null, error: { message: 'Not found' } };
              },
              maybeSingle: async () => {
                if (col === 'id') {
                  const p = mockProfiles.get(val);
                  return { data: p || null, error: null };
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
              const existing = mockProfiles.get(val) || {};
              const updated = { ...existing, ...updates };
              mockProfiles.set(val, updated);
              return {
                select: () => ({ single: async () => ({ data: updated, error: null }) }),
                then: (res) => res({ data: updated, error: null }),
              };
            }),
          })),
        };
      }
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: async () => ({ data: null, error: null }),
          })),
        })),
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: async () => ({ data: null, error: null }),
          })),
        })),
      };
    }),
  };

  return {
    supabase: { auth: {} },
    supabaseAdmin: mockSupabaseAdmin,
  };
});

const app = require('../src/app');

describe('Student Forgot & Reset Password Flow', () => {
  const studentId = 'student-test-reset-1';
  const studentEmail = 'student.forgot@college.edu';
  const studentToken = `mock-jwt-token-for-${studentId}`;

  beforeEach(() => {
    mockUsers.clear();
    mockProfiles.clear();
    mockSendMail.mockClear();

    // Setup student account
    mockUsers.set(studentId, {
      id: studentId,
      email: studentEmail,
      password: 'OldPassword123!',
    });
    mockProfiles.set(studentId, {
      id: studentId,
      email: studentEmail,
      full_name: 'Alex Reset',
      role: 'student',
      failed_login_count: 3,
      locked_until: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
  });

  test('POST /api/auth/student/forgot-password sends recovery link via Gmail API', async () => {
    const res = await request(app)
      .post('/api/auth/student/forgot-password')
      .send({ email: studentEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/password reset link/i);

    // Verify Gmail API was dispatched with branded HTML template
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const mailArgs = mockSendMail.mock.calls[0][0];
    expect(mailArgs.to).toBe(studentEmail);
    expect(mailArgs.subject).toMatch(/Reset your password/i);
    expect(mailArgs.html).toContain('Alex Reset');
    expect(mailArgs.html).toContain('Reset Password →');
    expect(mailArgs.html).toContain('type=recovery');
  });

  test('POST /api/auth/student/forgot-password handles non-existent student email safely', async () => {
    const res = await request(app)
      .post('/api/auth/student/forgot-password')
      .send({ email: 'nobody@college.edu' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  test('POST /api/auth/reset-password fails without authentication token (401)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ password: 'BrandNewPassword123!' });

    expect(res.status).toBe(401);
  });

  test('POST /api/auth/reset-password rejects password without symbols/special characters (400)', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ password: 'NoSymbolPassword123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Validation error.*symbol/i);
  });

  test('POST /api/auth/reset-password successfully updates password and unlocks account', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ password: 'BrandNewPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Password updated successfully/i);

    // Verify password updated in mock auth
    const updatedUser = mockUsers.get(studentId);
    expect(updatedUser.password).toBe('BrandNewPassword123!');

    // Verify profile lockout was cleared
    const updatedProfile = mockProfiles.get(studentId);
    expect(updatedProfile.failed_login_count).toBe(0);
    expect(updatedProfile.locked_until).toBeNull();
  });
});
