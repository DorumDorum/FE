import { create } from 'zustand'
import type {
  ChatRoom,
  ChatMessage,
  ChatParticipant,
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
  // 방별 참여자 캐시 (roomId -> (userId -> participant))
  participantsByRoom: Map<string, Map<string, ChatParticipant>>

  // WebSocket/SSE 연결 상태
  wsConnectionStatus: ConnectionStatus
  sseConnected: boolean

  // 채팅 요청 알림 (미처리 요청)
  pendingRequests: MessageRequestCreatedEvent[]

  // Actions
  setRooms: (rooms: ChatRoom[], cursor: string | null, hasMore: boolean) => void
  addRoom: (room: ChatRoom) => void
  removeRoom: (roomId: string) => void
  updateRoom: (roomId: string, updates: Partial<ChatRoom>) => void // number → string
  setLoadingRooms: (loading: boolean) => void

  setCurrentRoomId: (roomId: string | null) => void // number → string

  setMessages: (roomId: string, messages: ChatMessage[], cursor: string | null, hasMore: boolean) => void // number → string
  addMessage: (roomId: string, message: ChatMessage) => void // number → string
  prependMessages: (roomId: string, messages: ChatMessage[]) => void // number → string
  setRoomParticipants: (roomId: string, participants: ChatParticipant[]) => void
  clearRoomParticipants: (roomId: string) => void

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
  participantsByRoom: new Map(),
  wsConnectionStatus: ConnectionStatus.DISCONNECTED,
  sseConnected: false,
  pendingRequests: [],
}

export const useChatStore = create<ChatState>((set) => ({
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

  removeRoom: (roomId) =>
    set((state) => {
      const newParticipantsByRoom = new Map(state.participantsByRoom)
      // 방 목록에서 제거될 때 참여자 캐시도 정리해 메모리/오염 방지
      newParticipantsByRoom.delete(roomId)

      return {
        rooms: state.rooms.filter((room) => room.messageRoomNo !== roomId),
        participantsByRoom: newParticipantsByRoom,
      }
    }),

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

  setRoomParticipants: (roomId, participants) =>
    set((state) => {
      const newParticipantsByRoom = new Map(state.participantsByRoom)
      const participantMap = new Map<string, ChatParticipant>()

      participants.forEach((participant) => {
        // 렌더링 시 O(1) 조회를 위해 userId 키 맵 형태로 저장
        participantMap.set(participant.userId, participant)
      })

      // 재입장/새로고침 시 해당 roomId 캐시를 최신 응답으로 교체
      newParticipantsByRoom.set(roomId, participantMap)

      return { participantsByRoom: newParticipantsByRoom }
    }),

  clearRoomParticipants: (roomId) =>
    set((state) => {
      const newParticipantsByRoom = new Map(state.participantsByRoom)
      newParticipantsByRoom.delete(roomId)
      return { participantsByRoom: newParticipantsByRoom }
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
    participantsByRoom: new Map(),
    wsConnectionStatus: ConnectionStatus.DISCONNECTED,
    sseConnected: false,
    pendingRequests: [],
  }),
}))
