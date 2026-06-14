import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from './client';
import {
  loadMyChatRooms, loadChatMessages, markChatRoomRead,
  leaveChatRoom, getChatRoomMembers, getOrCreateDirectChatRoom,
} from './chat';

describe('chat api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(client, 'apiRequestWithAuth').mockResolvedValue('OK');
  });

  it('loadMyChatRooms는 GET /api/chat/rooms 호출', async () => {
    await loadMyChatRooms();
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/chat/rooms');
  });

  it('loadChatMessages는 cursor 없이 호출 가능', async () => {
    await loadChatMessages('R1');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/chat/rooms/R1/messages');
  });

  it('loadChatMessages는 cursor를 쿼리로 인코딩', async () => {
    await loadChatMessages('R1', 'cur:1');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/chat/rooms/R1/messages?cursor=cur%3A1');
  });

  it('markChatRoomRead는 POST', async () => {
    await markChatRoomRead('R1');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/chat/rooms/R1/read', { method: 'POST' });
  });

  it('leaveChatRoom은 DELETE', async () => {
    await leaveChatRoom('R1');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/chat/rooms/R1/leave', { method: 'DELETE' });
  });

  it('getChatRoomMembers는 GET members', async () => {
    await getChatRoomMembers('R1');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/chat/rooms/R1/members');
  });

  it('getOrCreateDirectChatRoom은 POST direct-chat', async () => {
    await getOrCreateDirectChatRoom('ROOM1', 'USER9');
    expect(client.apiRequestWithAuth).toHaveBeenCalledWith('/api/rooms/ROOM1/direct-chat/USER9', { method: 'POST' });
  });
});
