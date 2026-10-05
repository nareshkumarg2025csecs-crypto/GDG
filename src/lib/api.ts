export const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return (import.meta.env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  // In browser environments, Vite dev server proxies /api to port 5000 directly.
  // Using relative URL eliminates cross-origin port issues, CORS preflights, and reduces egress.
  if (typeof window !== 'undefined') {
    return '';
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
  const { token, headers = {}, body, retries = 1, ...rest } = options;

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

    // If token is expired or unauthorized, clear stale stored auth session
    if (response.status === 401 && !url.includes('/api/auth/student/login') && !url.includes('/api/auth/admin/login')) {
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

function getStoredToken(): string | null {
  try {
    const storedAuth = localStorage.getItem('gdg_auth_storage');
    if (storedAuth) {
      const parsed = JSON.parse(storedAuth);
      return parsed?.state?.accessToken || null;
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}
