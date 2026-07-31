import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadNoticeDetail,
  loadNotificationSettings,
  updateNotificationSettings,
  loadRoomDetail,
} from './home';
import { apiRequest, apiRequestWithAuth } from './client';

vi.mock('./client', () => ({
  apiRequest: vi.fn(() => Promise.resolve('OK')),
  apiRequestWithAuth: vi.fn(() => Promise.resolve('OK')),
}));

describe('home api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loadNoticeDetail은 GET /api/notices/{noticeNo} 호출', async () => {
    await loadNoticeDetail('notice 1');
    expect(apiRequest).toHaveBeenCalledWith('/api/notices/notice%201');
  });

  it('loadNotificationSettings는 GET notification-settings 호출', async () => {
    await loadNotificationSettings();
    expect(apiRequestWithAuth).toHaveBeenCalledWith('/api/users/me/notification-settings');
  });

  it('updateNotificationSettings는 PUT notification-settings 호출', async () => {
    const settings = { enabled: true, applicants: true, applicantResult: true, chat: true, notice: true, schedule: false };
    await updateNotificationSettings(settings);
    expect(apiRequestWithAuth).toHaveBeenCalledWith('/api/users/me/notification-settings', {
      method: 'PUT',
      body: settings,
    });
  });

  it('loadRoomDetail은 GET /api/rooms/{roomNo} 호출', async () => {
    await loadRoomDetail('room 1');
    expect(apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/room%201');
  });
});
