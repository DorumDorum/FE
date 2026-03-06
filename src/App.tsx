import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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
import { NotificationEvent, subscribeNotificationStream } from '@/services/notification'

const DEVICE_ID_STORAGE_KEY = 'dd_notification_device_id'

const getOrCreateDeviceId = () => {
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

function App() {
  // 앱 시작 시 한 번 FCM 토큰을 수집하고 서버에 등록
  useFcmToken()

  // 앱 전체 수명 동안 유지되는 SSE 알림 스트림 연결
  useEffect(() => {
    const deviceId = getOrCreateDeviceId()

    const unsubscribe = subscribeNotificationStream(deviceId, (event: NotificationEvent) => {
      // TODO: 전역 상태(예: zustand, context)에 쌓아서 필요한 화면에서 소비하도록 확장 가능
      console.log('[SSE] notification event', event)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <div className="bg-white" style={{ height: 'calc(var(--vh, 1vh) * 100)' }}>
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
