import { create } from 'zustand'
import type {
  ChatRoom,
  ChatMessage,
  ChatParticipant,
  ParticipantReadState,
  MessageRoomReadStateParticipantPayload,
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
  // 방별 읽음 상태 캐시 (roomId -> (userId -> state))
  participantReadStatesByRoom: Map<string, Map<string, ParticipantReadState>>

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
  replaceMessage: (roomId: string, oldMessageNo: string, nextMessage: ChatMessage) => void
  setRoomParticipants: (roomId: string, participants: ChatParticipant[]) => void
  clearRoomParticipants: (roomId: string) => void
  mergeRoomReadState: (
    roomId: string,
    payloadParticipants: MessageRoomReadStateParticipantPayload[]
  ) => void
  advanceReadStateForInRoomParticipants: (
    roomId: string,
    messageId: string,
    sentAt: string
  ) => void

  setWsConnectionStatus: (status: ConnectionStatus) => void
  setSseConnected: (connected: boolean) => void

  addPendingRequest: (request: MessageRequestCreatedEvent) => void
  removePendingRequest: (messageRequestNo: string) => void // number → string

  // 읽지 않은 메시지 표시(on/off)
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
  participantReadStatesByRoom: new Map(),
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
      const newParticipantReadStatesByRoom = new Map(state.participantReadStatesByRoom)
      // 방 목록에서 제거될 때 참여자 캐시도 정리해 메모리/오염 방지
      newParticipantsByRoom.delete(roomId)
      newParticipantReadStatesByRoom.delete(roomId)

      return {
        rooms: state.rooms.filter((room) => room.messageRoomNo !== roomId),
        participantsByRoom: newParticipantsByRoom,
        participantReadStatesByRoom: newParticipantReadStatesByRoom,
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

  replaceMessage: (roomId, oldMessageNo, nextMessage) =>
    set((state) => {
      const newMessagesByRoom = new Map(state.messagesByRoom)
      const existingMessages = newMessagesByRoom.get(roomId) || []

      const targetIndex = existingMessages.findIndex((message) => message.messageNo === oldMessageNo)
      if (targetIndex < 0) {
        return { messagesByRoom: newMessagesByRoom }
      }

      const duplicateServerIndex = existingMessages.findIndex(
        (message) => message.messageNo === nextMessage.messageNo
      )
      const baseMessages =
        duplicateServerIndex >= 0
          ? existingMessages.filter((_, index) => index !== duplicateServerIndex)
          : existingMessages

      const replacedMessages = [...baseMessages]
      const safeTargetIndex = Math.min(targetIndex, replacedMessages.length - 1)
      replacedMessages[safeTargetIndex] = nextMessage
      newMessagesByRoom.set(roomId, replacedMessages)

      return { messagesByRoom: newMessagesByRoom }
    }),

  setRoomParticipants: (roomId, participants) =>
    set((state) => {
      const newParticipantsByRoom = new Map(state.participantsByRoom)
      const newParticipantReadStatesByRoom = new Map(state.participantReadStatesByRoom)
      const participantMap = new Map<string, ChatParticipant>()
      const existingReadStates = newParticipantReadStatesByRoom.get(roomId) || new Map<string, ParticipantReadState>()
      const nextReadStates = new Map<string, ParticipantReadState>()

      participants.forEach((participant) => {
        // 렌더링 시 O(1) 조회를 위해 userId 키 맵 형태로 저장
        participantMap.set(participant.userId, participant)
        nextReadStates.set(participant.userId, existingReadStates.get(participant.userId) || {
          userId: participant.userId,
          isInMessageRoom: false,
          lastReadMessageId: null,
          lastReadSentAt: null,
        })
      })

      // 재입장/새로고침 시 해당 roomId 캐시를 최신 응답으로 교체
      newParticipantsByRoom.set(roomId, participantMap)
      // 참여자 목록 API를 기준으로 읽음 상태의 전체 user set을 유지한다.
      newParticipantReadStatesByRoom.set(roomId, nextReadStates)

      return {
        participantsByRoom: newParticipantsByRoom,
        participantReadStatesByRoom: newParticipantReadStatesByRoom,
      }
    }),

  clearRoomParticipants: (roomId) =>
    set((state) => {
      const newParticipantsByRoom = new Map(state.participantsByRoom)
      const newParticipantReadStatesByRoom = new Map(state.participantReadStatesByRoom)
      newParticipantsByRoom.delete(roomId)
      newParticipantReadStatesByRoom.delete(roomId)
      return {
        participantsByRoom: newParticipantsByRoom,
        participantReadStatesByRoom: newParticipantReadStatesByRoom,
      }
    }),

  mergeRoomReadState: (roomId, payloadParticipants) =>
    set((state) => {
      const newParticipantReadStatesByRoom = new Map(state.participantReadStatesByRoom)
      const currentStates = new Map(
        newParticipantReadStatesByRoom.get(roomId) || new Map<string, ParticipantReadState>()
      )
      const payloadUserIds = new Set(payloadParticipants.map((participant) => participant.userId))

      payloadParticipants.forEach((payload) => {
        const previous = currentStates.get(payload.userId) || {
          userId: payload.userId,
          isInMessageRoom: false,
          lastReadMessageId: null,
          lastReadSentAt: null,
        }
        const isInMessageRoom = payload.lastReadMessageId == null && payload.lastReadSentAt == null

        if (isInMessageRoom) {
          // in-room 신호는 기존 lastRead 포인터를 지우지 않고 보존한다.
          currentStates.set(payload.userId, {
            ...previous,
            isInMessageRoom: true,
          })
          return
        }

        const shouldAdvance =
          isNewerReadState(
            payload.lastReadSentAt,
            payload.lastReadMessageId,
            previous.lastReadSentAt,
            previous.lastReadMessageId
          ) || previous.lastReadSentAt == null

        currentStates.set(payload.userId, {
          userId: payload.userId,
          isInMessageRoom: false,
          lastReadMessageId: shouldAdvance
            ? payload.lastReadMessageId
            : previous.lastReadMessageId,
          lastReadSentAt: shouldAdvance
            ? payload.lastReadSentAt
            : previous.lastReadSentAt,
        })
      })

      // sparse payload 특성상, 이번 이벤트에 없어진 사용자는 in-room 상태만 false로 내린다.
      currentStates.forEach((existingState, userId) => {
        if (!payloadUserIds.has(userId) && existingState.isInMessageRoom) {
          currentStates.set(userId, {
            ...existingState,
            isInMessageRoom: false,
          })
        }
      })

      newParticipantReadStatesByRoom.set(roomId, currentStates)
      return { participantReadStatesByRoom: newParticipantReadStatesByRoom }
    }),

  advanceReadStateForInRoomParticipants: (roomId, messageId, sentAt) =>
    set((state) => {
      const newParticipantReadStatesByRoom = new Map(state.participantReadStatesByRoom)
      const currentStates = new Map(
        newParticipantReadStatesByRoom.get(roomId) || new Map<string, ParticipantReadState>()
      )

      currentStates.forEach((participantState, userId) => {
        if (!participantState.isInMessageRoom) {
          return
        }

        const shouldAdvance = isNewerReadState(
          sentAt,
          messageId,
          participantState.lastReadSentAt,
          participantState.lastReadMessageId
        )

        if (!shouldAdvance) {
          return
        }

        currentStates.set(userId, {
          ...participantState,
          lastReadMessageId: messageId,
          lastReadSentAt: sentAt,
        })
      })

      newParticipantReadStatesByRoom.set(roomId, currentStates)
      return { participantReadStatesByRoom: newParticipantReadStatesByRoom }
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
          ? {
              ...room,
              // 이전 방식: SSE 수신마다 안읽은 "개수" 누적
              // unreadCount: (room.unreadCount || 0) + 1,
              hasUnread: true,
            }
          : room
      ),
    })),

  resetUnreadCount: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.messageRoomNo === roomId
          ? {
              ...room,
              // 이전 방식: 입장 시 unreadCount를 0으로 초기화
              // unreadCount: 0,
              hasUnread: false,
            }
          : room
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
    participantReadStatesByRoom: new Map(),
    wsConnectionStatus: ConnectionStatus.DISCONNECTED,
    sseConnected: false,
    pendingRequests: [],
  }),
}))

const compareMessageIds = (left: string | null, right: string | null): number => {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1
  if (left === right) return 0
  return left > right ? 1 : -1
}

const isNewerReadState = (
  nextSentAt: string | null,
  nextMessageId: string | null,
  prevSentAt: string | null,
  prevMessageId: string | null
): boolean => {
  if (nextSentAt == null && nextMessageId == null) {
    return false
  }
  if (prevSentAt == null && prevMessageId == null) {
    return true
  }
  if (nextSentAt != null && prevSentAt != null) {
    if (nextSentAt > prevSentAt) return true
    if (nextSentAt < prevSentAt) return false
  } else if (nextSentAt != null && prevSentAt == null) {
    return true
  } else if (nextSentAt == null && prevSentAt != null) {
    return false
  }

  return compareMessageIds(nextMessageId, prevMessageId) > 0
}
