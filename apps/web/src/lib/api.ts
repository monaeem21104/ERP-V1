const API = '/api/v1';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const companyId = localStorage.getItem('companyId');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (companyId) headers.set('X-Company-Id', companyId);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.message ? (Array.isArray(data.message) ? data.message.join(', ') : data.message) : res.statusText;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};
