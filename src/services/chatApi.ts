import apiClient from './apiClient'
import type { ChatRoom, MessageListResponse } from '@/types/chat'

export const getChatRooms = () =>
  apiClient.get<ChatRoom[]>('/api/chat/rooms')

export const getChatMessages = (chatRoomNo: string, cursor?: string) =>
  apiClient.get<MessageListResponse>(
    `/api/chat/rooms/${chatRoomNo}/messages`,
    { params: cursor ? { cursor } : undefined }
  )

export const markAsRead = (chatRoomNo: string) =>
  apiClient.post(`/api/chat/rooms/${chatRoomNo}/read`)

export const leaveChatRoom = (chatRoomNo: string) =>
  apiClient.delete(`/api/chat/rooms/${chatRoomNo}/leave`)

export const getOrCreateDirectChatRoom = (roomNo: string, applicantUserNo: string) =>
  apiClient.post<string>(`/api/rooms/${roomNo}/direct-chat/${applicantUserNo}`)

export const getChatRoomMembers = (chatRoomNo: string) =>
  apiClient.get<{ userNo: string; nickname: string; isHost: boolean }[]>(
    `/api/chat/rooms/${chatRoomNo}/members`
  )

export const findMyGroupChatRoomByRoomNo = async (roomNo: string) => {
  const res = await getChatRooms()
  const rooms = Array.isArray(res.data) ? res.data : []
  return rooms.find((room) => room.chatRoomType === 'GROUP' && room.roomNo === roomNo) ?? null
}
