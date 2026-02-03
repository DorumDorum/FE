import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
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
import { useFcmToken } from '@/hooks/useFcmToken'

function App() {
  // 앱 시작 시 한 번 FCM 토큰을 수집하고 서버에 등록
  useFcmToken()

  return (
    <div className="h-screen bg-white">
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/signup" element={<SignupFlowPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 홈 */}
        <Route path="/home" element={<HomePage />} />
        
        {/* 공지사항 */}
        <Route path="/notices" element={<NoticeListPage />} />
        <Route path="/notices/:noticeNo" element={<NoticeDetailPage />} />
        
        {/* 방 진입 게이트 */}
        <Route path="/rooms" element={<RoomGatePage />} />
        <Route path="/rooms/search" element={<RoomSearchPage />} />
        <Route path="/rooms/me" element={<MyRoomPage />} />
        
        {/* 마이페이지 */}
        <Route path="/me" element={<MyPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* 토스트 알림 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  )
}

export default App
