import { RoomCardProps } from '@/types/room'

const RoomCard = ({ room, onChatRequest, onApply }: RoomCardProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-black">{room.title}</span>
          <span className="text-xs text-gray-600">{room.roomType}</span>
          <span className="text-xs text-gray-600">{room.currentMembers}/{room.capacity}명</span>
        </div>
        <span className="text-xs text-gray-500">{room.createdAt}</span>
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
      <div className="flex flex-wrap gap-2 mb-4">
        {room.tags.map((tag, index) => (
          <span
            key={index}
            className="bg-[#fcb54e] text-white text-xs px-3 py-1 rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 버튼 */}
      <div className="flex space-x-3">
        <button
          onClick={() => onChatRequest(room.id)}
          className="border border-gray-300 text-black text-xs px-4 py-2 rounded font-normal"
        >
          채팅 요청
        </button>
        <button
          onClick={() => onApply(room.id)}
          className="bg-black text-white text-xs px-4 py-2 rounded font-medium"
        >
          지원하기
        </button>
      </div>
    </div>
  )
}

export default RoomCard
