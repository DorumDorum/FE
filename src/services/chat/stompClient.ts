import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import type {
  SendMessageSocketRequest,
  ReceiveMessageSocketResponse,
  PresenceSignalRequest,
  MessageRoomReadStatePayload,
} from '@/types/chat'
import { ConnectionStatus } from '@/types/chat'

type MessageHandler = (message: ReceiveMessageSocketResponse) => void
type ReadStateHandler = (payload: MessageRoomReadStatePayload) => void
type ConnectionStatusHandler = (status: ConnectionStatus) => void

class StompChatClient {
  private client: Client | null = null
  private messageSubscriptions: Map<string, StompSubscription> = new Map() // number → string
  private readStateSubscriptions: Map<string, StompSubscription> = new Map() // number → string
  private messageHandlers: Map<string, MessageHandler[]> = new Map() // number → string
  private readStateHandlers: Map<string, ReadStateHandler[]> = new Map() // number → string
  private connectionStatusHandlers: ConnectionStatusHandler[] = []
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000

  /**
   * WebSocket 연결 초기화
   */
  connect(): void {
    if (this.client?.active) {
      console.warn('[STOMP] Already connected')
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.error('[STOMP] No access token found')
      this.updateConnectionStatus(ConnectionStatus.ERROR)
      return
    }

    const wsUrl = import.meta.env.VITE_WS_BASE_URL || 'http://localhost:8080'
    const endpoint = `${wsUrl}/ws`

    this.client = new Client({
      webSocketFactory: () => new SockJS(endpoint) as any,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: this.reconnectDelay,
      // 백엔드 WebSocketConfig(25s/25s)와 동일하게 맞춘다.
      // 이 heartbeat는 프로토콜 생존 신호이며 presence ping을 대체하지 않는다.
      heartbeatIncoming: 25000,
      heartbeatOutgoing: 25000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('[STOMP Debug]', str)
        }
      },
      onConnect: (frame: IFrame) => {
        console.log('[STOMP] Connected:', frame)
        this.reconnectAttempts = 0
        this.updateConnectionStatus(ConnectionStatus.CONNECTED)
        
        // 재연결 시 기존 구독 복원
        this.restoreSubscriptions()
      },
      onStompError: (frame: IFrame) => {
        console.error('[STOMP] Error:', frame.headers['message'])
        this.updateConnectionStatus(ConnectionStatus.ERROR)
      },
      onWebSocketClose: () => {
        console.warn('[STOMP] WebSocket closed')
        this.updateConnectionStatus(ConnectionStatus.DISCONNECTED)
        
        // 재연결 시도
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`[STOMP] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        }
      },
    })

    this.updateConnectionStatus(ConnectionStatus.CONNECTING)
    this.client.activate()
  }

  /**
   * WebSocket 연결 해제
   */
  disconnect(): void {
    if (this.client?.active) {
      this.messageSubscriptions.forEach((sub) => sub.unsubscribe())
      this.readStateSubscriptions.forEach((sub) => sub.unsubscribe())
      this.messageSubscriptions.clear()
      this.readStateSubscriptions.clear()
      this.client.deactivate()
      this.client = null
      this.updateConnectionStatus(ConnectionStatus.DISCONNECTED)
      console.log('[STOMP] Disconnected')
    }
  }

  /**
   * 특정 채팅방 구독
   */
  subscribeToRoom(roomId: string, handler: MessageHandler): void { // number → string
    if (!this.client?.connected) {
      console.warn('[STOMP] Not connected, cannot subscribe to room', roomId)
      return
    }

    // 이미 구독 중이면 핸들러만 추가
    if (this.messageSubscriptions.has(roomId)) {
      this.addMessageHandler(roomId, handler)
      console.log('[STOMP] Already subscribed to room', roomId, ', added handler')
      return
    }

    const destination = `/sub/rooms/${roomId}`
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const data: ReceiveMessageSocketResponse = JSON.parse(message.body)
        this.notifyHandlers(roomId, data)
      } catch (error) {
        console.error('[STOMP] Failed to parse message:', error)
      }
    })

    this.messageSubscriptions.set(roomId, subscription)
    this.addMessageHandler(roomId, handler)
    console.log('[STOMP] Subscribed to room', roomId)
  }

  subscribeToRoomReadState(roomId: string, handler: ReadStateHandler): void {
    if (!this.client?.connected) {
      console.warn('[STOMP] Not connected, cannot subscribe to room read-state', roomId)
      return
    }

    if (this.readStateSubscriptions.has(roomId)) {
      this.addReadStateHandler(roomId, handler)
      console.log('[STOMP] Already subscribed to room read-state', roomId, ', added handler')
      return
    }

    const destination = `/sub/rooms/${roomId}/read-state`
    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      try {
        const data: MessageRoomReadStatePayload = JSON.parse(message.body)
        this.notifyReadStateHandlers(roomId, data)
      } catch (error) {
        console.error('[STOMP] Failed to parse read-state payload:', error)
      }
    })

    this.readStateSubscriptions.set(roomId, subscription)
    this.addReadStateHandler(roomId, handler)
    console.log('[STOMP] Subscribed to room read-state', roomId)
  }

  /**
   * 채팅방 구독 해제
   */
  unsubscribeFromRoom(roomId: string): void { // number → string
    const messageSubscription = this.messageSubscriptions.get(roomId)
    if (messageSubscription) {
      messageSubscription.unsubscribe()
      this.messageSubscriptions.delete(roomId)
      this.messageHandlers.delete(roomId)
      console.log('[STOMP] Unsubscribed from room', roomId)
    }

    const readStateSubscription = this.readStateSubscriptions.get(roomId)
    if (readStateSubscription) {
      readStateSubscription.unsubscribe()
      this.readStateSubscriptions.delete(roomId)
      this.readStateHandlers.delete(roomId)
      console.log('[STOMP] Unsubscribed from room read-state', roomId)
    }
  }

  /**
   * 메시지 전송
   * SEND /pub/rooms/{roomId}
   */
  sendMessage(roomId: string, content: string): void { // number → string
    if (!this.client?.connected) {
      console.error('[STOMP] Not connected, cannot send message')
      throw new Error('WebSocket is not connected')
    }

    const destination = `/pub/rooms/${roomId}`
    const request: SendMessageSocketRequest = { content }
    
    this.client.publish({
      destination,
      body: JSON.stringify(request),
    })

    console.log('[STOMP] Message sent to room', roomId)
  }

  /**
   * 채팅방 입장 신호 전송
   * SEND /pub/presence/enter
   */
  sendEnterPresence(
    roomId: string,
    lastReadMessageId: string | null,
    lastReadSentAt: string | null
  ): void { // number → string
    if (!this.client?.connected) {
      console.warn('[STOMP] Not connected, cannot send enter presence')
      return
    }

    const request: PresenceSignalRequest = {
      messageRoomNo: roomId,
      lastReadMessageId,
      lastReadSentAt,
    }
    this.client.publish({
      destination: '/pub/presence/enter',
      body: JSON.stringify(request),
    })

    console.log('[STOMP] Presence enter sent for room', roomId)
  }

  /**
   * 채팅방 퇴장 신호 전송
   * SEND /pub/presence/leave
   */
  sendLeavePresence(
    roomId: string,
    lastReadMessageId: string | null,
    lastReadSentAt: string | null
  ): void { // number → string
    if (!this.client?.connected) {
      console.warn('[STOMP] Not connected, cannot send leave presence')
      return
    }

    const request: PresenceSignalRequest = {
      messageRoomNo: roomId,
      lastReadMessageId,
      lastReadSentAt,
    }
    this.client.publish({
      destination: '/pub/presence/leave',
      body: JSON.stringify(request),
    })

    console.log('[STOMP] Presence leave sent for room', roomId)
  }

  /**
   * Presence ping 전송 (채팅방에서 활동 신호)
   * SEND /pub/presence/ping
   *
   * 주의:
   * - STOMP heartbeat와 목적이 다름
   * - heartbeat: 연결 생존 확인
   * - app-level ping: onWsActivity를 발생시켜 TTL/lastSeen 갱신
   */
  sendPing(): void {
    if (!this.client?.connected) {
      console.warn('[STOMP] Not connected, cannot send ping')
      return
    }

    this.client.publish({
      destination: '/pub/presence/ping',
      body: '',
    })

    console.log('[STOMP] Presence ping sent')
  }

  /**
   * 연결 상태 구독
   */
  onConnectionStatusChange(handler: ConnectionStatusHandler): () => void {
    this.connectionStatusHandlers.push(handler)
    
    // 현재 상태 즉시 전달
    handler(this.connectionStatus)
    
    // 구독 해제 함수 반환
    return () => {
      const index = this.connectionStatusHandlers.indexOf(handler)
      if (index > -1) {
        this.connectionStatusHandlers.splice(index, 1)
      }
    }
  }

  /**
   * 현재 연결 상태 조회
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  /**
   * 연결 여부 확인
   */
  isConnected(): boolean {
    return this.client?.connected === true
  }

  // ===== Private Methods =====

  private addMessageHandler(roomId: string, handler: MessageHandler): void { // number → string
    if (!this.messageHandlers.has(roomId)) {
      this.messageHandlers.set(roomId, [])
    }
    this.messageHandlers.get(roomId)!.push(handler)
  }

  private notifyHandlers(roomId: string, message: ReceiveMessageSocketResponse): void { // number → string
    const handlers = this.messageHandlers.get(roomId) || []
    handlers.forEach((handler) => handler(message))
  }

  private addReadStateHandler(roomId: string, handler: ReadStateHandler): void {
    if (!this.readStateHandlers.has(roomId)) {
      this.readStateHandlers.set(roomId, [])
    }
    this.readStateHandlers.get(roomId)!.push(handler)
  }

  private notifyReadStateHandlers(roomId: string, payload: MessageRoomReadStatePayload): void {
    const handlers = this.readStateHandlers.get(roomId) || []
    handlers.forEach((handler) => handler(payload))
  }

  private updateConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
    this.connectionStatusHandlers.forEach((handler) => handler(status))
  }

  private restoreSubscriptions(): void {
    // 재연결 시 기존 구독 복원
    const messageRoomIds = Array.from(this.messageHandlers.keys())
    const readStateRoomIds = Array.from(this.readStateHandlers.keys())
    this.messageSubscriptions.clear()
    this.readStateSubscriptions.clear()

    messageRoomIds.forEach((roomId) => {
      const handlers = this.messageHandlers.get(roomId) || []
      if (handlers.length > 0) {
        this.subscribeToRoom(roomId, handlers[0])
      }
    })

    readStateRoomIds.forEach((roomId) => {
      const handlers = this.readStateHandlers.get(roomId) || []
      if (handlers.length > 0) {
        this.subscribeToRoomReadState(roomId, handlers[0])
      }
    })
  }
}

// 싱글톤 인스턴스
export const stompChatClient = new StompChatClient()
