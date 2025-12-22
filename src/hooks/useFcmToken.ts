import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { sendFirebaseToken } from '@/services/notification'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const useFcmToken = () => {
  useEffect(() => {
    // 앱 진입 시 한 번 실행:
    // 1) 알림 권한 요청 → 2) 서비스워커 준비 → 3) FCM 토큰 발급 → 4) 서버로 전송
    const registerToken = async () => {
      try {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return

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

        await sendFirebaseToken(token)
        localStorage.setItem('fcmToken', token)
      } catch (error) {
        console.error('FCM 토큰 등록 실패', error)
      }
    }

    registerToken()
  }, [])
}

