import BottomNavigationBar from '@/components/ui/BottomNavigationBar'
import GuestOnlyMessage from '@/components/ui/GuestOnlyMessage'
import { MessageCircle } from 'lucide-react'

const ChatPage = () => {
  const isGuest = !localStorage.getItem('accessToken')

  if (isGuest) {
    return (
      <div className="page-with-bottom-nav h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
        <header className="bg-white px-4 py-4 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
        </header>
        <main className="flex-1 overflow-y-auto">
          <GuestOnlyMessage />
        </main>
        <BottomNavigationBar />
      </div>
    )
  }

  return (
    <div className="page-with-bottom-nav h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* 헤더 */}
        <header className="bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="px-4 pt-4 pb-4 space-y-4">
          {/* 채팅 목록 플레이스홀더 */}
          <div className="text-sm text-gray-500 flex flex-col items-center justify-center py-16">
            <MessageCircle className="w-10 h-10 text-gray-300 mb-4" />
            <p className="font-medium text-gray-700 mb-1">아직 시작된 채팅이 없어요.</p>
            <p className="text-xs text-gray-500">방을 만들거나 룸메 찾기에서 가입 요청을 보내면 채팅이 생길 예정이에요.</p>
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar />
    </div>
  )
}

export default ChatPage

