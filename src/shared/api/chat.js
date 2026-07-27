import * as client from './client';

export function loadMyChatRooms() {
  return client.apiRequestWithAuth('/api/chat/rooms');
}

export function loadChatMessages(chatRoomNo, cursor) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return client.apiRequestWithAuth(`/api/chat/rooms/${chatRoomNo}/messages${query}`);
}

export function markChatRoomRead(chatRoomNo) {
  return client.apiRequestWithAuth(`/api/chat/rooms/${chatRoomNo}/read`, { method: 'POST' });
}

export function leaveChatRoom(chatRoomNo) {
  return client.apiRequestWithAuth(`/api/chat/rooms/${chatRoomNo}/leave`, { method: 'DELETE' });
}

export function getChatRoomMembers(chatRoomNo) {
  return client.apiRequestWithAuth(`/api/chat/rooms/${chatRoomNo}/members`);
}

export function getOrCreateDirectChatRoom(roomNo, applicantUserNo) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}/direct-chat/${applicantUserNo}`, { method: 'POST' });
}
