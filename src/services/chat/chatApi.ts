import apiClient from '@/services/apiClient'
import type {
  SendMessageRequestDto,
  DecideMessageRequestDto,
  LoadMessageRoomResponse,
  CursorPage,
  LoadMessagesResponse,
  LoadMessageRoomParticipantResponse,
} from '@/types/chat'
import { MessageRequestDecision } from '@/types/chat'

/**
 * 채팅 요청 보내기 (Direct 채팅)
 * POST /api/chat/request/{receiverNo}
 */
export const sendChatRequest = async (
  receiverNo: number,
  initMessage?: string
): Promise<void> => {
  const request: SendMessageRequestDto = { initMessage }
  await apiClient.post(`/api/chat/request/${receiverNo}`, request)
}

/**
 * 채팅 요청 수락/거절
 * PATCH /api/chat/request/{messageRequestNo}
 */
export const decideChatRequest = async (
  messageRequestNo: string, // number → string
  decision: MessageRequestDecision
): Promise<void> => {
  const request: DecideMessageRequestDto = {
    messageRequestDecision: decision,
  }
  await apiClient.patch(`/api/chat/request/${messageRequestNo}`, request)
}

/**
 * 채팅방 목록 조회 (커서 페이지네이션)
 * GET /api/message-rooms?cursor={cursor}
 */
export const loadMessageRooms = async (
  cursor?: string
): Promise<CursorPage<LoadMessageRoomResponse>> => {
  const params = cursor ? { cursor } : {}
  const response = await apiClient.get<{
    success: boolean
    result: CursorPage<LoadMessageRoomResponse>
  }>('/api/message-rooms', { params })
  return response.data.result
}

/**
 * 특정 채팅방의 메시지 조회 (커서 페이지네이션)
 * GET /api/message-rooms/{roomId}/messages?cursor={cursor}&size={size}
 */
export const loadMessages = async (
  roomId: string, // number → string
  cursor?: string, // number → string
  size: number = 50
): Promise<LoadMessagesResponse> => {
  const params: Record<string, any> = { size }
  if (cursor !== undefined) {
    params.cursor = cursor
  }
  
  const response = await apiClient.get<{
    success: boolean
    result: LoadMessagesResponse
  }>(`/api/message-rooms/${roomId}/messages`, { params })
  
  return response.data.result
}

/**
 * 특정 채팅방의 참여자 목록 조회
 * GET /api/chat/rooms/{roomId}/participants
 */
export const loadMessageRoomParticipants = async (
  roomId: string
): Promise<LoadMessageRoomParticipantResponse[]> => {
  const response = await apiClient.get<{
    success: boolean
    result: LoadMessageRoomParticipantResponse[]
  }>(`/api/chat/rooms/${roomId}/participants`)

  return response.data.result
}

/**
 * 채팅방 나가기
 * POST /api/message-rooms/{roomId}/leave
 */
export const leaveMessageRoom = async (roomId: string): Promise<void> => { // number → string
  await apiClient.post(`/api/message-rooms/${roomId}/leave`)
}

/**
 * 채팅방 삭제 (방장 권한 필요)
 * DELETE /api/message-rooms/{roomId}
 */
export const deleteMessageRoom = async (roomId: string): Promise<void> => { // number → string
  await apiClient.delete(`/api/message-rooms/${roomId}`)
}
