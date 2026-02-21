import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sseNotificationClient } from '@/services/chat/sseClient'
import { useChatStore } from '@/store/chatStore'
import { extractMessageRoomId, showChatNavigationToast } from '@/services/chat/chatNotification'
import type {
  MessageSentEvent,
  MessageRequestCreatedEvent,
  MessageRequestDecidedEvent,
} from '@/types/chat'
import { ConnectionStatus } from '@/types/chat'

/**
 * 채팅 관련 실시간 연결 관리 훅
 * - SSE: 로그인 후 항상 연결 유지 (앱 활성 상태)
 * - WebSocket: 채팅방 진입 시에만 연결 (ChatRoomPage에서 관리)
 * - Presence: 방 입장/퇴장 자동 관리
 */
export const useChatConnections = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    currentRoomId,
    addPendingRequest,
    removePendingRequest,
    setWsConnectionStatus,
    setSseConnected,
    updateRoom,
  } = useChatStore()

  // 공개 페이지는 비로그인 진입 구간이므로 SSE/WS를 절대 열지 않는다.
  // (이 구간에서 연결을 열면 presence가 잘못 기록될 수 있음)
  const isPublicRoute =
    location.pathname === '/' ||
    location.pathname === '/intro' ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/signup')

  // SSE는 "앱 활성(APP_ACTIVE)" 판단의 핵심 신호라서,
  // 인증된 비공개 페이지에서만 유지한다.
  useEffect(() => {
    if (isPublicRoute) {
      // 라우팅으로 공개 페이지에 들어온 경우,
      // 기존 연결이 살아있을 수 있으므로 명시적으로 끊어서 상태를 정리한다.
      sseNotificationClient.disconnect()
      setSseConnected(false)
      setWsConnectionStatus(ConnectionStatus.DISCONNECTED)
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.log('[Chat] No access token, skipping SSE connection')
      // 토큰이 없으면 서버가 식별할 수 없으므로 연결을 유지하지 않는다.
      sseNotificationClient.disconnect()
      setSseConnected(false)
      setWsConnectionStatus(ConnectionStatus.DISCONNECTED)
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
  }, [isPublicRoute, setSseConnected, setWsConnectionStatus])

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
      hasUnread: true,
    })

    // 이전 방식: SSE 수신마다 unreadCount 증가
    // incrementUnreadCount(event.roomId)

    showChatNavigationToast({
      title: `${event.senderName}님의 새 메시지`,
      description: event.content,
      icon: '💬',
      roomId: extractMessageRoomId(event as Record<string, any>),
      navigate,
      duration: 4000,
    })
  }

  // SSE 이벤트 핸들러: 채팅 요청 수신
  const handleSseRequestCreated = (event: MessageRequestCreatedEvent) => {
    console.log('[SSE] Chat request created:', event)

    addPendingRequest(event)

    showChatNavigationToast({
      title: `${event.senderName}님이 채팅 요청을 보냈습니다`,
      icon: '📩',
      roomId: extractMessageRoomId(event as Record<string, any>),
      navigate,
      duration: 4500,
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

    showChatNavigationToast({
      title: message,
      icon: event.decision === 'APPROVE' ? '✅' : '❌',
      roomId: extractMessageRoomId(event as Record<string, any>),
      navigate,
      duration: 4000,
    })

    // 수락된 경우 채팅방 목록 갱신 필요 (실제로는 refetch)
    if (event.decision === 'APPROVE') {
      // TODO: 채팅방 목록 갱신
    }
  }
}
