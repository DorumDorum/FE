import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import {
  loadMessages,
  loadMessageRoomParticipants,
  decideChatRequest,
  leaveMessageRoom,
  deleteMessageRoom,
} from '@/services/chat/chatApi'
import { stompChatClient } from '@/services/chat/stompClient'
import type { ChatMessage, ChatParticipant, MessageRoomReadStatePayload } from '@/types/chat'
import { MessageRoomStatus, MessageRequestDecision, MessageType } from '@/types/chat'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ui/ConfirmModal'

const ChatRoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  // 채팅방 화면 체류 중 앱 레벨 ping 타이머를 보관한다.
  // (STOMP heartbeat와 별개로 presence TTL 갱신 목적)
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const [inputMessage, setInputMessage] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true) // 초기 로딩 플래그
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const {
    rooms,
    messagesByRoom,
    messageCursors,
    hasMoreMessages,
    participantsByRoom,
    participantReadStatesByRoom,
    setMessages,
    addMessage,
    prependMessages,
    replaceMessage,
    setRoomParticipants,
    mergeRoomReadState,
    advanceReadStateForInRoomParticipants,
    setCurrentRoomId,
    resetUnreadCount,
    wsConnectionStatus,
    setWsConnectionStatus,
    updateRoom,
    removeRoom,
  } = useChatStore()

  const currentRoomId = roomId // string 그대로 사용
  const messages = currentRoomId ? messagesByRoom.get(currentRoomId) || [] : []
  // 이 방 참여자 정보 캐시 (입장/새로고침 때 해당 방만 갱신)
  const participantMap = currentRoomId ? participantsByRoom.get(currentRoomId) : undefined
  const participantReadStateMap = currentRoomId
    ? participantReadStatesByRoom.get(currentRoomId)
    : undefined
  const currentRoom = currentRoomId ? rooms.find((room) => room.messageRoomNo === currentRoomId) : null
  const isApproved = currentRoom?.roomStatus === MessageRoomStatus.APPROVED
  const isRequested = currentRoom?.roomStatus === MessageRoomStatus.REQUESTED
  const isRequester = currentRoom?.isRequester === true
  const canSendMessage = isApproved

  // 방 입장 시 초기화 + WebSocket 세션 생성.
  // 정책: WS는 채팅방 화면에 있을 때만 유지한다.
  useEffect(() => {
    if (!currentRoomId) return

    setCurrentRoomId(currentRoomId)
    resetUnreadCount(currentRoomId)
    
    // WebSocket 연결 시작
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.error('[ChatRoom] No access token, cannot connect WebSocket')
      return
    }

    console.log('[ChatRoom] Connecting WebSocket...')

    // 연결 상태를 스토어에 반영 (채팅방 내부에서만 관리)
    const unsubscribeStatus = stompChatClient.onConnectionStatusChange((status) => {
      setWsConnectionStatus(status)
      console.log('[ChatRoom] WebSocket status:', status)
    })

    stompChatClient.connect()

    // 서버 이벤트(MessageSentEvent)를 화면용 ChatMessage 형태로 변환.
    // 본인 메시지는 낙관적 업데이트가 이미 들어가 있으므로 중복 반영하지 않는다.
    const handleNewMessage = (message: any) => {
      console.log('[WebSocket] Received message:', message)
      
      // JWT 토큰에서 userId 추출
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

      const chatMessage: ChatMessage = {
        messageNo: message.messageId?.toString() || Date.now().toString(),
        messageRoomNo: currentRoomId,
        senderNo: senderId || '0',
        senderName: message.senderName || '알 수 없음',
        content: message.content,
        messageType: message.messageType,
        sentAt: message.sentAt,
      }

      if (currentUserId && senderId === currentUserId) {
        const currentMessages = useChatStore.getState().messagesByRoom.get(currentRoomId) || []
        const tempCandidate = [...currentMessages]
          .reverse()
          .find(
            (candidate) =>
              candidate.isLocal === true &&
              candidate.messageNo.startsWith('temp-') &&
              candidate.senderNo === currentUserId &&
              candidate.content === chatMessage.content
          )

        if (tempCandidate) {
          replaceMessage(currentRoomId, tempCandidate.messageNo, {
            ...chatMessage,
            isLocal: true,
          })
        } else {
          addMessage(currentRoomId, {
            ...chatMessage,
            isLocal: true,
          })
        }
      } else {
        console.log('[WebSocket] Adding message to chat:', chatMessage)
        addMessage(currentRoomId, chatMessage)
      }

      advanceReadStateForInRoomParticipants(
        currentRoomId,
        chatMessage.messageNo,
        chatMessage.sentAt
      )
      scrollToBottom()
    }

    // connect() 직후 즉시 connected가 아닐 수 있어 polling으로 구독 시점을 맞춘다.
    const handleReadStateChanged = (payload: MessageRoomReadStatePayload) => {
      if (payload.messageRoomNo !== currentRoomId) return
      mergeRoomReadState(currentRoomId, payload.participants)
    }

    let isCancelled = false
    let subscribeRetryTimeout: ReturnType<typeof setTimeout> | null = null

    const checkConnectionAndSubscribe = async () => {
      if (isCancelled) return

      if (stompChatClient.isConnected()) {
        console.log('[ChatRoom] WebSocket connected, subscribing to room...')
        stompChatClient.subscribeToRoom(currentRoomId, handleNewMessage)
        stompChatClient.subscribeToRoomReadState(currentRoomId, handleReadStateChanged)

        try {
          await loadRoomData(currentRoomId)
        } catch (error) {
          console.error('[ChatRoom] Failed to load initial room data:', error)
        }
        if (isCancelled) return

        const lastRead = getLastReadCursor(currentRoomId)
        stompChatClient.sendEnterPresence(
          currentRoomId,
          lastRead.lastReadMessageId,
          lastRead.lastReadSentAt
        )
        
        // 앱 레벨 ping: 사용자가 "읽기만" 하는 상태에서도
        // ws 활동(onWsActivity)이 기록되도록 60초마다 전송한다.
        pingIntervalRef.current = setInterval(() => {
          if (stompChatClient.isConnected()) {
            stompChatClient.sendPing()
          }
        }, 60000)
      } else {
        // 연결 대기
        subscribeRetryTimeout = setTimeout(() => {
          void checkConnectionAndSubscribe()
        }, 500)
      }
    }

    void checkConnectionAndSubscribe()

    // Cleanup: 방 이탈 시 presence leave 전송 후 WS를 완전히 종료한다.
    // (다른 화면에서 불필요한 wsConnected 상태가 남지 않도록)
    return () => {
      console.log('[ChatRoom] Leaving room, cleaning up...')

      isCancelled = true
      if (subscribeRetryTimeout) {
        clearTimeout(subscribeRetryTimeout)
        subscribeRetryTimeout = null
      }

      unsubscribeStatus()

      // Ping interval 정리
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current)
        pingIntervalRef.current = null
      }

      if (stompChatClient.isConnected()) {
        const lastRead = getLastReadCursor(currentRoomId)
        stompChatClient.sendLeavePresence(
          currentRoomId,
          lastRead.lastReadMessageId,
          lastRead.lastReadSentAt
        )
        stompChatClient.unsubscribeFromRoom(currentRoomId)
        stompChatClient.disconnect()
        console.log('[ChatRoom] WebSocket disconnected')
      }
      
      setCurrentRoomId(null)
    }
  }, [
    advanceReadStateForInRoomParticipants,
    currentRoomId,
    mergeRoomReadState,
    resetUnreadCount,
    setCurrentRoomId,
    setWsConnectionStatus,
  ])

  const prefetchProfileImages = (participants: ChatParticipant[]) => {
    participants.forEach((participant) => {
      // 현재는 대부분 null이지만, URL이 생기면 브라우저 캐시에 미리 적재한다.
      if (!participant.profileImageUrl) return
      const image = new Image()
      image.src = participant.profileImageUrl
    })
  }

  const refreshRoomParticipants = async (targetRoomId: string) => {
    try {
      const participants = await loadMessageRoomParticipants(targetRoomId)
      const mappedParticipants: ChatParticipant[] = participants.map((participant) => ({
        userId: participant.userId,
        name: participant.name,
        studentNo: participant.studentNo,
        major: participant.major,
        age: participant.age,
        profileImageUrl: participant.profileImageUrl,
      }))

      // roomId별 캐시를 통째로 교체해 stale 데이터가 남지 않게 한다.
      setRoomParticipants(targetRoomId, mappedParticipants)
      prefetchProfileImages(mappedParticipants)
    } catch (error) {
      console.error('Failed to load room participants:', error)
    }
  }

  const loadRoomData = async (targetRoomId: string) => {
    // 네트워크 대기 시간을 줄이기 위해 병렬 호출
    await Promise.all([
      loadInitialMessages(targetRoomId),
      refreshRoomParticipants(targetRoomId),
    ])
  }

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const loadInitialMessages = async (targetRoomId: string) => {
    if (!targetRoomId) return

    try {
      setIsLoadingMessages(true)
      setIsInitialLoad(true)
      const data = await loadMessages(targetRoomId, undefined, 50)
      
      const chatMessages: ChatMessage[] = data.messages.map((msg) => ({
        messageNo: msg.messageNo,
        messageRoomNo: targetRoomId,
        senderNo: msg.senderNo,
        senderName: msg.senderName,
        content: msg.content,
        messageType: msg.messageType,
        sentAt: msg.sentAt,
      }))

      // 메시지를 시간순으로 정렬 (오래된 것 → 최신 것)
      const sortedMessages = chatMessages.sort((a, b) => 
        new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )

      setMessages(targetRoomId, sortedMessages, data.nextCursor, data.hasMore)
      
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
    if (!canSendMessage) {
      toast.error('채팅 요청이 수락되어야 메시지를 보낼 수 있습니다.')
      return
    }

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
        messageType: MessageType.TEXT,
        sentAt: toLocalDateTimeString(new Date()),
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

  const handleDecision = async (decision: MessageRequestDecision) => {
    if (!currentRoom?.messageRequestNo) {
      toast.error('요청 정보를 찾을 수 없습니다.')
      return
    }

    try {
      await decideChatRequest(currentRoom.messageRequestNo, decision)
      if (decision === MessageRequestDecision.APPROVE) {
        updateRoom(currentRoom.messageRoomNo, { roomStatus: MessageRoomStatus.APPROVED })
        toast.success('채팅 요청을 수락했습니다.')
      } else {
        updateRoom(currentRoom.messageRoomNo, { roomStatus: MessageRoomStatus.REJECTED })
        toast.success('채팅 요청을 거절했습니다.')
      }
    } catch (error) {
      console.error('Failed to decide chat request:', error)
      toast.error('요청 처리에 실패했습니다.')
    }
  }

  const handleLeaveRoom = async () => {
    if (!currentRoomId || isActionLoading) return
    try {
      setIsActionLoading(true)
      await leaveMessageRoom(currentRoomId)
      removeRoom(currentRoomId)
      toast.success('채팅방을 나갔습니다.')
      navigate('/chats')
    } catch (error) {
      console.error('Failed to leave room:', error)
      toast.error('채팅방 나가기에 실패했습니다.')
    } finally {
      setIsActionLoading(false)
      setShowLeaveModal(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!currentRoomId || isActionLoading) return
    try {
      setIsActionLoading(true)
      await deleteMessageRoom(currentRoomId)
      removeRoom(currentRoomId)
      toast.success('채팅방을 삭제했습니다.')
      navigate('/chats')
    } catch (error) {
      console.error('Failed to delete room:', error)
      toast.error('채팅방 삭제에 실패했습니다.')
    } finally {
      setIsActionLoading(false)
      setShowDeleteModal(false)
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

  const unreadCountByMessageId = useMemo(() => {
    if (!participantMap || participantMap.size === 0) {
      return new Map<string, number>()
    }
    const counts = new Map<string, number>()
    const participants = Array.from(participantMap.keys()).map((userId) =>
      participantReadStateMap?.get(userId) || {
        userId,
        isInMessageRoom: false,
        lastReadMessageId: null,
        lastReadSentAt: null,
      }
    )

    messages.forEach((message) => {
      const readParticipants = participants.reduce((acc, participantState) => {
        if (hasReadMessage(participantState, message)) {
          return acc + 1
        }
        return acc
      }, 0)
      counts.set(message.messageNo, participants.length - readParticipants)
    })

    return counts
  }, [messages, participantMap, participantReadStateMap])

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
        <div className="ml-auto flex items-center gap-2">
          {wsConnectionStatus !== 'CONNECTED' && (
            <span className="text-xs text-orange-500">연결 중...</span>
          )}
          <button
            onClick={() => setShowLeaveModal(true)}
            className="text-xs text-gray-600 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50"
          >
            나가기
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="text-xs text-red-600 border border-red-300 rounded-lg px-2 py-1 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </header>

      {/* 메시지 목록 */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isRequested && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-800">
            {isRequester
              ? '채팅 요청을 걸었습니다. 수락될 때까지 메시지를 보낼 수 없습니다.'
              : '채팅 요청을 받았습니다. 수락하시겠습니까?'}
          </div>
        )}
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
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600">
                          {participantMap?.get(message.senderNo)?.name || message.senderName}
                        </span>
                        {/* studentNo는 확정 방에서만 내려오므로, null일 때도 공간을 유지해 레이아웃을 고정한다. */}
                        <span className="inline-block min-w-[72px] text-xs text-gray-400">
                          {participantMap?.get(message.senderNo)?.studentNo || '\u00A0'}
                        </span>
                      </div>
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
                      {message.isLocal && (unreadCountByMessageId.get(message.messageNo) || 0) > 0 && (
                        <span className="ml-2">
                          안읽음 {unreadCountByMessageId.get(message.messageNo)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 요청 수락/거절 버튼 (수신자) */}
      {isRequested && !isRequester && (
        <div className="bg-white border-t border-gray-200 px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => handleDecision(MessageRequestDecision.REJECT)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              거절
            </button>
            <button
              onClick={() => handleDecision(MessageRequestDecision.APPROVE)}
              className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600"
            >
              수락
            </button>
          </div>
        </div>
      )}

      {/* 메시지 입력 */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={canSendMessage ? '메시지를 입력하세요...' : '요청 수락 후 메시지를 보낼 수 있습니다.'}
            rows={1}
            disabled={!canSendMessage}
            className={`flex-1 resize-none border rounded-lg px-4 py-2 text-sm focus:outline-none ${
              canSendMessage
                ? 'border-gray-300 focus:border-blue-500'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
            style={{ maxHeight: '100px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSending || !canSendMessage}
            className={`p-3 rounded-lg transition-colors ${
              inputMessage.trim() && !isSending && canSendMessage
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLeaveModal}
        title="채팅방 나가기"
        message="이 채팅방을 나가시겠습니까?"
        confirmText={isActionLoading ? '처리 중...' : '나가기'}
        onConfirm={handleLeaveRoom}
        onCancel={() => setShowLeaveModal(false)}
        confirmButtonColor="bg-gray-700 hover:bg-gray-800"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="채팅방 삭제"
        message="이 채팅방을 삭제하시겠습니까? 복구할 수 없습니다."
        confirmText={isActionLoading ? '처리 중...' : '삭제'}
        onConfirm={handleDeleteRoom}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  )
}

export default ChatRoomPage

const hasReadMessage = (
  participantState: {
    isInMessageRoom: boolean
    lastReadMessageId: string | null
    lastReadSentAt: string | null
  },
  message: ChatMessage
): boolean => {
  if (participantState.isInMessageRoom) {
    return true
  }

  const { lastReadMessageId, lastReadSentAt } = participantState
  if (!lastReadSentAt) {
    return false
  }

  // 임시 메시지는 서버 ID/시간으로 정규화되기 전까지
  // in-room 참여자 외에는 읽지 않은 것으로 본다.
  if (message.messageNo.startsWith('temp-')) {
    return false
  }

  const messageSentAtMillis = toComparableMillis(message.sentAt)
  const lastReadSentAtMillis = toComparableMillis(lastReadSentAt)

  if (messageSentAtMillis < lastReadSentAtMillis) {
    return true
  }
  if (messageSentAtMillis > lastReadSentAtMillis) {
    return false
  }

  if (!lastReadMessageId) {
    return false
  }
  return message.messageNo <= lastReadMessageId
}

const getLastReadCursor = (
  targetRoomId: string
): { lastReadMessageId: string | null; lastReadSentAt: string | null } => {
  const messages = useChatStore.getState().messagesByRoom.get(targetRoomId) || []
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    if (!message.messageNo.startsWith('temp-')) {
      return {
        lastReadMessageId: message.messageNo,
        lastReadSentAt: message.sentAt,
      }
    }
  }
  return {
    lastReadMessageId: null,
    lastReadSentAt: null,
  }
}

const toComparableMillis = (value: string): number => {
  const millis = Date.parse(value)
  if (!Number.isNaN(millis)) {
    return millis
  }
  return 0
}

const toLocalDateTimeString = (date: Date): string => {
  const pad = (value: number, length: number = 2) => value.toString().padStart(length, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}
