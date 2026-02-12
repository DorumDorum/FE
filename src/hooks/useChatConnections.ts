import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { stompChatClient } from '@/services/chat/stompClient'
import { sseNotificationClient } from '@/services/chat/sseClient'
import { useChatStore } from '@/store/chatStore'
import toast from 'react-hot-toast'
import type {
  MessageSentEvent,
  MessageRequestCreatedEvent,
  MessageRequestDecidedEvent,
  ChatMessage,
} from '@/types/chat'

/**
 * 채팅 관련 실시간 연결 관리 훅
 * - SSE: 로그인 후 항상 연결 유지 (앱 활성 상태)
 * - WebSocket: 필요 시 연결 (메모리 절약)
 * - Presence: 방 입장/퇴장 자동 관리
 */
export const useChatConnections = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    currentRoomId,
    addMessage,
    addPendingRequest,
    removePendingRequest,
    setWsConnectionStatus,
    setSseConnected,
    updateRoom,
    incrementUnreadCount,
  } = useChatStore()

  // SSE 연결 및 이벤트 핸들러 등록
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.log('[Chat] No access token, skipping SSE connection')
      return
    }

    console.log('[Chat] Initializing SSE connection...')
    sseNotificationClient.connect()
    setSseConnected(true)

    // SSE 이벤트 핸들러 등록
    const unsubscribeChatMessage = sseNotificationClient.onChatMessage(
      handleSseChatMessage
    )
    const unsubscribeRequestCreated = sseNotificationClient.onChatRequestCreated(
      handleSseRequestCreated
    )
    const unsubscribeRequestDecided = sseNotificationClient.onChatRequestDecided(
      handleSseRequestDecided
    )

    return () => {
      console.log('[Chat] Disconnecting SSE...')
      unsubscribeChatMessage()
      unsubscribeRequestCreated()
      unsubscribeRequestDecided()
      sseNotificationClient.disconnect()
      setSseConnected(false)
    }
  }, [])

  // WebSocket 연결 관리
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.log('[Chat] No access token, skipping WebSocket connection')
      return
    }

    console.log('[Chat] Initializing WebSocket connection...')
    stompChatClient.connect()

    // 연결 상태 모니터링
    const unsubscribe = stompChatClient.onConnectionStatusChange((status) => {
      setWsConnectionStatus(status)
      console.log('[Chat] WebSocket status:', status)
    })

    return () => {
      console.log('[Chat] Disconnecting WebSocket...')
      unsubscribe()
      stompChatClient.disconnect()
    }
  }, [])

  // SSE 이벤트 핸들러: 채팅 메시지 (방 밖에서 받음)
  const handleSseChatMessage = (event: MessageSentEvent) => {
    console.log('[SSE] Chat message received:', event)

    // 현재 해당 방에 있으면 SSE로 받지 않고 WebSocket으로 받음
    if (currentRoomId === event.roomId) {
      return
    }

    // 방 목록에서 lastMessage 업데이트
    updateRoom(event.roomId, {
      lastMessage: event.content,
      lastMessageAt: event.sentAt,
    })

    // 읽지 않은 메시지 카운트 증가
    incrementUnreadCount(event.roomId)

    // 알림 표시
    toast('새로운 메시지가 도착했습니다', {
      icon: '💬',
      duration: 3000,
      position: 'top-center',
    })
  }

  // SSE 이벤트 핸들러: 채팅 요청 수신
  const handleSseRequestCreated = (event: MessageRequestCreatedEvent) => {
    console.log('[SSE] Chat request created:', event)

    addPendingRequest(event)

    toast.success(`${event.senderName}님이 채팅 요청을 보냈습니다`, {
      duration: 4000,
      position: 'top-center',
    })
  }

  // SSE 이벤트 핸들러: 채팅 요청 결정 (수락/거절)
  const handleSseRequestDecided = (event: MessageRequestDecidedEvent) => {
    console.log('[SSE] Chat request decided:', event)

    removePendingRequest(event.messageRequestNo)

    const message =
      event.decision === 'APPROVE'
        ? '채팅 요청이 수락되었습니다!'
        : '채팅 요청이 거절되었습니다.'

    toast(message, {
      icon: event.decision === 'APPROVE' ? '✅' : '❌',
      duration: 3000,
      position: 'top-center',
    })

    // 수락된 경우 채팅방 목록 갱신 필요 (실제로는 refetch)
    if (event.decision === 'APPROVE') {
      // TODO: 채팅방 목록 갱신
    }
  }
}
