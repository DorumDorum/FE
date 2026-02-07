import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { loadMessages } from '@/services/chat/chatApi'
import { stompChatClient } from '@/services/chat/stompClient'
import type { ChatMessage } from '@/types/chat'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const ChatRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // 초기 로딩 플래그

  const {
    messagesByRoom,
    messageCursors,
    hasMoreMessages,
    setMessages,
    addMessage,
    prependMessages,
    setCurrentRoomId,
    resetUnreadCount,
    wsConnectionStatus,
  } = useChatStore()

  const currentRoomId = roomId // string 그대로 사용
  const messages = currentRoomId ? messagesByRoom.get(currentRoomId) || [] : []

  // 방 입장 시 초기화
  useEffect(() => {
    if (!currentRoomId) return

    setCurrentRoomId(currentRoomId)
    resetUnreadCount(currentRoomId)
    
    // 메시지 로드
    loadInitialMessages()

    // WebSocket 구독 및 Presence 신호
    const handleNewMessage = (message: any) => {
      console.log('[WebSocket] Received message:', message)
      
      // JWT 토큰에서 userId 추출
      const accessToken = localStorage.getItem('accessToken')
      let currentUserId: string | null = null
      
      if (accessToken) {
        try {
          // JWT 디코딩 (간단한 방식, 검증 없음)
          const base64Url = accessToken.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
          const payload = JSON.parse(jsonPayload)
          currentUserId = payload.id?.toString()
          console.log('[WebSocket] Current userId from token:', currentUserId)
        } catch (error) {
          console.error('[WebSocket] Failed to decode token:', error)
        }
      }
      
      // MessageSentEvent 구조: { messageId, roomId, senderId, senderName, content, messageType, sentAt }
      const senderId = message.senderId?.toString()
      console.log('[WebSocket] Message senderId:', senderId, 'currentUserId:', currentUserId)
      
      // 발신자가 본인인 경우 이미 낙관적 업데이트로 추가했으므로 무시
      if (currentUserId && senderId === currentUserId) {
        console.log('[WebSocket] Ignoring own message (already added)')
        return
      }
      
      const chatMessage: ChatMessage = {
        messageNo: message.messageId?.toString() || Date.now().toString(),
        messageRoomNo: currentRoomId,
        senderNo: senderId || '0',
        senderName: message.senderName || '알 수 없음',
        content: message.content,
        messageType: message.messageType,
        sentAt: message.sentAt,
      }
      
      console.log('[WebSocket] Adding message to chat:', chatMessage)
      addMessage(currentRoomId, chatMessage)
      scrollToBottom()
    }

    // WebSocket이 연결되어 있으면 구독
    if (stompChatClient.isConnected()) {
      stompChatClient.subscribeToRoom(currentRoomId, handleNewMessage)
      stompChatClient.sendEnterPresence(currentRoomId)
    }

    // Cleanup: 방 나갈 때
    return () => {
      if (stompChatClient.isConnected()) {
        stompChatClient.sendLeavePresence(currentRoomId)
        stompChatClient.unsubscribeFromRoom(currentRoomId)
      }
      setCurrentRoomId(null)
    }
  }, [currentRoomId])

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const loadInitialMessages = async () => {
    if (!currentRoomId) return

    try {
      setIsLoadingMessages(true)
      setIsInitialLoad(true)
      const data = await loadMessages(currentRoomId, undefined, 50)
      
      const chatMessages: ChatMessage[] = data.messages.map((msg) => ({
        messageNo: msg.messageNo,
        messageRoomNo: currentRoomId,
        senderNo: msg.senderNo,
        senderName: msg.senderName,
        content: msg.content,
        messageType: msg.messageType,
        sentAt: msg.sentAt,
        readCount: msg.readCount,
      }))

      // 메시지를 시간순으로 정렬 (오래된 것 → 최신 것)
      const sortedMessages = chatMessages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )

      setMessages(currentRoomId, sortedMessages, data.nextCursor, data.hasMore)
      
      // 초기 로드 후 스크롤을 맨 아래로 (즉시)
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
        }
        // 스크롤 완료 후 초기 로딩 플래그 해제
        setTimeout(() => {
          setIsInitialLoad(false)
        }, 300)
      }, 50)
    } catch (error) {
      console.error('Failed to load messages:', error)
      toast.error('메시지를 불러오는데 실패했습니다')
      setIsInitialLoad(false)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // 이전 메시지 로드 (무한 스크롤 위로)
  const loadMoreMessages = async () => {
    if (!currentRoomId || isLoadingMessages) return

    const cursor = messageCursors.get(currentRoomId)
    const hasMore = hasMoreMessages.get(currentRoomId)

    if (!hasMore || !cursor) {
      console.log('[ChatRoom] No more messages to load')
      return
    }

    try {
      setIsLoadingMessages(true)
      const data = await loadMessages(currentRoomId, cursor, 50)
      
      const chatMessages: ChatMessage[] = data.messages.map((msg) => ({
        messageNo: msg.messageNo,
        messageRoomNo: currentRoomId,
        senderNo: msg.senderNo,
        senderName: msg.senderName,
        content: msg.content,
        messageType: msg.messageType,
        sentAt: msg.sentAt,
        readCount: msg.readCount,
      }))

      // 메시지를 시간순으로 정렬
      const sortedMessages = chatMessages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )

      // 기존 메시지 앞에 추가
      prependMessages(currentRoomId, sortedMessages)
      
      // 커서 업데이트
      const currentMessages = messagesByRoom.get(currentRoomId) || []
      setMessages(currentRoomId, [...sortedMessages, ...currentMessages], data.nextCursor, data.hasMore)
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }

  // 스크롤 이벤트 핸들러 (상단 도달 시 이전 메시지 로드)
  const handleScroll = () => {
    // 초기 로딩 중에는 무시
    if (isInitialLoad) return
    
    if (!messagesContainerRef.current) return

    const { scrollTop } = messagesContainerRef.current

    // 스크롤이 상단에 가까우면 이전 메시지 로드
    if (scrollTop < 100 && !isLoadingMessages) {
      const hasMore = hasMoreMessages.get(currentRoomId || '')
      if (hasMore) {
        loadMoreMessages()
      }
    }
  }

  const handleSendMessage = async () => {
    if (!currentRoomId || !inputMessage.trim() || isSending) return

    if (!stompChatClient.isConnected()) {
      toast.error('연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    const content = inputMessage.trim()
    setInputMessage('')
    setIsSending(true)

    try {
      // WebSocket으로 메시지 전송
      stompChatClient.sendMessage(currentRoomId, content)
      
      // 로컬에 임시 메시지 추가 (낙관적 업데이트)
      // JWT 토큰에서 userId 추출
      const accessToken = localStorage.getItem('accessToken')
      let currentUserId = '0'
      
      if (accessToken) {
        try {
          const base64Url = accessToken.split('.')[1]
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          )
          const payload = JSON.parse(jsonPayload)
          currentUserId = payload.id?.toString() || '0'
        } catch (error) {
          console.error('Failed to decode token:', error)
        }
      }
      
      const tempMessage: ChatMessage = {
        messageNo: `temp-${Date.now()}`, // 임시 ID (문자열, temp 접두사)
        messageRoomNo: currentRoomId,
        senderNo: currentUserId,
        senderName: '나',
        content,
        messageType: 'TEXT',
        sentAt: new Date().toISOString(),
        isLocal: true,
      }
      
      addMessage(currentRoomId, tempMessage)
      scrollToBottom()
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('메시지 전송에 실패했습니다')
      setInputMessage(content) // 입력 복구
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatMessageTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm')
    } catch {
      return ''
    }
  }

  const formatMessageDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy년 M월 d일')
    } catch {
      return ''
    }
  }

  // 날짜 구분선 표시 여부 확인
  const shouldShowDateDivider = (index: number) => {
    if (index === 0) return true
    
    const currentDate = new Date(messages[index].sentAt).toDateString()
    const prevDate = new Date(messages[index - 1].sentAt).toDateString()
    
    return currentDate !== prevDate
  }

  if (!currentRoomId) {
    return <div>잘못된 접근입니다</div>
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/chats')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">채팅</h1>
        <div className="ml-auto">
          {wsConnectionStatus !== 'CONNECTED' && (
            <span className="text-xs text-orange-500">연결 중...</span>
          )}
        </div>
      </header>

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">메시지가 없습니다</p>
            <p className="text-xs mt-1">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 추가 메시지 로딩 인디케이터 (상단) */}
            {isLoadingMessages && (
              <div className="flex justify-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div key={message.messageNo}>
                {shouldShowDateDivider(index) && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatMessageDate(message.sentAt)}
                    </div>
                  </div>
                )}

                <div
                  className={`flex ${
                    message.isLocal ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.isLocal
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900'
                    } rounded-lg px-4 py-2 shadow-sm`}
                  >
                    {!message.isLocal && (
                      <p className="text-xs font-semibold mb-1 text-gray-600">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isLocal ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {formatMessageTime(message.sentAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 메시지 입력 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending}
            className={`p-3 rounded-lg transition-colors ${
              inputMessage.trim() && !isSending
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatRoomPage
