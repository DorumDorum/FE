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
  removeChatRoom: (chatRoomNo: string) => void
  removeGroupChatRoomsByRoomNo: (roomNo: string) => void
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
  removeChatRoom: (chatRoomNo) =>
    set((state) => ({
      chatRooms: state.chatRooms.filter((room) => room.chatRoomNo !== chatRoomNo),
      messages: Object.fromEntries(
        Object.entries(state.messages).filter(([key]) => key !== chatRoomNo)
      ),
      cursors: Object.fromEntries(
        Object.entries(state.cursors).filter(([key]) => key !== chatRoomNo)
      ),
      hasMore: Object.fromEntries(
        Object.entries(state.hasMore).filter(([key]) => key !== chatRoomNo)
      ),
    })),
  removeGroupChatRoomsByRoomNo: (roomNo) =>
    set((state) => {
      const targetChatRoomNos = state.chatRooms
        .filter((room) => room.chatRoomType === 'GROUP' && room.roomNo === roomNo)
        .map((room) => room.chatRoomNo)

      return {
        chatRooms: state.chatRooms.filter(
          (room) => !(room.chatRoomType === 'GROUP' && room.roomNo === roomNo)
        ),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(([key]) => !targetChatRoomNos.includes(key))
        ),
        cursors: Object.fromEntries(
          Object.entries(state.cursors).filter(([key]) => !targetChatRoomNos.includes(key))
        ),
        hasMore: Object.fromEntries(
          Object.entries(state.hasMore).filter(([key]) => !targetChatRoomNos.includes(key))
        ),
      }
    }),
}))
