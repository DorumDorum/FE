import { RoomCardProps } from '@/types/room'

interface ExtendedRoomCardProps extends RoomCardProps {
  showButtons?: boolean
  isApplied?: boolean
  isJoined?: boolean
  onLeave?: (roomId: string) => void
}

const RoomCard = ({ room, onChatRequest, onApply, onLeave, showButtons = true, isApplied = false, isJoined = false }: ExtendedRoomCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-slide-up" style={{
      boxShadow: '0px 4px 6px 0px rgba(0, 0, 0, 0.15), 0px 2px 4px 0px rgba(0, 0, 0, 0.25)'
    }}>
      {/* 헤더 */}
      <div className="mb-3">
        <div className="text-sm font-medium text-black mb-1">
          {room.title}
        </div>
        <div className="flex items-center space-x-1 mb-1">
          <span className="text-xs text-gray-600">{room.roomType}</span>
          <span className="text-xs text-gray-600">{room.capacity}인실</span>
          {room.residencePeriod && (
            <>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-600">{room.residencePeriod}</span>
            </>
          )}
          <span className="text-xs text-gray-600">·</span>
          <span className="text-xs text-gray-600">{room.currentMembers}/{room.capacity}명</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">{room.status === 'recruiting' ? '모집 중' : room.status === 'full' ? '인원 확정' : '모집 종료'}</span>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-500">{room.createdAt}</span>
        </div>
      </div>

      {/* 설명 */}
      <p className="text-sm font-medium text-black mb-3 leading-6">
        {room.description}
      </p>

      {/* 방장 정보 */}
      <p className="text-xs font-medium text-black mb-3">
        방장: {room.hostName}
      </p>

      {/* 태그 */}
      <div className="flex space-x-2 mb-4">
        {room.tags.map((tag, index) => (
          <span
            key={index}
            className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 버튼 */}
      {showButtons && (
        <div className="flex space-x-3">
          {isJoined ? (
            // 속한 방: 나가기 버튼만 표시
            <button
              onClick={() => onLeave?.(room.id)}
              className="bg-red-500 text-white text-xs px-4 py-2 rounded font-medium hover:bg-red-600"
            >
              나가기
            </button>
          ) : (
            // 일반 방: 문의하기와 지원/취소 버튼
            <>
              <button
                onClick={() => onChatRequest(room.id)}
                className="border border-gray-300 text-black text-xs px-4 py-2 rounded font-normal"
              >
                문의하기
              </button>
              <button
                onClick={() => onApply(room.id)}
                className={`text-xs px-4 py-2 rounded font-medium ${
                  isApplied 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {isApplied ? '취소하기' : '지원하기'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default RoomCard
