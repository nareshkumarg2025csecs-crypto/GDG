const { validateFormAnswers } = require('../src/controllers/formController');
const GoogleDriveService = require('../src/services/googleDriveService');

describe('Form File Upload & Google Drive Integration Tests', () => {
  describe('1. validateFormAnswers with File Type Fields', () => {
    const fileSchema = {
      fields: [
        {
          id: 'f_resume',
          name: 'resume',
          label: 'Resume Document',
          type: 'file',
          required: true,
          max_file_size_mb: 10,
          allowed_file_types: '.pdf,.docx',
        },
        {
          id: 'f_id_card',
          name: 'id_card',
          label: 'ID Card Photo',
          type: 'file',
          required: false,
          max_file_size_mb: 5,
          allowed_file_types: '.png,.jpg',
        },
      ],
    };

    test('Validates successfully when required file link is provided', () => {
      const answers = {
        resume: 'https://drive.google.com/file/d/1abcXYZ987/view?usp=drivesdk',
      };
      const result = validateFormAnswers(fileSchema, answers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Validates successfully when file object with webViewLink is provided', () => {
      const answers = {
        resume: {
          id: '1abcXYZ987',
          name: 'student_resume.pdf',
          webViewLink: 'https://drive.google.com/file/d/1abcXYZ987/view?usp=drivesdk',
        },
      };
      const result = validateFormAnswers(fileSchema, answers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('Fails validation when required file field is omitted', () => {
      const answers = {
        id_card: 'https://drive.google.com/file/d/photo123/view',
      };
      const result = validateFormAnswers(fileSchema, answers);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'Resume Document' is required.");
    });

    test('Fails validation when file field is an empty string', () => {
      const answers = {
        resume: '   ',
      };
      const result = validateFormAnswers(fileSchema, answers);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Field 'Resume Document' is required.");
    });

    test('Optional file field passes when omitted', () => {
      const answers = {
        resume: 'https://drive.google.com/file/d/1abcXYZ987/view',
      };
      const result = validateFormAnswers(fileSchema, answers);
      expect(result.isValid).toBe(true);
    });
  });

  describe('2. GoogleDriveService Method Signatures and Utilities', () => {
    test('GoogleDriveService exposes getDriveAccessToken, getOrCreateEventFolder, and uploadFileToEventFolder', () => {
      expect(typeof GoogleDriveService.getDriveAccessToken).toBe('function');
      expect(typeof GoogleDriveService.getOrCreateEventFolder).toBe('function');
      expect(typeof GoogleDriveService.uploadFileToEventFolder).toBe('function');
    });

    test('uploadFileToEventFolder throws an error if buffer is missing or invalid', async () => {
      await expect(
        GoogleDriveService.uploadFileToEventFolder({
          accessToken: 'mock-token',
          folderId: 'mock-folder-id',
          fileName: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: null,
          attendeeName: 'Test Student',
        })
      ).rejects.toThrow('Valid file buffer is required');
    });

    test('GoogleDriveService exposes getAuthUrl, exchangeCodeForTokens, and checkStorageStatus', () => {
      expect(typeof GoogleDriveService.getAuthUrl).toBe('function');
      expect(typeof GoogleDriveService.exchangeCodeForTokens).toBe('function');
      expect(typeof GoogleDriveService.checkStorageStatus).toBe('function');
      expect(typeof GoogleDriveService.saveRefreshToken).toBe('function');
    });

    test('getAuthUrl generates a valid Google OAuth URL containing drive scopes', () => {
      const authUrl = GoogleDriveService.getAuthUrl('http://localhost:5000/api/auth/google/drive-callback');
      expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
      expect(decodeURIComponent(authUrl)).toContain('https://www.googleapis.com/auth/drive');
    });

    test('checkStorageStatus handles unconfigured state gracefully', async () => {
      // With no tokens, it should safely return not_configured status
      const status = await GoogleDriveService.checkStorageStatus();
      expect(status).toHaveProperty('status');
      expect(typeof status.status).toBe('string');
      expect(status).toHaveProperty('storageLimitBytes');
      expect(status).toHaveProperty('folderId');
    });

    test('extractFolderId extracts folder ID from diverse Google Drive URL patterns', () => {
      const standardUrl = 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456';
      expect(GoogleDriveService.extractFolderId(standardUrl)).toBe('1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456');

      const userIndexUrl = 'https://drive.google.com/drive/u/1/folders/0B_mockFolderId_9999XYZ?usp=sharing';
      expect(GoogleDriveService.extractFolderId(userIndexUrl)).toBe('0B_mockFolderId_9999XYZ');

      const queryUrl = 'https://drive.google.com/open?id=folder_id_query_abc_123';
      expect(GoogleDriveService.extractFolderId(queryUrl)).toBe('folder_id_query_abc_123');

      const rawId = '1_FolderID-abcXYZ1234567890';
      expect(GoogleDriveService.extractFolderId(rawId)).toBe('1_FolderID-abcXYZ1234567890');

      expect(GoogleDriveService.extractFolderId(null)).toBeNull();
      expect(GoogleDriveService.extractFolderId('')).toBeNull();
      expect(GoogleDriveService.extractFolderId('too-short')).toBeNull();
    });
  });

  describe('3. Student Google OAuth Scopes Verification', () => {
    const { getGoogleOAuthUrl } = require('../src/controllers/authController');
    const { getGoogleLinkUrl } = require('../src/controllers/calendarController');

    test('Student OAuth URL does NOT request drive.file, spreadsheets, or full calendar delete permissions', async () => {
      const req = { query: { role: 'student' }, headers: {} };
      let responseData = null;
      let statusCode = 200;
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
      };

      await getGoogleOAuthUrl(req, res);

      expect(statusCode).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.role_requested).toBe('student');

      // Crucial: Student scopes MUST NOT include spreadsheets, drive.file, or full calendar deletion
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/spreadsheets');
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/drive.file');
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/calendar');
      expect(responseData.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
    });

    test('Calendar link URL requests only calendar.events and not invasive drive or spreadsheets scopes', async () => {
      const req = { user: { id: 'mock-student-id' } };
      let responseData = null;
      let statusCode = 200;
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
      };

      await getGoogleLinkUrl(req, res);

      expect(statusCode).toBe(200);
      expect(responseData).toBeDefined();
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/spreadsheets');
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/drive.file');
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/calendar');
      expect(responseData.scopes).not.toContain('https://www.googleapis.com/auth/calendar');
      expect(responseData.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
    });

    test('Admin OAuth URL requests all scopes (spreadsheets, calendar, drive)', async () => {
      const req = {
        query: {
          role: 'admin',
          admin_code: process.env.ADMIN_SIGNUP_CODE || 'GDG_CLUB_ADMIN_SECRET_2026',
        },
        headers: {},
      };
      let responseData = null;
      let statusCode = 200;
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseData = data;
          return res;
        },
      };

      await getGoogleOAuthUrl(req, res);

      expect(statusCode).toBe(200);
      expect(responseData.role_requested).toBe('admin');
      expect(responseData.scopes).toContain('https://www.googleapis.com/auth/spreadsheets');
      expect(responseData.scopes).toContain('https://www.googleapis.com/auth/calendar.events');
      expect(responseData.scopes).toContain('https://www.googleapis.com/auth/drive');
    });

    test('disconnectStorageAccount resets in-memory cache and environment', async () => {
      expect(typeof GoogleDriveService.disconnectStorageAccount).toBe('function');
      const result = await GoogleDriveService.disconnectStorageAccount();
      expect(result).toEqual({ success: true });
      expect(process.env.GDRIVE_REFRESH_TOKEN).toBeUndefined();
    });

    test('Designated folder configuration retains top priority', async () => {
      const folderConfig = await GoogleDriveService.getConfiguredRootFolder();
      expect(folderConfig).toHaveProperty('folderId');
      expect(folderConfig).toHaveProperty('folderName');
      expect(folderConfig).toHaveProperty('folderUrl');
    });
  });
});
