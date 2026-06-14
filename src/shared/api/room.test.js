import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from './client';
import {
  submitRoomApplication,
  loadApplications,
  approveApplication,
  rejectApplication,
  loadMyRoomRule,
  updateMyRoomRule,
  loadMyRoommates,
  updateRoomTitle,
  createRoom,
} from './room';

describe('room api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'apiRequestWithAuth').mockResolvedValue('OK');
  });

  it('submitRoomApplication은 POST /api/rooms/42/request with body', async () => {
    await submitRoomApplication(42, '안녕하세요');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/42/request', {
      method: 'POST',
      body: { introduction: '안녕하세요' },
    });
  });

  it('submitRoomApplication은 빈 문자열 message도 body에 포함', async () => {
    await submitRoomApplication(42, '');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/42/request', {
      method: 'POST',
      body: { introduction: '' },
    });
  });

  it('loadApplications는 GET /api/rooms/42/applications 호출 및 목록 반환', async () => {
    const mockList = [{ id: 1 }, { id: 2 }];
    vi.spyOn(client, 'apiRequestWithAuth').mockResolvedValue(mockList);
    const result = await loadApplications(42);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/42/applications');
    expect(result).toEqual(mockList);
  });

  it('approveApplication은 POST /api/rooms/42/request/7/approve 호출', async () => {
    await approveApplication(42, 7);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/42/request/7/approve', {
      method: 'POST',
    });
  });

  it('rejectApplication은 POST /api/request/7/reject 호출', async () => {
    await rejectApplication(7);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/request/7/reject', {
      method: 'POST',
    });
  });

  it('loadMyRoomRule은 GET /api/rooms/42/rule 호출 및 규칙 반환', async () => {
    const mockRule = { bedtime: '23:00-01:00' };
    vi.spyOn(client, 'apiRequestWithAuth').mockResolvedValue(mockRule);
    const result = await loadMyRoomRule(42);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/42/rule');
    expect(result).toEqual(mockRule);
  });

  it('updateMyRoomRule은 PUT /api/rooms/me/rule?roomNo=42 호출', async () => {
    const request = { bedtime: '23:00-01:00' };
    await updateMyRoomRule(42, request);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/me/rule?roomNo=42', {
      method: 'PUT',
      body: request,
    });
  });

  it('loadMyRoommates는 GET /api/rooms/me/roommates 호출 및 목록 반환', async () => {
    const mockList = [{ userNo: 'u1' }];
    vi.spyOn(client, 'apiRequestWithAuth').mockResolvedValue(mockList);
    const result = await loadMyRoommates();
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/me/roommates');
    expect(result).toEqual(mockList);
  });

  it('updateRoomTitle은 PUT /api/rooms/me/title?roomNo=42 호출', async () => {
    await updateRoomTitle(42, { title: '새 제목', notes: '소개' });
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/me/title?roomNo=42', {
      method: 'PUT',
      body: { title: '새 제목', notes: '소개' },
    });
  });

  it('createRoom은 POST /api/rooms 호출', async () => {
    const request = { title: '모집방', roomType: 'TYPE_2', capacity: 4, residencePeriod: 'SEMESTER', rule: {} };
    await createRoom(request);
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms', {
      method: 'POST',
      body: request,
    });
  });
});
