import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiRequest, ApiError } from './client';

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('JSON 응답을 반환한다', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ))));

    await expect(apiRequest('/api/test')).resolves.toEqual({ ok: true });
  });

  it('Vite HTML fallback 200 응답은 API 성공으로 처리하지 않는다', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(
      '<!doctype html><div id="root"></div>',
      { status: 200, headers: { 'Content-Type': 'text/html' } },
    ))));

    await expect(apiRequest('/api/test')).rejects.toBeInstanceOf(ApiError);
  });
});
