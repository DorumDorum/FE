import { useEffect } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { sendFirebaseToken } from '@/services/notification'
import toast from 'react-hot-toast'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const useFcmToken = () => {
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
        setupForegroundMessageHandler(messaging)
      } catch (error) {
        console.error('FCM 토큰 등록 실패', error)
      }
    }

    registerToken()
  }, [])
}

/**
 * 앱이 포그라운드(활성 상태)일 때 FCM 메시지를 받으면
 * 토스트 알림으로 표시
 */
const setupForegroundMessageHandler = (messaging: any) => {
  onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message received:', payload)

    const body = payload.notification?.body || ''

    // 채팅 메시지인 경우
    if (payload.data?.type === 'chat.message') {
      toast(body, {
        icon: '💬',
        duration: 4000,
        position: 'top-center',
      })
    }
    // 채팅 요청인 경우
    else if (payload.data?.type === 'chat.request.created') {
      toast.success(body, {
        duration: 4000,
        position: 'top-center',
      })
    }
    // 채팅 요청 결정인 경우
    else if (payload.data?.type === 'chat.request.decided') {
      const decision = payload.data?.decision
      toast(body, {
        icon: decision === 'APPROVE' ? '✅' : '❌',
        duration: 3000,
        position: 'top-center',
      })
    }
    // 일반 알림
    else {
      toast(body, {
        duration: 3000,
        position: 'top-center',
      })
    }
  })
}
