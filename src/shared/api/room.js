import * as client from './client';

export function submitRoomApplication(roomNo, message) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}/request`, {
    method: 'POST',
    body: { introduction: message },
  });
}

export function createRoom(request) {
  return client.apiRequestWithAuth('/api/rooms', {
    method: 'POST',
    body: request,
  });
}

export function deleteRoom(roomNo) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}`, {
    method: 'DELETE',
  });
}

export function loadApplications(roomNo) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}/applications`);
}

export function approveApplication(roomNo, requestNo) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}/request/${requestNo}/approve`, {
    method: 'POST',
  });
}

export function rejectApplication(requestNo) {
  return client.apiRequestWithAuth(`/api/request/${requestNo}/reject`, {
    method: 'POST',
  });
}

export function loadMyRoomRule(roomNo) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}/rule`);
}

export function updateMyRoomRule(roomNo, request) {
  return client.apiRequestWithAuth(`/api/rooms/me/rule?roomNo=${encodeURIComponent(roomNo)}`, {
    method: 'PUT',
    body: request,
  });
}

export function loadMyRoommates() {
  return client.apiRequestWithAuth('/api/rooms/me/roommates');
}

export function cancelRoomApplication(roomNo) {
  return client.apiRequestWithAuth(`/api/rooms/${roomNo}/request`, {
    method: 'DELETE',
  });
}

export function checkMyRoom() {
  return client.apiRequestWithAuth('/api/rooms/me/exists');
}

export function updateRoomTitle(roomNo, request) {
  return client.apiRequestWithAuth(`/api/rooms/me/title?roomNo=${encodeURIComponent(roomNo)}`, {
    method: 'PUT',
    body: request,
  });
}
