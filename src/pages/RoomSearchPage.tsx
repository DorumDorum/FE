import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Home, Users, MessageCircle, Menu, Search, Plus, Filter } from 'lucide-react'
import RoomCard from '@/components/room/RoomCard'
import CreateRoomModal from '@/components/modals/CreateRoomModal'
import ApplyRoomModal from '@/components/modals/ApplyRoomModal'
import ChatRequestModal from '@/components/modals/ChatRequestModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { Room } from '@/types/room'
import toast from 'react-hot-toast'

const RoomSearchPage = () => {
  const navigate = useNavigate()
  type Relation = 'recruiting' | 'applied' | 'joined'
  type ApiRoom = {
    roomNo: number
    roomType: string
    capacity: number
    currentMateCount: number
    createdAt: string
    title: string
    hostNickname: string
    additionalTag: string[]
    roomStatus: string
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    tags: [] as string[],
    roomType: '',
    roomSize: '',
    sort: 'recent' as 'recent' | 'capacity' | 'remaining',
  })
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showApplyRoom, setShowApplyRoom] = useState(false)
  const [showChatRequest, setShowChatRequest] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false) // 안 읽은 알람 여부
  const [activeTab, setActiveTab] = useState<'recruiting' | 'applied' | 'joined'>('recruiting')
  const availableTags = ['운동', '비흡연', '조용한', '새벽형', '아침형', '갓생', '늦잠']
  
  const [recruitingRooms, setRecruitingRooms] = useState<Room[]>([])
  const [appliedRooms, setAppliedRooms] = useState<Room[]>([])
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [loadingTab, setLoadingTab] = useState<Relation | null>(null)
  const loadingDelayTimerRef = useRef<number | null>(null)
  const lastFetchedKeyRef = useRef<Record<Relation, string | null>>({
    recruiting: null,
    applied: null,
    joined: null,
  })

  const toggleTag = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const resetFilters = () => {
    setFilters({ tags: [], roomType: '', roomSize: '', sort: 'recent' })
  }

  const applyFilters = (list: Room[]) => {
    let result = [...list]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.hostName.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    if (filters.roomType) {
      result = result.filter((r) => r.roomType === filters.roomType)
    }

    if (filters.roomSize) {
      const size = Number(filters.roomSize)
      if (!Number.isNaN(size)) {
        result = result.filter((r) => r.capacity === size)
      }
    }

    if (filters.tags.length) {
      result = result.filter((r) => r.tags.some((tag) => filters.tags.includes(tag)))
    }

    if (filters.sort === 'capacity') {
      result.sort((a, b) => b.capacity - a.capacity)
    } else if (filters.sort === 'remaining') {
      result.sort(
        (a, b) =>
          (b.capacity - b.currentMembers) - (a.capacity - a.currentMembers)
      )
    }

    return result
  }

  const filteredRecruitingRooms = useMemo(
    () => applyFilters(recruitingRooms),
    [recruitingRooms, searchQuery, filters]
  )

  const filteredAppliedRooms = useMemo(
    () => applyFilters(appliedRooms),
    [appliedRooms, searchQuery, filters]
  )

  const filteredJoinedRooms = useMemo(
    () => applyFilters(joinedRooms),
    [joinedRooms, searchQuery, filters]
  )

  const mapRoomTypeToApi = (type: string) => {
    switch (type) {
      case '1 기숙사':
        return 'ROOM_A'
      case '2 기숙사':
        return 'ROOM_B'
      case '3 기숙사':
        return 'ROOM_C'
      default:
        return undefined
    }
  }

  const mapApiRoomTypeToDisplay = (type: string) => {
    switch (type) {
      case 'ROOM_A':
        return '1 기숙사'
      case 'ROOM_B':
        return '2 기숙사'
      case 'ROOM_C':
        return '3 기숙사'
      default:
        return type || '기숙사'
    }
  }

  const mapApiStatusToDisplay = (status: string): Room['status'] => {
    switch (status) {
      case 'CONFIRM_PENDING':
        return 'recruiting'
      case 'IN_PROGRESS':
        return 'full'
      case 'COMPLETED':
        return 'closed'
      default:
        return 'recruiting'
    }
  }

  const mapApiRoom = (api: ApiRoom): Room => ({
    id: String(api.roomNo),
    title: api.title || '방',
    roomType: mapApiRoomTypeToDisplay(api.roomType),
    capacity: api.capacity,
    currentMembers: api.currentMateCount,
    description: '',
    hostName: api.hostNickname || '',
    tags: api.additionalTag || [],
    createdAt: formatRelativeTime(api.createdAt),
    status: mapApiStatusToDisplay(api.roomStatus),
  })

  const formatRelativeTime = (iso?: string): string => {
    if (!iso) return ''
    const now = new Date()
    const target = new Date(iso)
    const diffMs = now.getTime() - target.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffMin < 1) return '방금 전'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`

    const y = target.getFullYear()
    const m = String(target.getMonth() + 1).padStart(2, '0')
    const d = String(target.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const fetchRooms = async (
    relation: Relation,
    opts?: { showLoading?: boolean; requestKey?: string }
  ) => {
    // "로딩 플래시" 방지: 아주 빠른 응답이면 로딩 문구를 아예 보여주지 않도록 지연 표시
    if (opts?.showLoading) {
      if (loadingDelayTimerRef.current) window.clearTimeout(loadingDelayTimerRef.current)
      loadingDelayTimerRef.current = window.setTimeout(() => {
        setLoadingTab(relation)
      }, 250)
    }
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        toast.error('로그인이 필요합니다.')
        navigate('/login')
        if (loadingDelayTimerRef.current) window.clearTimeout(loadingDelayTimerRef.current)
        loadingDelayTimerRef.current = null
        setLoadingTab(null)
        return
      }

      const params = new URLSearchParams()
      const relationMap = {
        recruiting: 'RECRUITING',
        applied: 'APPLIED',
        joined: 'JOINED',
      } as const
      params.set('relation', relationMap[relation])

      const apiRoomType = mapRoomTypeToApi(filters.roomType)
      if (apiRoomType) params.set('type', apiRoomType)

      if (filters.roomSize) params.set('capacity', filters.roomSize)

      if (filters.sort === 'remaining') {
        params.set('sort', 'REMAINING')
      } else {
        params.set('sort', 'CREATED_AT')
      }

      const url = `http://localhost:8080/api/rooms?${params.toString()}`
      console.log('[rooms] request', {
        relation,
        url,
        filters,
      })

      const startedAt = performance.now()
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const elapsedMs = Math.round(performance.now() - startedAt)
      console.log('[rooms] response meta', {
        relation,
        url,
        status: res.status,
        ok: res.ok,
        elapsedMs,
      })
      if (res.status === 401) {
        toast.error('로그인이 필요합니다.')
        navigate('/login')
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      const rawBody = await res.text()
      if (!res.ok) {
        console.error('[rooms] response not ok', {
          relation,
          url,
          status: res.status,
          elapsedMs,
          contentType,
          body: rawBody,
        })
        throw new Error('방 목록을 불러오지 못했습니다.')
      }

      let data: any
      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch (e) {
        console.error('[rooms] failed to parse json', { relation, url, contentType, rawBody }, e)
        throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
      }
      const payload = data?.data ?? data
      const list: ApiRoom[] = payload?.result?.items ?? payload?.items ?? payload ?? []
      const mapped = list.map(mapApiRoom)

      if (relation === 'recruiting') setRecruitingRooms(mapped)
      if (relation === 'applied') setAppliedRooms(mapped)
      if (relation === 'joined') setJoinedRooms(mapped)

      if (opts?.requestKey) lastFetchedKeyRef.current[relation] = opts.requestKey
    } catch (err) {
      console.error('[rooms] fetch error', {
        relation,
        filters,
        requestKey: opts?.requestKey,
      }, err)
      toast.error('방 목록을 불러오지 못했습니다.')
    } finally {
      if (opts?.showLoading) {
        if (loadingDelayTimerRef.current) window.clearTimeout(loadingDelayTimerRef.current)
        loadingDelayTimerRef.current = null
        setLoadingTab(null)
      }
    }
  }

  useEffect(() => {
    const requestKey = JSON.stringify({
      relation: activeTab,
      roomType: filters.roomType,
      roomSize: filters.roomSize,
      sort: filters.sort,
    })

    const currentList =
      activeTab === 'recruiting'
        ? recruitingRooms
        : activeTab === 'applied'
          ? appliedRooms
          : joinedRooms

    // 이미 같은 조건으로 데이터를 받아왔고 리스트도 있으면, 탭 전환 시 재호출하지 않음 (슬라이드가 더 자연스러움)
    if (lastFetchedKeyRef.current[activeTab] === requestKey && currentList.length > 0) return

    // 해당 탭에 데이터가 이미 있으면 UI는 그대로 두고 백그라운드로 갱신 (로딩 문구 미표시)
    fetchRooms(activeTab, { showLoading: currentList.length === 0, requestKey })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.roomType, filters.roomSize, filters.sort])

  const handleChatRequest = (roomId: string) => {
    const room = recruitingRooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      setShowChatRequest(true)
    }
  }

  const handleApply = (roomId: string) => {
    const room = recruitingRooms.find(r => r.id === roomId) || appliedRooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      if (appliedRooms.some(r => r.id === roomId)) {
        // 이미 지원한 방이면 취소 확인 모달 표시
        setShowCancelConfirm(true)
      } else {
        // 새로운 방 지원이면 지원서 모달 표시
        setShowApplyRoom(true)
      }
    }
  }

  const handleCreateRoom = () => {
    setShowCreateRoom(true)
  }

  const handleLeave = (roomId: string) => {
    const room = joinedRooms.find(r => r.id === roomId)
    if (room) {
      setSelectedRoom(room)
      setShowLeaveConfirm(true)
    }
  }

  const handleCancelApply = () => {
    if (selectedRoom) {
      // 지원 취소 로직 (실제로는 API 호출)
      console.log('지원 취소:', selectedRoom.id)
      toast.success('지원이 취소되었습니다.')
      // 여기에 지원 취소 API 호출 및 상태 업데이트 로직 추가
    }
    setShowCancelConfirm(false)
    setSelectedRoom(null)
  }

  const handleConfirmLeave = () => {
    if (selectedRoom) {
      // 방 나가기 로직 (실제로는 API 호출)
      console.log('방 나가기:', selectedRoom.id)
      toast.success('방에서 나갔습니다.')
      // 여기에 방 나가기 API 호출 및 상태 업데이트 로직 추가
    }
    setShowLeaveConfirm(false)
    setSelectedRoom(null)
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto">
        {/* 상단 바 */}
        <header className="bg-white h-15 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">방 찾기</h1>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-7 h-7 text-gray-700" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="px-4 pt-2 pb-4">
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
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 text-sm text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
            >
              <Filter className="w-4 h-4" />
              <span>필터</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-black">필터</span>
                <button
                  onClick={resetFilters}
                  className="text-xs text-gray-500 underline"
                >
                  초기화
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs text-gray-600">방 타입</label>
                  <select
                    value={filters.roomType}
                    onChange={(e) => setFilters((prev) => ({ ...prev, roomType: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-black"
                  >
                    <option value="">전체</option>
                    <option value="1 기숙사">1 기숙사</option>
                    <option value="2 기숙사">2 기숙사</option>
                    <option value="3 기숙사">3 기숙사</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-gray-600">수용 인원</label>
                  <select
                    value={filters.roomSize}
                    onChange={(e) => setFilters((prev) => ({ ...prev, roomSize: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-2 text-sm text-black"
                  >
                    <option value="">전체</option>
                    <option value="2">2인실</option>
                    <option value="4">4인실</option>
                    <option value="6">6인실</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600">태그</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        filters.tags.includes(tag)
                          ? 'bg-orange-200 text-orange-800 border-orange-300'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600">정렬</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, sort: 'recent' }))}
                    className={`py-2 text-xs rounded border ${
                      filters.sort === 'recent'
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    최신순
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, sort: 'capacity' }))}
                    className={`py-2 text-xs rounded border ${
                      filters.sort === 'capacity'
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    인원 많은순
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilters((prev) => ({ ...prev, sort: 'remaining' }))}
                    className={`py-2 text-xs rounded border ${
                      filters.sort === 'remaining'
                        ? 'bg-black text-white border-black'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    남은자리순
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 방 목록 */}
        <div className="mt-4">
          {loadingTab === activeTab &&
            (activeTab === 'recruiting'
              ? recruitingRooms.length === 0
              : activeTab === 'applied'
                ? appliedRooms.length === 0
                : joinedRooms.length === 0) && (
            <div className="text-xs text-gray-500 mb-2">불러오는 중...</div>
          )}

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('recruiting')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'recruiting'
                  ? 'border-[#fcb44e] text-[#fcb44e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              모집 중인 방
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'applied'
                  ? 'border-[#fcb44e] text-[#fcb44e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              내가 지원한 방
            </button>
            <button
              onClick={() => setActiveTab('joined')}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'joined'
                  ? 'border-[#fcb44e] text-[#fcb44e]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              내가 속한 방
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === 'recruiting' && (
            <div className="space-y-4">
              {filteredRecruitingRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onChatRequest={handleChatRequest}
                  onApply={handleApply}
                />
              ))}
            </div>
          )}

          {activeTab === 'applied' && (
            <div className="space-y-4">
              {filteredAppliedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onChatRequest={handleChatRequest}
                  onApply={handleApply}
                  isApplied={true}
                />
              ))}
            </div>
          )}

          {activeTab === 'joined' && (
            <div className="space-y-4">
              {filteredJoinedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onChatRequest={handleChatRequest}
                  onApply={handleApply}
                  onLeave={handleLeave}
                  isJoined={true}
                />
              ))}
            </div>
          )}
        </div>
        </div>
      </main>

      {/* 하단 네비게이션 바 */}
      <nav className="bg-orange-50 border-t border-orange-100 h-15 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1">
            <Home className="w-6 h-6 text-orange-600" />
            <span className="text-orange-600 text-xs font-semibold">방 찾기</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <Users className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600 text-xs">룸메 찾기</span>
          </button>
          <button className="flex flex-col items-center space-y-1 relative">
            <MessageCircle className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600 text-xs">채팅</span>
            <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <Menu className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600 text-xs">마이페이지</span>
          </button>
        </div>
      </nav>

      {/* 방 만들기 모달 */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}

      {/* 지원서 모달 */}
      {showApplyRoom && selectedRoom && (
        <ApplyRoomModal 
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

      {/* 문의하기 모달 */}
      {showChatRequest && selectedRoom && (
        <ChatRequestModal 
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

      {/* 지원 취소 확인 모달 */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="지원 취소"
        message="정말로 지원을 취소하시겠습니까?"
        confirmText="취소하기"
        onConfirm={handleCancelApply}
        onCancel={() => {
          setShowCancelConfirm(false)
          setSelectedRoom(null)
        }}
      />

      {/* 방 나가기 확인 모달 */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="방 나가기"
        message="정말로 방에서 나가시겠습니까?"
        confirmText="나가기"
        onConfirm={handleConfirmLeave}
        onCancel={() => {
          setShowLeaveConfirm(false)
          setSelectedRoom(null)
        }}
      />
    </div>
  )
}

export default RoomSearchPage
