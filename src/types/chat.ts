export type ChatRoomType = 'GROUP' | 'DIRECT'

export interface ChatRoom {
  chatRoomNo: string
  roomNo: string
  chatRoomType: ChatRoomType
  partnerUserNo?: string
  partnerNickname?: string
  roomName?: string
  lastMessageContent: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface ChatMessage {
  messageNo: string
  chatRoomNo: string
  senderNo: string
  content: string
  messageType: 'TEXT' | 'SYSTEM'
  sentAt: string
  unreadCount?: number
}

export interface MessageListResponse {
  items: ChatMessage[]
  nextCursor: string | null
  hasNext: boolean
}
