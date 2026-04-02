import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import toast, { Toaster, ToastBar } from 'react-hot-toast'
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
import ChatRoomPage from '@/pages/ChatRoomPage'
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
import { useChatStore } from '@/store/chatStore'
import { getChatRooms } from '@/services/chatApi'

function App() {
  const navigate = useNavigate()
  const { incrementUnreadCount, setChatRooms, updateRoomOnNewMessage } = useChatStore()
  useFcmToken()

const sseUnsubscribeRef = useRef<(() => void) | null>(null)
  const chatRoomsSeqRef = useRef(0)

  const connectSSE = () => {
    if (sseUnsubscribeRef.current) return
    const deviceId = getOrCreateDeviceId()
    sseUnsubscribeRef.current = subscribeNotificationStream(deviceId, (event: NotificationEvent) => {
      const path = event.redirectPath || '/notifications'

      // 새 채팅 메시지 알림 처리
      if (event.type === 'NEW_MESSAGE_RECEIVED' && event.relatedId) {
        const currentPath = window.location.pathname
        // 서버에서 최신 채팅방 목록을 다시 fetch해 스토어 갱신
        const seq = ++chatRoomsSeqRef.current
        getChatRooms()
          .then((r) => {
            if (seq < chatRoomsSeqRef.current) return
            const rooms = Array.isArray(r.data) ? r.data : []
            setChatRooms(rooms)
          })
          .catch(() => {
            // fetch 실패 시 incremental 업데이트로 fallback
            if (!currentPath.endsWith(`/chats/${event.relatedId}`)) {
              incrementUnreadCount(event.relatedId)
            }
            updateRoomOnNewMessage(event.relatedId!, {
              messageNo: '',
              chatRoomNo: event.relatedId!,
              senderNo: '',
              content: event.body ?? '',
              messageType: 'TEXT',
              sentAt: new Date().toISOString(),
            })
          })
      }

      // 현재 보고 있는 채팅방의 메시지 알림은 토스트 표시 안 함
      const isInRelatedChatRoom =
        event.type === 'NEW_MESSAGE_RECEIVED' &&
        event.relatedId &&
        window.location.pathname.endsWith(`/chats/${event.relatedId}`)

      if (!isInRelatedChatRoom) {
        toast.custom(
          (t) => (
            <div
              className="flex items-start gap-2 w-full max-w-full rounded-xl bg-blue-50 px-4 py-2.5 shadow-lg border border-blue-100"
              style={{
                animation: t.visible
                  ? 'slideDownFromTop 0.3s ease-out forwards'
                  : 'slideUpToTop 0.3s ease-in forwards',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  toast.dismiss(t.id)
                  navigate(path)
                }}
                className="flex flex-col items-start gap-0.5 flex-1 min-w-0 text-left"
              >
                <span className="font-semibold text-black truncate w-full">{event.title}</span>
                {event.body && (
                  <span className="text-sm text-black line-clamp-2 w-full opacity-90">{event.body}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ),
          { id: 'sse-notification', position: 'top-center', duration: 2000 }
        )
      }
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
      if (localStorage.getItem('isLoggedIn') !== 'true') {
        disconnectSSE()
        return
      }
      try {
        const res = await fetch(getApiUrl('/api/users/profile/me'), { credentials: 'include' })
        if (cancelled) return
        if (res.ok) {
          if (document.visibilityState === 'visible') connectSSE()
          // 채팅방 목록을 미리 로드해 두어 SSE 수신 시 뱃지가 즉시 갱신되도록 함
          const seq = ++chatRoomsSeqRef.current
          getChatRooms()
            .then((r) => {
              if (cancelled || seq < chatRoomsSeqRef.current) return
              const rooms = Array.isArray(r.data) ? r.data : []
              setChatRooms(rooms)
            })
            .catch(() => {})
        } else {
          disconnectSSE()
          if (res.status === 401 || res.status === 404) {
            localStorage.removeItem('isLoggedIn')
          }
        }
      } catch {
        if (!cancelled) disconnectSSE()
      }
    }

    void checkAndConnect()

    const onAuthChange = (e: Event) => {
      const detail = (e as CustomEvent<{ loggedIn: boolean }>).detail
      if (detail?.loggedIn && document.visibilityState === 'visible') {
        connectSSE()
        const seq = ++chatRoomsSeqRef.current
        getChatRooms()
          .then((r) => {
            if (seq < chatRoomsSeqRef.current) return
            const rooms = Array.isArray(r.data) ? r.data : []
            setChatRooms(rooms)
          })
          .catch(() => {})
      } else {
        disconnectSSE()
      }
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
    <div className="bg-white" style={{ height: 'var(--vh, 100dvh)' }}>
      <Toaster
        position="top-center"
        containerClassName="sse-toast-container"
        toastOptions={{ duration: 2000 }}
      >
        {(t) => (
          <ToastBar
            toast={t}
            style={{
              animation: t.visible
                ? 'slideDownFromTop 0.3s ease-out forwards'
                : 'slideUpToTop 0.3s ease-in forwards',
            }}
          />
        )}
      </Toaster>
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/signup" element={<SignupFlowPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 홈 */}
        <Route path="/home" element={<SwipeableTabLayout><HomePage /></SwipeableTabLayout>} />
        
        {/* 채팅 */}
        <Route path="/chats" element={<SwipeableTabLayout><ChatPage /></SwipeableTabLayout>} />
        <Route path="/chats/:chatRoomNo" element={<ChatRoomPage />} />
        
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
