const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const REISSUABLE_AUTH_CODES = new Set(['AUTH001', 'AUTH002', 'AUTH005', 'AUTH006']);

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers);
  const isPlainJsonBody = options.body
    && typeof options.body === 'object'
    && !(options.body instanceof FormData);
  const hasBody = options.body !== undefined && options.body !== null;

  if (hasBody && isPlainJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body: isPlainJsonBody ? JSON.stringify(options.body) : options.body,
    headers,
    credentials: 'include',
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const message = typeof body === 'object' && body?.message
      ? body.message
      : '요청 처리에 실패했습니다.';
    throw new ApiError(message, {
      status: response.status,
      code: typeof body === 'object' ? body?.code : undefined,
      details: typeof body === 'object' ? body?.details : undefined,
    });
  }

  return body;
}

function shouldReissue(error) {
  return error?.status === 401 || REISSUABLE_AUTH_CODES.has(error?.code);
}

export async function apiRequestWithAuth(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (error) {
    if (!shouldReissue(error)) throw error;

    await apiRequest('/api/token/reissue', { method: 'POST' });
    return apiRequest(path, options);
  }
}
