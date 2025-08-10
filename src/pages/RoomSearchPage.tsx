import { useState } from 'react'
import { Search, Plus, Bell } from 'lucide-react'
import RoomCard from '@/components/room/RoomCard'
import CreateRoomPage from './CreateRoomPage'
import ApplyRoomPage from './ApplyRoomPage'
import ChatRequestPage from './ChatRequestPage'
import { Room } from '@/types/room'
import toast from 'react-hot-toast'

const RoomSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showApplyRoom, setShowApplyRoom] = useState(false)
  const [showChatRequest, setShowChatRequest] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [rooms] = useState<Room[]>([
    {
      id: '1',
      title: '1 기숙사',
      roomType: '4인실',
      capacity: 4,
      currentMembers: 3,
      description: '조용하고 깔끔한 분 구해요! 공부하는 분위기 좋아하시는 분이면 더 좋아요.',
      hostName: '누구',
      tags: ['조용함', '깔끔함'],
      createdAt: '2시간 전',
      status: 'recruiting'
    },
    {
      id: '2',
      title: '2 기숙사',
      roomType: '2인실',
      capacity: 2,
      currentMembers: 1,
      description: '친구같은 룸메 구해요! 같이 영화보고 맛집 탐방하는 분이면 좋겠어요.',
      hostName: '김철수',
      tags: ['친구같은', '활발함'],
      createdAt: '1시간 전',
      status: 'recruiting'
    },
    {
      id: '3',
      title: '3 기숙사',
      roomType: '6인실',
      capacity: 6,
      currentMembers: 4,
      description: '게임 좋아하는 분들 모여요! 롤이나 발로란트 같이 하는 분 환영합니다.',
      hostName: '게임러버',
      tags: ['게임', '밤샘'],
      createdAt: '30분 전',
      status: 'recruiting'
    },
    {
      id: '4',
      title: '4 기숙사',
      roomType: '3인실',
      capacity: 3,
      currentMembers: 2,
      description: '운동하는 분들 모여요! 헬스장 같이 가고 건강한 생활하는 분이면 좋겠어요.',
      hostName: '피트니스',
      tags: ['운동', '건강'],
      createdAt: '15분 전',
      status: 'recruiting'
    },
    {
      id: '5',
      title: '5 기숙사',
      roomType: '4인실',
      capacity: 4,
      currentMembers: 3,
      description: '요리 좋아하는 분들 모여요! 같이 요리하고 맛있는 것 먹는 분이면 좋겠어요.',
      hostName: '요리사',
      tags: ['요리', '맛집'],
      createdAt: '10분 전',
      status: 'recruiting'
    },
    {
      id: '6',
      title: '6 기숙사',
      roomType: '2인실',
      capacity: 2,
      currentMembers: 1,
      description: '독서하는 분들 모여요! 책 읽고 토론하는 분이면 좋겠어요.',
      hostName: '책벌레',
      tags: ['독서', '토론'],
      createdAt: '5분 전',
      status: 'recruiting'
    }
  ])

  const handleChatRequest = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      setShowChatRequest(true)
    }
  }

  const handleApply = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      setShowApplyRoom(true)
    }
  }

  const handleCreateRoom = () => {
    setShowCreateRoom(true)
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* 상단 바 */}
      <header className="bg-[#fcb44e] h-15 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-400 flex items-center justify-center">
              <img src="/src/assets/images/logo.svg" alt="DorumDorum Logo" className="w h" />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-white" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                5
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 - 스크롤 가능 */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {/* 헤더 섹션 */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-base font-bold text-black">방 찾기</h1>
            <button
              onClick={handleCreateRoom}
              className="bg-black text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>방 만들기</span>
            </button>
          </div>
          <p className="text-gray-500 text-sm mb-4">방학 중 - 매칭 진행 중</p>
          
          {/* 검색 바 */}
          <div className="bg-gray-100 rounded-lg p-3 flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="방장 닉네임, 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {/* 방 목록 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-black">모집 중인 방</h2>
            <span className="bg-gray-200 text-black text-xs px-2 py-1 rounded-full">
              {rooms.length}개
            </span>
          </div>

          <div className="space-y-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onChatRequest={handleChatRequest}
                onApply={handleApply}
              />
            ))}
          </div>
        </div>
      </main>

      {/* 하단 네비게이션 */}
      <nav className="bg-[#fcb44e] h-15 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1">
            <div className="w-6 h-6 bg-white rounded"></div>
            <span className="text-white text-xs">방 찾기</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <div className="w-6 h-6 bg-white rounded"></div>
            <span className="text-black text-xs">룸메 찾기</span>
          </button>
          <button className="flex flex-col items-center space-y-1 relative">
            <div className="w-6 h-6 bg-white rounded"></div>
            <span className="text-black text-xs">채팅</span>
            <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <div className="w-6 h-6 bg-white rounded"></div>
            <span className="text-black text-xs">마이페이지</span>
          </button>
        </div>
      </nav>

      {/* 방 만들기 모달 */}
      {showCreateRoom && (
        <CreateRoomPage onClose={() => setShowCreateRoom(false)} />
      )}

      {/* 지원서 모달 */}
      {showApplyRoom && selectedRoom && (
        <ApplyRoomPage 
          onClose={() => {
            setShowApplyRoom(false)
            setSelectedRoom(null)
          }}
          roomInfo={{
            title: selectedRoom.title,
            dormitory: selectedRoom.title,
            roomType: selectedRoom.roomType,
            description: selectedRoom.description
          }}
        />
      )}

      {/* 채팅 요청 모달 */}
      {showChatRequest && selectedRoom && (
        <ChatRequestPage 
          onClose={() => {
            setShowChatRequest(false)
            setSelectedRoom(null)
          }}
          roomInfo={{
            title: selectedRoom.title,
            dormitory: selectedRoom.title,
            roomType: selectedRoom.roomType,
            description: selectedRoom.description,
            hostName: selectedRoom.hostName
          }}
        />
      )}
    </div>
  )
}

export default RoomSearchPage
