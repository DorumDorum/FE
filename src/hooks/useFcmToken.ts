import { useEffect } from 'react'
import { getToken } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { AUTH_CHANGE_EVENT, getOrCreateDeviceId, registerDeviceToken } from '@/services/notification'
import { getApiUrl } from '@/utils/api'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export const useFcmToken = () => {
  useEffect(() => {
    const registerToken = async () => {
      try {
        if (typeof window === 'undefined') return
        if (!('Notification' in window)) return

        const isLocalhost = window.location.hostname === 'localhost'
        if (!isLocalhost && window.location.protocol !== 'https:') return

        if (!VAPID_KEY) {
          console.warn('[FCM] VAPID 키가 없습니다. 환경변수를 확인하세요.')
          return
        }

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.warn('[FCM] 알림 권한이 허용되지 않았습니다.', permission)
          return
        }

        const messaging = await getFirebaseMessaging()
        if (!messaging) {
          console.warn('[FCM] Firebase Messaging을 사용할 수 없습니다.')
          return
        }

        const swRegistration =
          (await navigator.serviceWorker.getRegistration('/sw.js')) ??
          (await navigator.serviceWorker.ready)

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: swRegistration,
        })

        if (!token) {
          console.warn('[FCM] FCM 토큰을 발급받지 못했습니다.')
          return
        }

        const deviceId = getOrCreateDeviceId()
        console.log('[FCM] 디바이스 토큰 등록 시도', { deviceId: deviceId.slice(0, 8) + '...' })
        await registerDeviceToken(deviceId, token)
        localStorage.setItem('fcmToken', token)
        console.log('[FCM] 디바이스 토큰 등록 완료')
      } catch (error) {
        console.error('[FCM] 토큰 등록 실패', error)
      }
    }

    const checkAndRegister = async () => {
      if (localStorage.getItem('isLoggedIn') !== 'true') return
      try {
        const res = await fetch(getApiUrl('/api/users/profile/me'), { credentials: 'include' })
        if (res.ok) {
          console.log('[FCM] 로그인 상태 확인됨, 토큰 등록 시도')
          void registerToken()
        } else if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('isLoggedIn')
        }
      } catch {
        // 비로그인 시 skip
      }
    }

    void checkAndRegister()

    const onAuthChange = (e: Event) => {
      const detail = (e as CustomEvent<{ loggedIn: boolean }>).detail
      if (detail?.loggedIn) {
        console.log('[FCM] auth-change 로그인, 토큰 등록 시도')
        void registerToken()
      }
    }

    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange)

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange)
    }
  }, [])
}

