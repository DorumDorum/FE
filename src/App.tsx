import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import RoomGatePage from '@/pages/RoomGatePage'
import RoomSearchPage from '@/pages/RoomSearchPage'
import MyRoomPage from '@/pages/MyRoomPage'
import SplashPage from '@/pages/SplashPage'
import IntroPage from '@/pages/IntroPage'
import SignupFlowPage from '@/pages/SignupFlowPage'
import LoginPage from '@/pages/LoginPage'

function App() {
  return (
    <div className="h-screen bg-white">
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/signup" element={<SignupFlowPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 방 진입 게이트 */}
        <Route path="/rooms" element={<RoomGatePage />} />
        <Route path="/rooms/search" element={<RoomSearchPage />} />
        <Route path="/rooms/me" element={<MyRoomPage />} />
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
