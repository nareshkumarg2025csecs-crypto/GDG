const request = require('supertest');

// In-memory mock store for testing
const mockUsers = new Map();
const mockProfiles = new Map();
const mockBucketFiles = new Map();

// Mock GmailApiService
const mockSendMail = jest.fn().mockResolvedValue({ success: true, messageId: 'mock-gmail-msg-id-123' });
jest.mock('../src/services/gmailApiService', () => ({
  sendMail: mockSendMail,
}));

// Mock Supabase
jest.mock('../src/config/supabase', () => {
  const mockSupabase = {
    auth: {
      signUp: jest.fn(async ({ email, password, options }) => {
        const id = `user-${Date.now()}`;
        const user = {
          id,
          email,
          email_confirmed_at: null,
          user_metadata: options?.data || {},
        };
        mockUsers.set(id, { ...user, password });
        return {
          data: { user, session: null },
          error: null,
        };
      }),
      signInWithPassword: jest.fn(async ({ email, password }) => {
        for (const [id, user] of mockUsers.entries()) {
          if (user.email === email && user.password === password) {
            return {
              data: {
                user: { id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at },
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
        generateLink: jest.fn(async ({ type, email, password, options }) => {
          const id = `student-user-${Date.now()}`;
          const user = {
            id,
            email,
            email_confirmed_at: null, // Unverified
            user_metadata: options?.data || {},
          };
          mockUsers.set(id, { ...user, password });
          const action_link = `https://mock.supabase.co/auth/v1/verify?token=mock_token_123&type=${type}&redirect_to=${encodeURIComponent(options?.redirectTo || '')}`;
          return {
            data: {
              user,
              properties: { action_link },
            },
            error: null,
          };
        }),
        deleteUser: jest.fn(async (id) => {
          mockUsers.delete(id);
          mockProfiles.delete(id);
          return { data: {}, error: null };
        }),
      },
    },
    storage: {
      listBuckets: jest.fn(async () => ({
        data: [{ id: 'club-assets', name: 'club-assets', public: true }],
        error: null,
      })),
      createBucket: jest.fn(async () => ({ data: {}, error: null })),
      from: jest.fn((bucket) => ({
        upload: jest.fn(async (filePath, fileBuffer, opts) => {
          mockBucketFiles.set(`${bucket}/${filePath}`, { buffer: fileBuffer, contentType: opts?.contentType });
          return { data: { path: filePath }, error: null };
        }),
        getPublicUrl: jest.fn((filePath) => ({
          data: {
            publicUrl: `https://mock.supabase.co/storage/v1/object/public/${bucket}/${filePath}`,
          },
        })),
      })),
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
    supabase: mockSupabase,
    supabaseAdmin: mockSupabaseAdmin,
  };
});

const app = require('../src/app');

describe('Student Verification & Storage Bucket Features', () => {
  beforeEach(() => {
    mockUsers.clear();
    mockProfiles.clear();
    mockBucketFiles.clear();
    mockSendMail.mockClear();
  });

  describe('Student Signup with Gmail API Email Verification', () => {
    test('POST /api/auth/student/signup sends verification email via Gmail API and returns requires_verification: true', async () => {
      const res = await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'student.verify@example.com',
          password: 'Password123!',
          full_name: 'Jane Doe',
        });

      expect(res.status).toBe(201);
      expect(res.body.requires_verification).toBe(true);
      expect(res.body.email).toBe('student.verify@example.com');
      expect(res.body.access_token).toBeNull();

      // Ensure Gmail API was called with student's email and branded HTML
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const mailCall = mockSendMail.mock.calls[0][0];
      expect(mailCall.to).toBe('student.verify@example.com');
      expect(mailCall.subject).toMatch(/Verify your email/i);
      expect(mailCall.html).toContain('Jane Doe');
      expect(mailCall.html).toContain('Verify Email &amp; Continue to Onboarding');
      expect(mailCall.html).toContain('auth/v1/verify');
    });

    test('POST /api/auth/student/login blocks unverified student with 403 EMAIL_NOT_VERIFIED', async () => {
      // 1. Sign up student (creates unverified account)
      await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'unverified.student@example.com',
          password: 'Password123!',
          full_name: 'Unverified Student',
        });

      // 2. Attempt login before verifying
      const loginRes = await request(app)
        .post('/api/auth/student/login')
        .send({
          email: 'unverified.student@example.com',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.code).toBe('EMAIL_NOT_VERIFIED');
      expect(loginRes.body.error).toMatch(/verify your email/i);
    });

    test('POST /api/auth/student/resend-verification resends email via Gmail API', async () => {
      // Sign up student
      await request(app)
        .post('/api/auth/student/signup')
        .send({
          email: 'resend.student@example.com',
          password: 'Password123!',
          full_name: 'Resend Student',
        });

      mockSendMail.mockClear();

      // Resend verification
      const resendRes = await request(app)
        .post('/api/auth/student/resend-verification')
        .send({
          email: 'resend.student@example.com',
        });

      expect(resendRes.status).toBe(200);
      expect(resendRes.body.message).toMatch(/verification link/i);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendMail.mock.calls[0][0].to).toBe('resend.student@example.com');
    });
  });

  describe('Poster Storage Service Unit Check', () => {
    const posterStorageService = require('../src/services/posterStorageService');

    test('uploadPosterBuffer uploads binary buffer to club-assets/event-posters/ and returns public URL', async () => {
      const buffer = Buffer.from('fake-image-bytes');
      const result = await posterStorageService.uploadPosterBuffer({
        buffer,
        mimeType: 'image/png',
        eventId: 'test-event-123',
      });

      expect(result.publicUrl).toBeDefined();
      expect(result.publicUrl).toContain('https://mock.supabase.co/storage/v1/object/public/club-assets/event-posters/');
      expect(result.publicUrl).toContain('test-event-123');
    });

    test('uploadBase64Poster converts data URI to storage bucket URL', async () => {
      const base64DataUri = 'data:image/jpeg;base64,' + Buffer.from('jpeg-bytes').toString('base64');
      const url = await posterStorageService.uploadBase64Poster(base64DataUri, 'test-event-base64');

      expect(url).toBeDefined();
      expect(url).toContain('https://mock.supabase.co/storage/v1/object/public/club-assets/event-posters/');
      expect(url).toContain('test-event-base64');
    });

    test('uploadBase64Poster returns original string if it is already an HTTP URL', async () => {
      const existingUrl = 'https://mock.supabase.co/storage/v1/object/public/club-assets/event-posters/existing.png';
      const result = await posterStorageService.uploadBase64Poster(existingUrl);
      expect(result).toBe(existingUrl);
    });

    test('sanitizeEventDetails replaces Base64 strings with public bucket URLs', async () => {
      const base64DataUri = 'data:image/png;base64,' + Buffer.from('png-bytes').toString('base64');
      const sanitized = await posterStorageService.sanitizeEventDetails({
        banner_url: base64DataUri,
        coverImage: base64DataUri,
        description: 'Test Event',
      }, 'event-sanitized-id');

      expect(sanitized.banner_url).not.toContain('data:image/png;base64');
      expect(sanitized.banner_url).toContain('https://mock.supabase.co/storage/v1/object/public/club-assets/event-posters/');
      expect(sanitized.coverImage).toContain('https://mock.supabase.co/storage/v1/object/public/club-assets/event-posters/');
      expect(sanitized.description).toBe('Test Event');
    });
  });
});
