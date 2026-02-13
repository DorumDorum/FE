// ===== Enums =====
export enum MessageRoomStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export enum MessageRoomType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}

export enum MessageRequestDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

// ===== API Request/Response Types =====

// 채팅 요청 보내기
export interface SendMessageRequestDto {
  initMessage?: string
}

// 채팅 요청 수락/거절
export interface DecideMessageRequestDto {
  messageRequestDecision: MessageRequestDecision
}

// 채팅방 목록 조회 응답
export interface LoadMessageRoomResponse {
  messageRoomNo: string // number → string
  roomType: MessageRoomType
  roomStatus: MessageRoomStatus
  messageRequestNo: string | null // number → string
  lastMessage: string
  lastMessageAt: string // ISO DateTime
  isRequester: boolean
}

export interface CursorPage<T> {
  items: T[]           // content → items
  nextCursor: string | null
  hasNext: boolean     // hasMore → hasNext
}

// 메시지 조회 응답
export interface MessageDto {
  messageNo: string // number → string
  senderNo: string // number → string
  senderName: string
  content: string
  messageType: MessageType
  sentAt: string // ISO DateTime
  readCount: number
}

export interface LoadMessagesResponse {
  messages: MessageDto[]
  nextCursor: string | null // number → string
  hasMore: boolean
}

// ===== WebSocket Types =====

// STOMP 메시지 전송 (SEND /pub/rooms/{roomId})
export interface SendMessageSocketRequest {
  content: string
}

// STOMP 메시지 수신 (/sub/rooms/{roomId})
export interface ReceiveMessageSocketResponse {
  messageNo: string // number → string
  messageRoomNo: string // number → string
  senderNo: string // number → string
  content: string
  messageType: MessageType
  sentAt: string // ISO DateTime
}

// Presence 신호 (SEND /pub/presence/enter, /pub/presence/leave)
export interface PresenceSignalRequest {
  roomId: string // number → string
}

// ===== SSE Event Types =====

export interface MessageSentEvent {
  messageId: string // number → string
  roomId: string // number → string
  senderId: string // number → string
  senderName: string // 추가
  content: string
  messageType: MessageType
  sentAt: string
}

export interface MessageRequestCreatedEvent {
  messageRequestNo: string // number → string
  senderNo: string // number → string
  senderName: string
  roomNo: string // number → string
  createdAt: string
}

export interface MessageRequestDecidedEvent {
  messageRequestNo: string // number → string
  roomNo: string // number → string
  decision: MessageRequestDecision
  decidedAt: string
}

// SSE 이벤트 이름
export enum SseEventName {
  CONNECTED = 'connected',
  HEARTBEAT = 'heartbeat',
  CHAT_MESSAGE = 'chat.message',
  CHAT_REQUEST_CREATED = 'chat.request.created',
  CHAT_REQUEST_DECIDED = 'chat.request.decided',
}

// ===== Local State Types =====

export interface ChatMessage {
  messageNo: string // number → string
  messageRoomNo: string // number → string
  senderNo: string // number → string
  senderName: string
  content: string
  messageType: MessageType
  sentAt: string
  readCount?: number
  isLocal?: boolean // 전송 중인 메시지 표시용
}

export interface ChatRoom {
  messageRoomNo: string // number → string
  roomType: MessageRoomType
  roomStatus: MessageRoomStatus
  messageRequestNo: string | null // number → string
  lastMessage: string
  lastMessageAt: string
  isRequester: boolean
  unreadCount?: number
}

// WebSocket 연결 상태
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}
