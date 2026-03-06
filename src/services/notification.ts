import apiClient from './apiClient'
import { getApiUrl } from '@/utils/api'

// 백엔드에 FCM 디바이스 토큰을 등록
export const sendFirebaseToken = (firebaseToken: string) =>
  apiClient.post('/api/notification', { firebaseToken })

export interface NotificationEvent {
  notificationNo: string
  title: string
  body: string
  type: string
  relatedId: string
  redirectPath: string
}

/**
 * 서버 발송 SSE 알림 스트림을 구독합니다.
 * 백엔드 `SseEmitterRegistry`에서 아래 형태의 JSON을 전송합니다.
 * {
 *   notificationNo: string,
 *   title: string,
 *   body: string,
 *   type: string,
 *   relatedId: string,
 *   redirectPath: string
 * }
 * @param deviceId 백엔드에 등록할 디바이스 식별자 (쿼리 파라미터로 전송)
 * @param onMessage 알림 수신 시 호출되는 콜백
 * @param onError 에러 발생 시 호출되는 콜백
 * @returns 구독 해제 함수
 */
export const subscribeNotificationStream = (
  deviceId: string,
  onMessage: (event: NotificationEvent) => void,
  onError?: (event: Event) => void,
): (() => void) => {
  const url = `${getApiUrl('/api/notifications/stream')}?deviceId=${encodeURIComponent(deviceId)}`

  const eventSource = new EventSource(url, {
    withCredentials: true,
  })

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as NotificationEvent
      onMessage(data)
    } catch (e) {
      console.error('[notifications] SSE message parse error', e, event.data)
    }
  }

  // heartbeat 이벤트는 별도 이름으로 오므로 필요시 addEventListener('heartbeat', ...)에서 처리

  eventSource.onerror = (event) => {
    console.error('[notifications] SSE connection error', event)
    eventSource.close()
    if (onError) {
      onError(event)
    }
  }

  return () => {
    eventSource.close()
  }
}

