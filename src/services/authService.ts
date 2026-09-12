import { apiRequest } from '@/lib/api';

export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  details?: Record<string, any>;
  locked_until?: string | null;
  failed_login_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  message: string;
  access_token: string | null;
  refresh_token: string | null;
  user?: {
    id: string;
    email: string;
  };
  profile: UserProfile;
}

export interface StudentSignupData {
  email: string;
  password: string;
  full_name: string;
  details?: Record<string, any>;
}

export interface AdminSignupData {
  email: string;
  password: string;
  full_name: string;
  admin_code: string;
  details?: Record<string, any>;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleUrlResponse {
  message: string;
  url: string;
  provider: string;
  role_requested: string;
  scopes: string[];
}

export interface GoogleSyncResponse {
  message: string;
  profile: UserProfile;
  google_tokens_saved: boolean;
}

export const authService = {
  async studentSignup(data: StudentSignupData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/student/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminSignup(data: AdminSignupData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/admin/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async studentLogin(data: LoginData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/student/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async adminLogin(data: LoginData): Promise<AuthResponse> {
    return apiRequest<AuthResponse>('/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(token?: string | null): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      token,
    });
  },

  async getGoogleOAuthUrl(role: UserRole = 'student', adminCode?: string): Promise<GoogleUrlResponse> {
    const params = new URLSearchParams({ role });
    if (role === 'admin' && adminCode) {
      params.append('admin_code', adminCode);
    }
    return apiRequest<GoogleUrlResponse>(`/api/auth/google/url?${params.toString()}`, {
      method: 'GET',
    });
  },

  async validateAdminCode(adminCode: string): Promise<{ valid: boolean; message?: string }> {
    return apiRequest<{ valid: boolean; message?: string }>('/api/auth/admin/validate-code', {
      method: 'POST',
      body: JSON.stringify({ admin_code: adminCode }),
    });
  },

  async syncGoogleProfile(
    payload: {
      provider_token?: string;
      provider_refresh_token?: string;
      role?: UserRole;
      admin_code?: string;
    },
    token: string
  ): Promise<GoogleSyncResponse> {
    return apiRequest<GoogleSyncResponse>('/api/auth/google/sync-profile', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    });
  },

  async getGmailStatus(token?: string | null): Promise<GmailStatusResponse> {
    return apiRequest<GmailStatusResponse>('/api/auth/google/gmail-status', {
      method: 'GET',
      token,
    });
  },

  async getGmailAuthUrl(): Promise<GmailAuthUrlResponse> {
    return apiRequest<GmailAuthUrlResponse>('/api/auth/google/gmail-auth-url', {
      method: 'GET',
    });
  },

  async drainGmailQueue(token?: string | null): Promise<{ message: string; result: any }> {
    return apiRequest<{ message: string; result: any }>('/api/auth/google/gmail-drain-queue', {
      method: 'POST',
      token,
    });
  },

  async getDriveStatus(token?: string | null): Promise<DriveStatusResponse> {
    return apiRequest<DriveStatusResponse>('/api/auth/google/drive-status', {
      method: 'GET',
      token,
    });
  },

  async getDriveAuthUrl(): Promise<DriveAuthUrlResponse> {
    return apiRequest<DriveAuthUrlResponse>('/api/auth/google/drive-auth-url', {
      method: 'GET',
    });
  },

  async setDriveFolder(
    folderInput: string,
    token?: string | null
  ): Promise<{ message: string; folderId: string; folderName: string; folderUrl: string }> {
    return apiRequest<{ message: string; folderId: string; folderName: string; folderUrl: string }>(
      '/api/auth/google/drive-folder',
      {
        method: 'POST',
        token,
        body: JSON.stringify({ folder_input: folderInput }),
      }
    );
  },

  async clearDriveFolder(token?: string | null): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/auth/google/drive-folder', {
      method: 'DELETE',
      token,
    });
  },

  async disconnectDrive(token?: string | null): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/auth/google/drive-disconnect', {
      method: 'POST',
      token,
    });
  },
};

export interface GmailStatusResponse {
  message: string;
  status: 'alive' | 'expired' | 'rate_limited' | 'not_configured' | 'error';
  email?: string;
  expiresIn?: number;
  sessionMinsLeft?: number;
  testModeDaysLeft?: number | null;
  authorizedAt?: string | null;
  isRealCheck?: boolean;
  expirationTiming?: string;
  scope?: string;
  hasGmailSend?: boolean;
  queue: {
    pending: number;
    sent: number;
    failed: number;
    total: number;
    lastQueuedAt?: string | null;
  };
}


export interface GmailAuthUrlResponse {
  message: string;
  auth_url: string;
  scope: string;
  redirect_uri: string;
}

export interface DriveStatusResponse {
  message: string;
  status: 'healthy' | 'warning' | 'quota_exceeded' | 'not_configured' | 'error';
  isConfigured: boolean;
  isDedicatedAccount?: boolean;
  isInstitutional?: boolean;
  email?: string | null;
  displayName?: string | null;
  storageLimitBytes?: number | null;
  storageUsedBytes: number;
  usageInDriveBytes?: number;
  usageInTrashBytes?: number;
  domainPooledLimitBytes?: number | null;
  domainPooledUsedBytes?: number | null;
  usagePercentage: number;
  folderId?: string | null;
  folderName?: string | null;
  folderUrl?: string | null;
}

export interface DriveAuthUrlResponse {
  message: string;
  auth_url: string;
  redirect_uri: string;
}
