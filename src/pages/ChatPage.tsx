import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Clock } from 'lucide-react'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'
import { useChatStore } from '@/store/chatStore'
import { loadMessageRooms } from '@/services/chat/chatApi'
import { MessageRoomStatus } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

const ChatPage = () => {
  const navigate = useNavigate()
  const { rooms, isLoadingRooms, setRooms, setLoadingRooms, pendingRequests } = useChatStore()

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      setLoadingRooms(true)
      const data = await loadMessageRooms()
      console.log('[ChatPage] Loaded rooms:', data)
      
      // 응답 구조 확인
      if (data && Array.isArray(data.items)) {
        setRooms(data.items, data.nextCursor, data.hasNext)
      } else {
        console.error('[ChatPage] Invalid response structure:', data)
        setRooms([], null, false)
      }
    } catch (error) {
      console.error('Failed to load chat rooms:', error)
      setRooms([], null, false)
    } finally {
      setLoadingRooms(false)
    }
  }

  const handleRoomClick = (roomId: string, roomStatus: MessageRoomStatus) => { // number → string
    if (roomStatus === MessageRoomStatus.APPROVED) {
      navigate(`/chats/${roomId}`)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ko,
      })
    } catch {
      return ''
    }
  }

  const getRoomStatusText = (status: MessageRoomStatus) => {
    switch (status) {
      case MessageRoomStatus.REQUESTED:
        return '요청 대기 중'
      case MessageRoomStatus.REJECTED:
        return '거절됨'
      case MessageRoomStatus.DELETED:
        return '삭제됨'
      default:
        return ''
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      <main
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* 헤더 */}
        <header className="bg-white px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">채팅</h1>
            {pendingRequests.length > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequests.length}
              </div>
            )}
          </div>
        </header>

        {/* 채팅 요청 알림 */}
        {pendingRequests.length > 0 && (
          <div className="px-4 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-900">
                {pendingRequests.length}개의 채팅 요청이 있습니다
              </p>
              <button
                onClick={() => navigate('/chats/requests')}
                className="text-xs text-blue-600 font-medium mt-1"
              >
                확인하기
              </button>
            </div>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="px-4 pt-4 pb-4">
          {isLoadingRooms ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-gray-500 flex flex-col items-center justify-center py-16">
              <MessageCircle className="w-10 h-10 text-gray-300 mb-4" />
              <p className="font-medium text-gray-700 mb-1">아직 시작된 채팅이 없어요.</p>
              <p className="text-xs text-gray-500 text-center">
                방을 만들거나 룸메 찾기에서 가입 요청을 보내면 채팅이 생길 예정이에요.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.messageRoomNo}
                  onClick={() => handleRoomClick(room.messageRoomNo, room.roomStatus)}
                  className={`bg-white border border-gray-200 rounded-lg p-4 ${
                    room.roomStatus === MessageRoomStatus.APPROVED
                      ? 'cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all'
                      : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {room.roomType === 'DIRECT' ? '1:1 채팅' : '그룹 채팅'}
                        </h3>
                        {room.unreadCount && room.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>

                      {room.roomStatus !== MessageRoomStatus.APPROVED && (
                        <p className="text-xs text-orange-600 font-medium mb-1">
                          {getRoomStatusText(room.roomStatus)}
                        </p>
                      )}

                      <p className="text-sm text-gray-600 truncate">{room.lastMessage || '메시지가 없습니다'}</p>
                    </div>

                    <div className="flex flex-col items-end ml-3">
                      <div className="flex items-center text-xs text-gray-400 gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(room.lastMessageAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNavigationBar />
    </div>
  )
}

export default ChatPage
