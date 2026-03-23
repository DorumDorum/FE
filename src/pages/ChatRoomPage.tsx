import { useEffect, useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import { Client } from '@stomp/stompjs'
import type { IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import toast from 'react-hot-toast'
import { ChevronLeft, Menu, X, LogOut, User, Users } from 'lucide-react'
import MessageBubble from '@/components/chat/MessageBubble'
import MessageInput from '@/components/chat/MessageInput'
import { getChatMessages, markAsRead, leaveChatRoom } from '@/services/chatApi'
import { useChatStore } from '@/store/chatStore'
import { API_BASE_URL } from '@/utils/api'
import apiClient from '@/services/apiClient'
import type { ChatMessage } from '@/types/chat'

const ChatRoomPage = () => {
  const { chatRoomNo } = useParams<{ chatRoomNo: string }>()
  const navigate = useNavigate()
  const { chatRooms, messages, cursors, hasMore, setMessages, prependMessages, appendMessage, updateRoomOnNewMessage, resetUnreadCount } =
    useChatStore()

  const currentRoom = chatRooms.find(r => r.chatRoomNo === chatRoomNo)
  const isDirect = currentRoom?.chatRoomType === 'DIRECT'
  const roomTitle = (() => {
    if (!currentRoom) return '채팅방'
    if (isDirect) {
      return currentRoom.partnerNickname ? `${currentRoom.partnerNickname}님과의 1:1 채팅` : '1:1 채팅'
    }
    return currentRoom.roomName ?? '그룹 채팅'
  })()

  const [myUserNo, setMyUserNo] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [connected, setConnected] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const stompClientRef = useRef<Client | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const roomMessages = messages[chatRoomNo!] ?? []
  const nextCursor = cursors[chatRoomNo!]
  const canLoadMore = hasMore[chatRoomNo!]

  // 현재 사용자 번호 로드
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/api/users/profile/me')
        setMyUserNo(res.data?.userNo ?? '')
      } catch {
        // 무시
      }
    }
    void fetchProfile()
  }, [])

  // 초기 메시지 로드 + 입장 시 읽음 처리 및 카운트 리셋
  useEffect(() => {
    if (!chatRoomNo) return

    resetUnreadCount(chatRoomNo)

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await getChatMessages(chatRoomNo)
        const { items: msgs, nextCursor, hasNext } = res.data
        setMessages(chatRoomNo, msgs, nextCursor, hasNext)
      } catch (e: unknown) {
        const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code
        if (code === 'NOT_CHAT_ROOM_MEMBER') {
          toast.error('채팅방 멤버가 아닙니다.')
          navigate('/chats')
        } else {
          toast.error('메시지를 불러오지 못했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    void fetchMessages()
    void markAsRead(chatRoomNo).catch(() => {})
  }, [chatRoomNo])

  // 초기 로드 완료 시 하단 스크롤
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [loading])

  // STOMP 연결
  useEffect(() => {
    if (!chatRoomNo) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)

        client.subscribe(`/topic/chat-room/${chatRoomNo}`, (msg: IMessage) => {
          const message: ChatMessage = JSON.parse(msg.body)
          appendMessage(chatRoomNo, message)
          updateRoomOnNewMessage(chatRoomNo, message)

          // 채팅방을 보고 있는 중이면 즉시 읽음 처리
          if (document.visibilityState === 'visible') {
            void markAsRead(chatRoomNo).catch(() => {})
          }

          // 하단 근처에 있을 때만 자동 스크롤
          const container = messagesContainerRef.current
          if (container) {
            const isNearBottom =
              container.scrollHeight - container.scrollTop - container.clientHeight < 150
            if (isNearBottom) {
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
            }
          }
        })

        client.subscribe('/user/queue/errors', (msg: IMessage) => {
          toast.error(msg.body || 'WebSocket 오류가 발생했습니다.')
        })
      },
      onStompError: () => setConnected(false),
      onDisconnect: () => setConnected(false),
    })

    client.activate()
    stompClientRef.current = client

    return () => {
      client.deactivate()
      stompClientRef.current = null
    }
  }, [chatRoomNo])

  // 포그라운드 복귀 시 읽음 처리
  useEffect(() => {
    if (!chatRoomNo) return
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void markAsRead(chatRoomNo).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [chatRoomNo])

  // 이전 메시지 더 불러오기
  const handleLoadMore = useCallback(async () => {
    if (!chatRoomNo || loadingMore || !canLoadMore || !nextCursor) return
    const container = messagesContainerRef.current
    const prevScrollHeight = container?.scrollHeight ?? 0

    setLoadingMore(true)
    try {
      const res = await getChatMessages(chatRoomNo, nextCursor)
      const { items: msgs, nextCursor: newCursor, hasNext } = res.data
      prependMessages(chatRoomNo, msgs, newCursor, hasNext)

      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight
        }
      })
    } catch {
      toast.error('이전 메시지를 불러오지 못했습니다.')
    } finally {
      setLoadingMore(false)
    }
  }, [chatRoomNo, loadingMore, canLoadMore, nextCursor])

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    if (container.scrollTop < 60) void handleLoadMore()
  }, [handleLoadMore])

  // 메시지 전송
  const handleSend = (content: string) => {
    const client = stompClientRef.current
    if (!client?.connected) {
      toast.error('연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    try {
      client.publish({
        destination: `/app/chat-room/${chatRoomNo}/send`,
        body: JSON.stringify({ content }),
      })
    } catch {
      toast.error('메시지 전송에 실패했습니다.')
    }
  }

  // 채팅방 나가기
  const handleLeave = async () => {
    if (!chatRoomNo) return
    try {
      await leaveChatRoom(chatRoomNo)
      toast.success('채팅방을 나갔습니다.')
      navigate('/chats')
    } catch (e: unknown) {
      const code = (e as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'HOST_CANNOT_LEAVE') {
        toast.error('방장은 다른 멤버가 있을 때 나가기가 불가능합니다.')
      } else {
        toast.error('나가기에 실패했습니다.')
      }
    } finally {
      setShowLeaveConfirm(false)
      setShowInfoPanel(false)
    }
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: 'var(--vh, 100dvh)' }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 px-2 py-3 flex items-center flex-shrink-0">
        <button onClick={() => navigate('/chats')} className="p-2">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1 flex flex-col items-center">
          <span className="font-semibold text-gray-900 text-sm truncate max-w-[180px]">{roomTitle}</span>
          {!connected && <span className="text-xs text-gray-400">연결 중...</span>}
        </div>
        <button
          onClick={() => setShowInfoPanel(true)}
          className="p-2 text-gray-600"
          aria-label="채팅방 정보"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-2"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {loadingMore && (
          <div className="text-center py-2 text-xs text-gray-400">불러오는 중...</div>
        )}
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#3072E1] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">메시지를 불러오는 중...</p>
            </div>
          </div>
        ) : (
          roomMessages.map((msg, index) => {
            const nextMsg = roomMessages[index + 1]
            const showTime =
              !nextMsg ||
              format(new Date(msg.sentAt), 'HH:mm') !== format(new Date(nextMsg.sentAt), 'HH:mm')
            return (
              <MessageBubble key={msg.messageNo} message={msg} myUserNo={myUserNo} showTime={showTime} />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <MessageInput onSend={handleSend} disabled={!connected} />

      {/* 채팅방 정보 사이드 패널 */}
      {showInfoPanel && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            style={{ height: 'var(--vh, 100dvh)' }}
            onClick={() => { setShowInfoPanel(false); setShowLeaveConfirm(false) }}
          />
          {/* 슬라이드 패널 */}
          <div
            className="fixed top-0 right-0 bg-white z-50 flex flex-col shadow-2xl"
            style={{ height: 'var(--vh, 100dvh)', width: 'min(18rem, 85vw)' }}
          >
            {/* 패널 헤더 */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <span className="font-semibold text-gray-900">채팅방 정보</span>
              <button
                onClick={() => { setShowInfoPanel(false); setShowLeaveConfirm(false) }}
                className="p-1 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 패널 바디 */}
            <div className="flex-1 overflow-y-auto py-4 px-4">
              {isDirect && currentRoom?.partnerNickname ? (
                <>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">대화 상대</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{currentRoom.partnerNickname}</p>
                      <p className="text-xs text-gray-400">1:1 채팅 상대</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">그룹 채팅</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{currentRoom?.roomName ?? '그룹 채팅'}</p>
                      <p className="text-xs text-gray-400">그룹 채팅방</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 패널 푸터 — 나가기 */}
            <div className="border-t border-gray-100 px-4 py-4">
              {showLeaveConfirm ? (
                <div>
                  <p className="text-sm text-gray-700 mb-3">정말 채팅방을 나가시겠습니까?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowLeaveConfirm(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => void handleLeave()}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-sm font-medium text-white"
                    >
                      나가기
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">채팅방 나가기</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ChatRoomPage
