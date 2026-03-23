import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { ChatRoom } from '@/types/chat'

interface Props {
  room: ChatRoom
  onClick: () => void
}

const ChatRoomItem = ({ room, onClick }: Props) => {
  const isDirect = room.chatRoomType === 'DIRECT'
  const displayName = isDirect
    ? (room.partnerNickname ? `${room.partnerNickname}님과의 1:1 채팅` : '1:1 채팅')
    : (room.roomName ?? '그룹 채팅')
  const avatarChar = isDirect ? (room.partnerNickname?.[0] ?? '💬') : (room.roomName?.[0] ?? '?')
  const avatarBg = isDirect ? 'bg-green-100' : 'bg-blue-100'
  const avatarText = isDirect ? 'text-green-600' : 'text-blue-600'

  const timeAgo = room.lastMessageAt
    ? formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true, locale: ko })
    : ''

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left border-b border-gray-50"
    >
      <div className={`w-12 h-12 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}>
        <span className={`${avatarText} font-bold text-lg`}>
          {avatarChar}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-gray-900 truncate">{displayName}</span>
            {isDirect && (
              <span className="text-xs text-green-600 bg-green-50 rounded px-1.5 py-0.5 flex-shrink-0">1:1</span>
            )}
          </div>
          {timeAgo && (
            <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-sm text-gray-500 truncate">
            {room.lastMessageContent ?? '아직 메시지가 없습니다.'}
          </span>
          {room.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 flex-shrink-0">
              {room.unreadCount > 99 ? '99+' : room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default ChatRoomItem
