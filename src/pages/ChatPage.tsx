import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'
import GuestOnlyMessage from '@/components/ui/GuestOnlyMessage'
import ChatRoomItem from '@/components/chat/ChatRoomItem'
import { getChatRooms } from '@/services/chatApi'
import { useChatStore } from '@/store/chatStore'

const ChatPage = () => {
  const isGuest = !localStorage.getItem('isLoggedIn')
  const navigate = useNavigate()
  const { chatRooms, setChatRooms } = useChatStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isGuest) return

    const fetchRooms = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getChatRooms()
        const rooms = Array.isArray(res.data) ? res.data : []
        setChatRooms(rooms)
      } catch {
        setError('채팅방 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    void fetchRooms()
  }, [isGuest])

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
      <main
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        <header className="bg-white px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
        </header>

        {loading && (
          <div className="flex justify-center py-12">
            <p className="text-sm text-gray-400">불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="px-4 py-8 text-center text-sm text-red-500">{error}</div>
        )}

        {!loading && !error && chatRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MessageCircle className="w-10 h-10 text-gray-300 mb-4" />
            <p className="font-medium text-gray-700 mb-1">아직 시작된 채팅이 없어요.</p>
            <p className="text-xs text-gray-500 text-center">
              방을 만들거나 룸메 찾기에서 가입 요청을 보내면 채팅이 생길 예정이에요.
            </p>
          </div>
        )}

        {!loading &&
          [...chatRooms]
            .sort((a, b) => {
              if (!a.lastMessageAt) return 1
              if (!b.lastMessageAt) return -1
              return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            })
            .map((room) => (
            <ChatRoomItem
              key={room.chatRoomNo}
              room={room}
              onClick={() => navigate(`/chats/${room.chatRoomNo}`)}
            />
          ))}
      </main>

      <BottomNavigationBar />
    </div>
  )
}

export default ChatPage
