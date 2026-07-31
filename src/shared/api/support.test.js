import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from './client';
import { createSupportInquiry, loadSupportInquiries, loadSupportInquiry } from './support';

describe('support api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'apiRequestWithAuth').mockResolvedValue('OK');
  });

  it('createSupportInquiry는 POST /api/support/inquiries 호출', async () => {
    const request = { category: 'APP_USAGE', message: '문의합니다' };
    await createSupportInquiry(request);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/support/inquiries', {
      method: 'POST',
      body: request,
    });
  });

  it('loadSupportInquiries는 GET /api/support/inquiries 호출', async () => {
    await loadSupportInquiries();
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/support/inquiries');
  });

  it('loadSupportInquiry는 inquiryNo를 인코딩해 호출', async () => {
    await loadSupportInquiry('inq 1');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/support/inquiries/inq%201');
  });
});
