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
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers = {}, body, ...rest } = options;
  const method = (rest.method || 'GET').toUpperCase();
  const isSafeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(method);
  const retries = options.retries !== undefined ? options.retries : (isSafeMethod ? 1 : 0);

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = baseUrl ? `${baseUrl}${cleanEndpoint}` : cleanEndpoint;

  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };

  if (body && typeof body === 'string') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Attach token if provided, otherwise retrieve from localStorage if exists
  const authToken = token !== undefined ? token : getStoredToken();
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }

  const executeFetch = async (): Promise<Response> => {
    try {
      return await fetch(url, {
        ...rest,
        headers: requestHeaders,
        body,
      });
    } catch (err: any) {
      // If direct host URL failed, try relative endpoint fallback
      if (url.startsWith('http') && typeof window !== 'undefined') {
        return await fetch(cleanEndpoint, {
          ...rest,
          headers: requestHeaders,
          body,
        });
      }
      throw err;
    }
  };

  let response: Response;
  try {
    response = await executeFetch();
  } catch (err: any) {
    // If initial fetch failed and we have retries left (e.g. backend nodemon rebooting), retry after brief delay
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 600));
      return apiRequest<T>(endpoint, { ...options, retries: retries - 1 });
    }
    throw new ApiError(0, err.message || 'Network error: Unable to connect to the server.');
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
    // If backend was rebooting and returned 502/503/504 or Vite proxy ECONNREFUSED 500, retry once
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

    // If token is expired or unauthorized, attempt silent session refresh before logging out
    const isAuthEndpoint =
      cleanEndpoint.includes('/api/auth/student/login') ||
      cleanEndpoint.includes('/api/auth/admin/login') ||
      cleanEndpoint.includes('/api/auth/refresh');

    if (response.status === 401 && !isAuthEndpoint) {
      const refreshedToken = await attemptSilentTokenRefresh();
      if (refreshedToken) {
        // Retry the original request seamlessly with the newly refreshed access token
        return apiRequest<T>(endpoint, {
          ...options,
          token: refreshedToken,
          retries: 0,
        });
      }

      // If refresh failed completely, safely clear stored session
      try {
        localStorage.removeItem('gdg_auth_storage');
      } catch (_) {}
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

let activeRefreshPromise: Promise<string | null> | null = null;

async function attemptSilentTokenRefresh(): Promise<string | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const { refreshToken } = getStoredAuthData();
      if (!refreshToken) {
        return null;
      }

      const baseUrl = getApiBaseUrl();
      const refreshUrl = baseUrl ? `${baseUrl}/api/auth/refresh` : '/api/auth/refresh';

      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data?.access_token) {
        updateStoredSession(data.access_token, data.refresh_token);
        return data.access_token as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

function getStoredAuthData(): { accessToken: string | null; refreshToken: string | null } {
  try {
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

function updateStoredSession(newAccessToken: string, newRefreshToken?: string | null): void {
  try {
    const storedAuth = localStorage.getItem('gdg_auth_storage');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      if (parsed?.state) {
        parsed.state.accessToken = newAccessToken;
        if (newRefreshToken) {
          parsed.state.refreshToken = newRefreshToken;
        }
        localStorage.setItem('gdg_auth_storage', JSON.stringify(parsed));
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function getStoredToken(): string | null {
  return getStoredAuthData().accessToken;
}
