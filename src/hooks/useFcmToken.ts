import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { useNavigate } from 'react-router-dom'
import { getFirebaseMessaging } from '@/lib/firebase'
import { sendFirebaseToken } from '@/services/notification'
import { extractMessageRoomId, showChatNavigationToast } from '@/services/chat/chatNotification'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const useFcmToken = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // 앱 진입 시 한 번 실행:
    // 1) 알림 권한 요청 → 2) 서비스워커 준비 → 3) FCM 토큰 발급 → 4) 서버로 전송
    const registerToken = async () => {
      try {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return
        // 비로그인 상태에서는 서버에 디바이스 토큰을 등록하지 않는다.
        // (로그아웃 뒤에도 FCM 토큰이 남는 이슈 방지)
        if (!localStorage.getItem('accessToken')) return

        // HTTPS 필요(로컬호스트 제외)
        const isLocalhost = window.location.hostname === 'localhost'
        if (!isLocalhost && window.location.protocol !== 'https:') return

        if (!VAPID_KEY) {
          console.warn('VAPID 키가 없습니다. 환경변수를 확인하세요.')
          return
        }

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const messaging = await getFirebaseMessaging()
        if (!messaging) return

        const swRegistration =
          (await navigator.serviceWorker.getRegistration('/sw.js')) ??
          (await navigator.serviceWorker.ready)

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })

        if (!token) return

        // 서버에 "현재 로그인 사용자" 기준으로 토큰 등록
        await sendFirebaseToken(token)
        localStorage.setItem('fcmToken', token)

        // 포그라운드 메시지 수신 핸들러 등록
        const unsubscribeForeground = setupForegroundMessageHandler(messaging, navigate)
        return unsubscribeForeground
      } catch (error) {
        console.error('FCM 토큰 등록 실패', error)
      }

      return undefined
    }

    let unsubscribeForegroundMessage: (() => void) | undefined
    void registerToken().then((unsubscribe) => {
      unsubscribeForegroundMessage = unsubscribe
    })

    return () => {
      if (unsubscribeForegroundMessage) {
        unsubscribeForegroundMessage()
      }
    }
  }, [navigate])
}

/**
 * 앱이 포그라운드(활성 상태)일 때 FCM 메시지를 받으면
 * 토스트 알림으로 표시
 */
const setupForegroundMessageHandler = (messaging: any, navigate: ReturnType<typeof useNavigate>) => {
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload)

    const body = payload.notification?.body || ''
    const roomId = extractMessageRoomId(payload.data)

    // 채팅 메시지인 경우
    if (payload.data?.type === 'chat.message') {
      showChatNavigationToast({
        title: payload.notification?.title || '새로운 메시지가 도착했습니다',
        description: body,
        icon: '💬',
        roomId,
        navigate,
        duration: 4000,
      })
    }
    // 채팅 요청인 경우
    else if (payload.data?.type === 'chat.request.created') {
      showChatNavigationToast({
        title: payload.notification?.title || '새로운 채팅 요청이 도착했습니다',
        description: body,
        icon: '📩',
        roomId,
        navigate,
        duration: 4500,
      })
    }
    // 채팅 요청 결정인 경우
    else if (payload.data?.type === 'chat.request.decided') {
      const decision = payload.data?.decision
      showChatNavigationToast({
        title: payload.notification?.title || body || '채팅 요청 상태가 변경되었습니다',
        description: body,
        icon: decision === 'APPROVE' ? '✅' : '❌',
        roomId,
        navigate,
        duration: 4000,
      })
    }
    // 일반 알림
    else {
      showChatNavigationToast({
        title: payload.notification?.title || '새 알림',
        description: body,
        roomId,
        navigate,
        duration: 3500,
      })
    }
  })
}
