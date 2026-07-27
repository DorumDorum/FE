import { apiRequest, apiRequestWithAuth } from './client';

export function loadMyRoom() {
  return apiRequestWithAuth('/api/rooms/me');
}

export function loadNotices() {
  return apiRequest('/api/notices');
}

export function loadCalendarEvents(startDate, endDate) {
  const params = new URLSearchParams({ startDate, endDate });
  return apiRequest(`/api/calendar/events?${params.toString()}`);
}

export function loadNotifications(cursor) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiRequestWithAuth(`/api/notifications${query}`);
}

export function markNotificationRead(notificationNo) {
  return apiRequestWithAuth(`/api/notifications/${notificationNo}/read`, { method: 'PATCH' });
}

export function findRooms(filter) {
  return apiRequestWithAuth('/api/rooms/search', {
    method: 'POST',
    body: filter,
  });
}

export function loadRoomRule(roomNo) {
  return apiRequestWithAuth(`/api/rooms/${roomNo}/rule`);
}

export function loadMyChecklist() {
  return apiRequestWithAuth('/api/users/me/checklist');
}

export function createUserChecklist(request) {
  return apiRequestWithAuth('/api/users/me/checklist', { method: 'POST', body: request });
}

export function updateUserChecklist(request) {
  return apiRequestWithAuth('/api/users/me/checklist', { method: 'PUT', body: request });
}

export function loadLikedRooms() {
  return apiRequestWithAuth('/api/rooms/me/liked');
}

export function likeRoom(roomNo) {
  return apiRequestWithAuth(`/api/rooms/${roomNo}/like`, { method: 'POST' });
}

export function unlikeRoom(roomNo) {
  return apiRequestWithAuth(`/api/rooms/${roomNo}/like`, { method: 'DELETE' });
}

export function loadRecommendedRooms() {
  return apiRequestWithAuth('/api/rooms/recommended');
}

export function loadMyAppliedRooms() {
  return apiRequestWithAuth('/api/rooms/me/applied');
}
