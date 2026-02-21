import type {
  MessageSentEvent,
  MessageRequestCreatedEvent,
  MessageRequestDecidedEvent,
} from '@/types/chat'
import { SseEventName } from '@/types/chat'

type SseEventHandler<T = any> = (data: T) => void

interface SseEventHandlers {
  [SseEventName.CONNECTED]: SseEventHandler<any>[]
  [SseEventName.HEARTBEAT]: SseEventHandler<any>[]
  [SseEventName.CHAT_MESSAGE]: SseEventHandler<MessageSentEvent>[]
  [SseEventName.CHAT_REQUEST_CREATED]: SseEventHandler<MessageRequestCreatedEvent>[]
  [SseEventName.CHAT_REQUEST_DECIDED]: SseEventHandler<MessageRequestDecidedEvent>[]
}

class SseNotificationClient {
  private abortController: AbortController | null = null
  private connected = false
  private handlers: SseEventHandlers = {
    [SseEventName.CONNECTED]: [],
    [SseEventName.HEARTBEAT]: [],
    [SseEventName.CHAT_MESSAGE]: [],
    [SseEventName.CHAT_REQUEST_CREATED]: [],
    [SseEventName.CHAT_REQUEST_DECIDED]: [],
  }
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null
  private reconnectDelay = 3000
  private maxReconnectDelay = 30000
  private currentReconnectDelay = this.reconnectDelay
  private isIntentionallyClosed = false
  private static readonly AUTH_ERROR = 'SSE_AUTH_ERROR'

  /**
   * SSE 연결 시작
   * 로그인 후 호출되어야 함
   */
  connect(): void {
    if (this.abortController) {
      console.warn('[SSE] Already connected')
      return
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      console.error('[SSE] No access token found')
      return
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    const url = `${baseUrl}/api/notifications/stream`
    this.isIntentionallyClosed = false
    void this.openStream(url, accessToken)
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

    this.abortController?.abort()
    this.abortController = null
    this.connected = false
    console.log('[SSE] Disconnected')
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
    return this.connected
  }

  // ===== Private Methods =====

  private async openStream(url: string, accessToken: string): Promise<void> {
    const controller = new AbortController()
    this.abortController = controller

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'text/event-stream',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(SseNotificationClient.AUTH_ERROR)
        }
        throw new Error(`SSE request failed: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('SSE response body is empty')
      }

      this.connected = true
      this.currentReconnectDelay = this.reconnectDelay
      console.log('[SSE] Connected')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        buffer = this.processBuffer(buffer)
      }

      buffer += decoder.decode()
      this.processRemainingBuffer(buffer)

      if (!this.isIntentionallyClosed) {
        throw new Error('SSE stream closed')
      }
    } catch (error) {
      const isAborted = controller.signal.aborted
      const isAuthError = error instanceof Error && error.message === SseNotificationClient.AUTH_ERROR

      if (isAuthError) {
        console.error('[SSE] Unauthorized. Stop reconnect and require re-login.')
        this.isIntentionallyClosed = true
        return
      }

      if (!this.isIntentionallyClosed && !isAborted) {
        console.error('[SSE] Connection error:', error)
        this.scheduleReconnect()
      }
    } finally {
      if (this.abortController === controller) {
        this.abortController = null
      }
      this.connected = false
    }
  }

  private processBuffer(buffer: string): string {
    const normalized = buffer.replace(/\r\n/g, '\n')
    let rest = normalized

    while (true) {
      const boundary = rest.indexOf('\n\n')
      if (boundary < 0) break

      const rawEvent = rest.slice(0, boundary)
      rest = rest.slice(boundary + 2)
      this.handleRawEvent(rawEvent)
    }

    return rest
  }

  private processRemainingBuffer(buffer: string): void {
    const remaining = buffer.trim()
    if (!remaining) return
    this.handleRawEvent(remaining)
  }

  private handleRawEvent(rawEvent: string): void {
    const lines = rawEvent.replace(/\r/g, '').split('\n')
    let eventName = 'message'
    const dataLines: string[] = []

    lines.forEach((line) => {
      if (!line || line.startsWith(':')) return

      if (line.startsWith('event:')) {
        eventName = line.slice('event:'.length).trim()
        return
      }

      if (line.startsWith('data:')) {
        dataLines.push(line.slice('data:'.length).trimStart())
      }
    })

    const data = dataLines.join('\n')
    this.dispatchEvent(eventName, data)
  }

  private dispatchEvent(eventName: string, data: string): void {
    if (eventName === SseEventName.CONNECTED) {
      console.log('[SSE] Connected event received')
      this.notifyHandlers(SseEventName.CONNECTED, {})
      return
    }

    if (eventName === SseEventName.HEARTBEAT) {
      this.notifyHandlers(SseEventName.HEARTBEAT, {})
      return
    }

    if (eventName === SseEventName.CHAT_MESSAGE) {
      this.dispatchJsonEvent<MessageSentEvent>(SseEventName.CHAT_MESSAGE, data)
      return
    }

    if (eventName === SseEventName.CHAT_REQUEST_CREATED) {
      this.dispatchJsonEvent<MessageRequestCreatedEvent>(SseEventName.CHAT_REQUEST_CREATED, data)
      return
    }

    if (eventName === SseEventName.CHAT_REQUEST_DECIDED) {
      this.dispatchJsonEvent<MessageRequestDecidedEvent>(SseEventName.CHAT_REQUEST_DECIDED, data)
    }
  }

  private dispatchJsonEvent<T>(eventName: SseEventName, data: string): void {
    if (!data) return
    try {
      const parsed = JSON.parse(data) as T
      this.notifyHandlers(eventName, parsed)
    } catch (error) {
      console.error(`[SSE] Failed to parse ${eventName}:`, error)
    }
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
