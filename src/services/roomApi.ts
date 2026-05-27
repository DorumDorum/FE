import apiClient from './apiClient'

export const kickRoommate = (roomNo: string, kickedUserNo: string) =>
  apiClient.delete(`/api/rooms/${roomNo}/members/${kickedUserNo}`)

export const deleteRoom = (roomNo: string) =>
  apiClient.delete(`/api/rooms/${roomNo}`)
