import apiClient from './apiClient'
import { getApiUrl } from '@/utils/api'

/** 로그인/로그아웃 시 App에서 SSE 연결 여부를 바꿀 때 사용하는 커스텀 이벤트 이름 */
export const AUTH_CHANGE_EVENT = 'auth-change'

const DEVICE_ID_STORAGE_KEY = 'dd_notification_device_id'

/** SSE/FCM 디바이스 식별자. SSE 연결·FCM 등록 시 동일한 값 사용 */
export const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return ''
  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing
  const generated =
    window.crypto && 'randomUUID' in window.crypto
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated)
  return generated
}

/** 백엔드에 FCM 디바이스 토큰 등록 (deviceId + fcmToken) */
export const registerDeviceToken = (deviceId: string, fcmToken: string) =>
  apiClient.put('/api/notifications/devices', { deviceId, fcmToken })

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

