export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

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
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers = {}, body, ...rest } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

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

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      body,
    });
  } catch (err: any) {
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
