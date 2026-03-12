import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import RoomGatePage from '@/pages/RoomGatePage'
import RoomSearchPage from '@/pages/RoomSearchPage'
import MyRoomPage from '@/pages/MyRoomPage'
import MyPage from '@/pages/MyPage'
import HomePage from '@/pages/HomePage'
import NoticeListPage from '@/pages/NoticeListPage'
import NoticeDetailPage from '@/pages/NoticeDetailPage'
import SplashPage from '@/pages/SplashPage'
import IntroPage from '@/pages/IntroPage'
import SignupFlowPage from '@/pages/SignupFlowPage'
import LoginPage from '@/pages/LoginPage'
import ChatPage from '@/pages/ChatPage'
import NotificationsPage from '@/pages/NotificationsPage'
import { useFcmToken } from '@/hooks/useFcmToken'
import SwipeableTabLayout from '@/components/layout/SwipeableTabLayout'
import InstallAppBanner from '@/components/ui/InstallAppBanner'
import {
  AUTH_CHANGE_EVENT,
  getOrCreateDeviceId,
  NotificationEvent,
  subscribeNotificationStream,
} from '@/services/notification'
import { getApiUrl } from '@/utils/api'

function App() {
  const navigate = useNavigate()
  useFcmToken()

  // [DEBUG] 환경변수 주입 확인 (배포 후 제거)
  useEffect(() => {
    const env = {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '(fallback)',
      VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY ? '✓' : '✗',
      VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✓' : '✗',
      VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✓' : '✗',
      VITE_FIREBASE_VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY ? '✓' : '✗',
    }
    console.warn('[ENV DEBUG] 환경변수:', env)
    ;(window as unknown as Record<string, unknown>).__ENV_DEBUG__ = env
  }, [])

  const sseUnsubscribeRef = useRef<(() => void) | null>(null)

  const connectSSE = () => {
    if (sseUnsubscribeRef.current) return
    const deviceId = getOrCreateDeviceId()
    sseUnsubscribeRef.current = subscribeNotificationStream(deviceId, (event: NotificationEvent) => {
      const path = event.redirectPath || '/notifications'
      toast.custom(
        (t) => (
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id)
              navigate(path)
            }}
            className="flex flex-col items-start gap-0.5 w-full max-w-full rounded-xl bg-blue-50 px-4 py-2.5 shadow-lg border border-blue-100 text-left hover:bg-blue-100 active:bg-blue-100 transition-colors"
          >
            <span className="font-semibold text-black truncate w-full">{event.title}</span>
            {event.body && (
              <span className="text-sm text-black line-clamp-2 w-full opacity-90">{event.body}</span>
            )}
          </button>
        ),
        { id: 'sse-notification', position: 'top-center', duration: 4000 }
      )
    })
  }

  const disconnectSSE = () => {
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current()
      sseUnsubscribeRef.current = null
    }
  }

  // 로그인된 상태에서만 SSE 연결. 포그라운드일 때만 연결, 백그라운드면 끊어서 FCM으로 전달.
  useEffect(() => {
    let cancelled = false

    const checkAndConnect = async () => {
      try {
        const res = await fetch(getApiUrl('/api/users/profile/me'), { credentials: 'include' })
        if (cancelled) return
        if (res.ok && document.visibilityState === 'visible') connectSSE()
        else if (!res.ok) disconnectSSE()
      } catch {
        if (!cancelled) disconnectSSE()
      }
    }

    void checkAndConnect()

    const onAuthChange = (e: Event) => {
      const detail = (e as CustomEvent<{ loggedIn: boolean }>).detail
      if (detail?.loggedIn && document.visibilityState === 'visible') connectSSE()
      else disconnectSSE()
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkAndConnect()
      else disconnectSSE()
    }

    window.addEventListener(AUTH_CHANGE_EVENT, onAuthChange)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      window.removeEventListener(AUTH_CHANGE_EVENT, onAuthChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      disconnectSSE()
    }
  }, [])

  return (
    <div className="bg-white" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
      <Toaster position="top-center" containerClassName="sse-toast-container" />
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/signup" element={<SignupFlowPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 홈 */}
        <Route path="/home" element={<SwipeableTabLayout><HomePage /></SwipeableTabLayout>} />
        
        {/* 채팅 */}
        <Route path="/chats" element={<SwipeableTabLayout><ChatPage /></SwipeableTabLayout>} />
        
        {/* 알림 */}
        <Route path="/notifications" element={<NotificationsPage />} />
        
        {/* 공지사항 */}
        <Route path="/notices" element={<NoticeListPage />} />
        <Route path="/notices/:noticeNo" element={<NoticeDetailPage />} />
        
        {/* 방 진입 게이트 */}
        <Route path="/rooms" element={<RoomGatePage />} />
        <Route path="/rooms/search" element={<SwipeableTabLayout><RoomSearchPage /></SwipeableTabLayout>} />
        <Route path="/rooms/me" element={<SwipeableTabLayout><MyRoomPage /></SwipeableTabLayout>} />
        
        {/* 마이페이지 */}
        <Route path="/me" element={<SwipeableTabLayout><MyPage /></SwipeableTabLayout>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <InstallAppBanner />
    </div>
  )
}

export default App
