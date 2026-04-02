import { create } from 'zustand'
import type { ChatRoom, ChatMessage } from '@/types/chat'

interface ChatStore {
  chatRooms: ChatRoom[]
  setChatRooms: (rooms: ChatRoom[]) => void
  updateRoomOnNewMessage: (chatRoomNo: string, message: ChatMessage) => void
  incrementUnreadCount: (chatRoomNo: string) => void
  resetUnreadCount: (chatRoomNo: string) => void

  messages: Record<string, ChatMessage[]>
  cursors: Record<string, string | null>
  hasMore: Record<string, boolean>
  setMessages: (chatRoomNo: string, msgs: ChatMessage[], nextCursor: string | null, hasNext: boolean) => void
  prependMessages: (chatRoomNo: string, msgs: ChatMessage[], nextCursor: string | null, hasNext: boolean) => void
  appendMessage: (chatRoomNo: string, message: ChatMessage) => void
}

export const useChatStore = create<ChatStore>((set) => ({
  chatRooms: [],
  setChatRooms: (rooms) => set({ chatRooms: rooms || [] }),
  updateRoomOnNewMessage: (chatRoomNo, message) =>
    set((state) => ({
      chatRooms: state.chatRooms.map((room) =>
        room.chatRoomNo === chatRoomNo
          ? { ...room, lastMessageContent: message.content, lastMessageAt: message.sentAt }
          : room
      ),
    })),
  incrementUnreadCount: (chatRoomNo) =>
    set((state) => ({
      chatRooms: state.chatRooms.map((room) =>
        room.chatRoomNo === chatRoomNo
          ? { ...room, unreadCount: room.unreadCount + 1 }
          : room
      ),
    })),
  resetUnreadCount: (chatRoomNo) =>
    set((state) => ({
      chatRooms: state.chatRooms.map((room) =>
        room.chatRoomNo === chatRoomNo ? { ...room, unreadCount: 0 } : room
      ),
    })),

  messages: {},
  cursors: {},
  hasMore: {},
  setMessages: (chatRoomNo, msgs, nextCursor, hasNext) =>
    set((state) => ({
      messages: { ...state.messages, [chatRoomNo]: [...msgs].reverse() },
      cursors: { ...state.cursors, [chatRoomNo]: nextCursor },
      hasMore: { ...state.hasMore, [chatRoomNo]: hasNext },
    })),
  prependMessages: (chatRoomNo, msgs, nextCursor, hasNext) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomNo]: [...[...msgs].reverse(), ...(state.messages[chatRoomNo] ?? [])],
      },
      cursors: { ...state.cursors, [chatRoomNo]: nextCursor },
      hasMore: { ...state.hasMore, [chatRoomNo]: hasNext },
    })),
  appendMessage: (chatRoomNo, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatRoomNo]: [...(state.messages[chatRoomNo] ?? []), message],
      },
    })),
}))
