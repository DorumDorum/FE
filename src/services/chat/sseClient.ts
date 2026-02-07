import type {
  MessageSentEvent,
  MessageRequestCreatedEvent,
  MessageRequestDecidedEvent,
} from '@/types/chat'
import { SseEventName } from '@/types/chat'

type SseEventHandler<T = any> = (data: T) => void

interface SseEventHandlers {
  [SseEventName.CHAT_MESSAGE]: SseEventHandler<MessageSentEvent>[]
  [SseEventName.CHAT_REQUEST_CREATED]: SseEventHandler<MessageRequestCreatedEvent>[]
  [SseEventName.CHAT_REQUEST_DECIDED]: SseEventHandler<MessageRequestDecidedEvent>[]
}

class SseNotificationClient {
  private eventSource: EventSource | null = null
  private handlers: SseEventHandlers = {
    [SseEventName.CHAT_MESSAGE]: [],
    [SseEventName.CHAT_REQUEST_CREATED]: [],
    [SseEventName.CHAT_REQUEST_DECIDED]: [],
  }
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 3000
  private maxReconnectDelay = 30000
  private currentReconnectDelay = this.reconnectDelay
  private isIntentionallyClosed = false

  /**
   * SSE 연결 시작
   * 로그인 후 호출되어야 함
   */
  connect(): void {
    if (this.eventSource) {
      console.warn('[SSE] Already connected')
      return
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.error('[SSE] No access token found')
      return
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    const tokenParam = encodeURIComponent(accessToken)
    const url = `${baseUrl}/api/notifications/stream?accessToken=${tokenParam}`

    // EventSource는 헤더를 지원하지 않으므로 쿼리 파라미터로 토큰 전달
    this.eventSource = new EventSource(url)

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected')
      this.currentReconnectDelay = this.reconnectDelay // 재연결 딜레이 초기화
      this.isIntentionallyClosed = false
    }

    this.eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
      this.eventSource?.close()
      this.eventSource = null

      // 의도적으로 닫은 경우가 아니면 재연결 시도
      if (!this.isIntentionallyClosed) {
        this.scheduleReconnect()
      }
    }

    // 이벤트 리스너 등록
    this.registerEventListeners()
  }

  /**
   * SSE 연결 해제
   */
  disconnect(): void {
    this.isIntentionallyClosed = true
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
      console.log('[SSE] Disconnected')
    }
  }

  /**
   * 채팅 메시지 이벤트 핸들러 등록
   */
  onChatMessage(handler: SseEventHandler<MessageSentEvent>): () => void {
    return this.addEventListener(SseEventName.CHAT_MESSAGE, handler)
  }

  /**
   * 채팅 요청 생성 이벤트 핸들러 등록
   */
  onChatRequestCreated(handler: SseEventHandler<MessageRequestCreatedEvent>): () => void {
    return this.addEventListener(SseEventName.CHAT_REQUEST_CREATED, handler)
  }

  /**
   * 채팅 요청 결정 이벤트 핸들러 등록
   */
  onChatRequestDecided(handler: SseEventHandler<MessageRequestDecidedEvent>): () => void {
    return this.addEventListener(SseEventName.CHAT_REQUEST_DECIDED, handler)
  }

  /**
   * 연결 여부 확인
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN
  }

  // ===== Private Methods =====

  private registerEventListeners(): void {
    if (!this.eventSource) return

    // chat.message 이벤트
    this.eventSource.addEventListener(SseEventName.CHAT_MESSAGE, (event: MessageEvent) => {
      try {
        const data: MessageSentEvent = JSON.parse(event.data)
        this.notifyHandlers(SseEventName.CHAT_MESSAGE, data)
      } catch (error) {
        console.error('[SSE] Failed to parse chat.message:', error)
      }
    })

    // chat.request.created 이벤트
    this.eventSource.addEventListener(SseEventName.CHAT_REQUEST_CREATED, (event: MessageEvent) => {
      try {
        const data: MessageRequestCreatedEvent = JSON.parse(event.data)
        this.notifyHandlers(SseEventName.CHAT_REQUEST_CREATED, data)
      } catch (error) {
        console.error('[SSE] Failed to parse chat.request.created:', error)
      }
    })

    // chat.request.decided 이벤트
    this.eventSource.addEventListener(SseEventName.CHAT_REQUEST_DECIDED, (event: MessageEvent) => {
      try {
        const data: MessageRequestDecidedEvent = JSON.parse(event.data)
        this.notifyHandlers(SseEventName.CHAT_REQUEST_DECIDED, data)
      } catch (error) {
        console.error('[SSE] Failed to parse chat.request.decided:', error)
      }
    })
  }

  private addEventListener<T>(eventName: SseEventName, handler: SseEventHandler<T>): () => void {
    this.handlers[eventName].push(handler as any)

    // 구독 해제 함수 반환
    return () => {
      const handlers = this.handlers[eventName]
      const index = handlers.indexOf(handler as any)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private notifyHandlers<T>(eventName: SseEventName, data: T): void {
    const handlers = this.handlers[eventName] || []
    handlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`[SSE] Handler error for ${eventName}:`, error)
      }
    })
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    console.log(`[SSE] Reconnecting in ${this.currentReconnectDelay}ms...`)
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('[SSE] Attempting to reconnect...')
      this.connect()
      
      // 지수 백오프 (최대 30초)
      this.currentReconnectDelay = Math.min(
        this.currentReconnectDelay * 2,
        this.maxReconnectDelay
      )
    }, this.currentReconnectDelay)
  }
}

// 싱글톤 인스턴스
export const sseNotificationClient = new SseNotificationClient()
