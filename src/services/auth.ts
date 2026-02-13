import apiClient from './apiClient'
import { deleteToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { clearAllStorage } from '@/utils/storage'
import { sseNotificationClient } from '@/services/chat/sseClient'
import { stompChatClient } from '@/services/chat/stompClient'

/**
 * 로그아웃 API
 * 서버 표준 로그아웃 엔드포인트 호출.
 * Authorization 헤더(access token)는 apiClient 인터셉터에서 자동 부착된다.
 * 백엔드에서 presence clear, FCM 토큰 제거, 토큰 블랙리스트 처리 등을 수행한다.
 */
export const logout = async (): Promise<void> => {
  await apiClient.delete('/api/users/logout')
}

/**
 * 클라이언트 로컬 정리:
 * - SSE/WS 연결 종료
 * - FCM 토큰 로컬/SDK 상태 정리
 * - 인증/사용자 관련 로컬 스토리지 정리
 */
export const clearClientLogoutState = async (): Promise<void> => {
  // 1) 실시간 연결 종료
  sseNotificationClient.disconnect()
  if (stompChatClient.isConnected()) {
    stompChatClient.disconnect()
  }

  // 2) FCM SDK 토큰 삭제 (브라우저 push 구독 토큰 정리)
  try {
    const messaging = await getFirebaseMessaging()
    if (messaging) {
      await deleteToken(messaging)
    }
  } catch (error) {
    console.warn('[Logout] Failed to delete FCM token from SDK:', error)
  }

  // 3) 로컬 스토리지 정리
  // access/refresh/fcm/userId를 함께 지워서 재진입 시 이전 세션이 재사용되지 않게 한다.
  clearAllStorage()
}
