import { useAuthStore } from '@/store/authStore';

export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  // In browser environments:
  if (typeof window !== 'undefined') {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    // Local development: use relative path proxied by Vite to port 5000
    if (isLocalhost) {
      return '';
    }
    // Hosted production (e.g. Vercel): target live Render backend
    return 'https://gdg-backend-54mp.onrender.com';
  }
  return 'http://localhost:5000';
};

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  token?: string | null;
  retries?: number;
  _isRefreshRetry?: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers = {}, body, ...rest } = options;
  const method = (rest.method || 'GET').toUpperCase();
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
  // Default to 1 retry only for idempotent safe methods (GET, HEAD, OPTIONS)
  const retries = options.retries !== undefined ? options.retries : (isSafeMethod ? 1 : 0);

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (body && typeof body === 'string') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Attach token if provided explicitly, otherwise retrieve from auth store
  const authToken = token !== undefined ? token : getStoredToken();
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body,
    });
  } catch (err: any) {
    // If safe fetch failed due to transient network drop, retry safely
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 600));
      return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
    }
    throw new ApiError(0, err.message || 'Network error: Unable to connect to backend server.');
  }

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    // If backend was rebooting and returned 502/503/504 or proxy ECONNREFUSED 500, retry once for safe operations
    const isProxyOrGatewayError =
      (response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        (response.status === 500 && (!data || !data.error || data.message === 'Internal Server Error'))) &&
      retries > 0;

    if (isProxyOrGatewayError) {
      await new Promise((r) => setTimeout(r, 800));
      return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
    }

    // Do NOT attempt refresh on endpoints where 401 is an expected auth rejection or refresh itself
    const isAuthEndpoint =
      cleanEndpoint.includes('/api/auth/student/login') ||
      cleanEndpoint.includes('/api/auth/admin/login') ||
      cleanEndpoint.includes('/api/auth/student/signup') ||
      cleanEndpoint.includes('/api/auth/admin/signup') ||
      cleanEndpoint.includes('/api/auth/refresh') ||
      cleanEndpoint.includes('/api/auth/logout') ||
      cleanEndpoint.includes('/api/auth/student/forgot-password') ||
      cleanEndpoint.includes('/api/auth/student/resend-verification') ||
      cleanEndpoint.includes('/api/auth/admin/validate-code');

    // On 401 Unauthorized for protected endpoints, attempt deduplicated silent token refresh
    if (response.status === 401 && !isAuthEndpoint && !options._isRefreshRetry) {
      const stored = getStoredAuthData();
      if (stored.refreshToken) {
        const refreshResult = await attemptSilentTokenRefresh();
        if (refreshResult.status === 'success' && refreshResult.accessToken) {
          // Retry the original request seamlessly with the newly refreshed access token
          return apiRequest<T>(endpoint, {
            ...options,
            token: refreshResult.accessToken,
            retries: 0,
            _isRefreshRetry: true,
          });
        }

        // Only clear session if the refresh endpoint explicitly rejected the token as invalid or revoked
        if (refreshResult.status === 'auth_rejected') {
          try {
            useAuthStore.getState().clearAuthSession();
          } catch (_) {}
        }
        // NOTE: On 'network_error', do NOT wipe the session — user remains logged in so subsequent attempts can succeed
      } else {
        // No refresh token available, session cannot be refreshed
        try {
          useAuthStore.getState().clearAuthSession();
        } catch (_) {}
      }
    }

    const errorMessage =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.details) ? data.details.join(', ') : null) ||
      `Request failed with status ${response.status} (${response.statusText})`;

    throw new ApiError(response.status, errorMessage, data?.details);
  }

  return data as T;
}

export interface RefreshResult {
  status: 'success' | 'auth_rejected' | 'network_error';
  accessToken: string | null;
}

// Concurrency-safe deduplicated refresh promise
let activeRefreshPromise: Promise<RefreshResult> | null = null;

export async function attemptSilentTokenRefresh(): Promise<RefreshResult> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const { refreshToken } = getStoredAuthData();
      if (!refreshToken) {
        return { status: 'auth_rejected', accessToken: null };
      }

      const baseUrl = getApiBaseUrl();
      const refreshUrl = baseUrl ? `${baseUrl}/api/auth/refresh` : '/api/auth/refresh';

      let res: Response;
      try {
        res = await fetch(refreshUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Network failure (offline, timeout, DNS failure) -> Transient error, do NOT wipe session
        return { status: 'network_error', accessToken: null };
      }

      // Explicit authentication rejection: refresh token expired, revoked, or invalid
      if (res.status === 400 || res.status === 401) {
        return { status: 'auth_rejected', accessToken: null };
      }

      // Server proxy/gateway failure (500, 502, 503, 504) -> Transient error, do NOT wipe session
      if (!res.ok) {
        return { status: 'network_error', accessToken: null };
      }

      const data = await res.json();
      if (data?.access_token) {
        // Update both in-memory Zustand store and persisted storage atomically with new rotated tokens
        useAuthStore.getState().updateTokens(data.access_token, data.refresh_token);
        return { status: 'success', accessToken: data.access_token as string };
      }

      return { status: 'auth_rejected', accessToken: null };
    } catch {
      return { status: 'network_error', accessToken: null };
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export function getStoredAuthData(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const state = useAuthStore.getState();
    if (state.accessToken || state.refreshToken) {
      return {
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      };
    }
    // Fallback to local storage if store is still rehydrating
    const storedAuth = localStorage.getItem('gdg_auth_storage');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      return {
        accessToken: parsed?.state?.accessToken || null,
        refreshToken: parsed?.state?.refreshToken || null,
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return { accessToken: null, refreshToken: null };
}

export function getStoredToken(): string | null {
  return getStoredAuthData().accessToken;
}
