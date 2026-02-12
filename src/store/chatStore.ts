import { create } from 'zustand'
import type {
  ChatRoom,
  ChatMessage,
  MessageRequestCreatedEvent,
} from '@/types/chat'
import { ConnectionStatus } from '@/types/chat'

interface ChatState {
  // 채팅방 목록
  rooms: ChatRoom[]
  isLoadingRooms: boolean
  roomsCursor: string | null
  hasMoreRooms: boolean

  // 현재 입장한 방
  currentRoomId: string | null // number → string
  
  // 방별 메시지 저장 (roomId -> messages)
  messagesByRoom: Map<string, ChatMessage[]> // number → string
  messageCursors: Map<string, string | null> // number → string
  hasMoreMessages: Map<string, boolean> // number → string

  // WebSocket/SSE 연결 상태
  wsConnectionStatus: ConnectionStatus
  sseConnected: boolean

  // 채팅 요청 알림 (미처리 요청)
  pendingRequests: MessageRequestCreatedEvent[]

  // Actions
  setRooms: (rooms: ChatRoom[], cursor: string | null, hasMore: boolean) => void
  addRoom: (room: ChatRoom) => void
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void // number → string
  setLoadingRooms: (loading: boolean) => void

  setCurrentRoomId: (roomId: string | null) => void // number → string

  setMessages: (roomId: string, messages: ChatMessage[], cursor: string | null, hasMore: boolean) => void // number → string
  addMessage: (roomId: string, message: ChatMessage) => void // number → string
  prependMessages: (roomId: string, messages: ChatMessage[]) => void // number → string

  setWsConnectionStatus: (status: ConnectionStatus) => void
  setSseConnected: (connected: boolean) => void

  addPendingRequest: (request: MessageRequestCreatedEvent) => void
  removePendingRequest: (messageRequestNo: string) => void // number → string

  // 읽지 않은 메시지 카운트 증가
  incrementUnreadCount: (roomId: string) => void // number → string
  resetUnreadCount: (roomId: string) => void // number → string

  // 초기화
  reset: () => void
}

const initialState = {
  rooms: [],
  isLoadingRooms: false,
  roomsCursor: null,
  hasMoreRooms: false,
  currentRoomId: null,
  messagesByRoom: new Map(),
  messageCursors: new Map(),
  hasMoreMessages: new Map(),
  wsConnectionStatus: ConnectionStatus.DISCONNECTED,
  sseConnected: false,
  pendingRequests: [],
}

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  setRooms: (rooms, cursor, hasMore) =>
    set({
      rooms,
      roomsCursor: cursor,
      hasMoreRooms: hasMore,
    }),

  addRoom: (room) =>
    set((state) => ({
      rooms: [room, ...state.rooms],
    })),

  updateRoom: (roomId, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.messageRoomNo === roomId ? { ...room, ...updates } : room
      ),
    })),

  setLoadingRooms: (loading) =>
    set({ isLoadingRooms: loading }),

  setCurrentRoomId: (roomId) =>
    set({ currentRoomId: roomId }),

  setMessages: (roomId, messages, cursor, hasMore) =>
    set((state) => {
      const newMessagesByRoom = new Map(state.messagesByRoom)
      newMessagesByRoom.set(roomId, messages)

      const newCursors = new Map(state.messageCursors)
      newCursors.set(roomId, cursor)

      const newHasMore = new Map(state.hasMoreMessages)
      newHasMore.set(roomId, hasMore)

      return {
        messagesByRoom: newMessagesByRoom,
        messageCursors: newCursors,
        hasMoreMessages: newHasMore,
      }
    }),

  addMessage: (roomId, message) =>
    set((state) => {
      const newMessagesByRoom = new Map(state.messagesByRoom)
      const existingMessages = newMessagesByRoom.get(roomId) || []
      
      // 중복 체크 (messageNo 기준)
      const isDuplicate = existingMessages.some(
        (m) => m.messageNo === message.messageNo
      )
      
      if (!isDuplicate) {
        newMessagesByRoom.set(roomId, [...existingMessages, message])
      }

      return { messagesByRoom: newMessagesByRoom }
    }),

  prependMessages: (roomId, messages) =>
    set((state) => {
      const newMessagesByRoom = new Map(state.messagesByRoom)
      const existingMessages = newMessagesByRoom.get(roomId) || []
      
      // 중복 제거하면서 앞에 추가 (오래된 메시지)
      const existingIds = new Set(existingMessages.map((m) => m.messageNo))
      const newMessages = messages.filter((m) => !existingIds.has(m.messageNo))
      
      newMessagesByRoom.set(roomId, [...newMessages, ...existingMessages])

      return { messagesByRoom: newMessagesByRoom }
    }),

  setWsConnectionStatus: (status) =>
    set({ wsConnectionStatus: status }),

  setSseConnected: (connected) =>
    set({ sseConnected: connected }),

  addPendingRequest: (request) =>
    set((state) => ({
      pendingRequests: [...state.pendingRequests, request],
    })),

  removePendingRequest: (messageRequestNo) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter(
        (req) => req.messageRequestNo !== messageRequestNo
      ),
    })),

  incrementUnreadCount: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.messageRoomNo === roomId
          ? { ...room, unreadCount: (room.unreadCount || 0) + 1 }
          : room
      ),
    })),

  resetUnreadCount: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.messageRoomNo === roomId ? { ...room, unreadCount: 0 } : room
      ),
    })),

  reset: () => set({
    rooms: [],
    isLoadingRooms: false,
    roomsCursor: null,
    hasMoreRooms: false,
    currentRoomId: null,
    messagesByRoom: new Map(),
    messageCursors: new Map(),
    hasMoreMessages: new Map(),
    wsConnectionStatus: ConnectionStatus.DISCONNECTED,
    sseConnected: false,
    pendingRequests: [],
  }),
}))
