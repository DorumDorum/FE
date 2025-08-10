import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import RoomSearchPage from '@/pages/RoomSearchPage'

function App() {
  return (
    <div className="h-screen bg-white">
      <Routes>
        {/* 메인 페이지 - 방 찾기 */}
        <Route path="/" element={<RoomSearchPage />} />
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
