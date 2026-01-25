import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateRoomModalProps {
  onClose: () => void
  onCreated?: () => void
}

const CreateRoomModal = ({ onClose, onCreated }: CreateRoomModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    roomType: '',
    capacity: '',
    description: '',
    tags: [] as string[]
  })
  
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const availableTags = ['운동', '비흡연', '조용한', '새벽형', '아침형', '갓생', '늦잠']

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('로그인이 필요합니다.')
      return
    }

    const roomType = mapRoomTypeToApi(formData.roomType)
    const capacity = Number(formData.capacity)
    if (!roomType) {
      toast.error('방 타입을 선택해주세요.')
      return
    }
    if (Number.isNaN(capacity)) {
      toast.error('수용 인원을 선택해주세요.')
      return
    }

    try {
      const res = await fetch('http://localhost:8080/api/rooms', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomType,
          capacity,
          title: formData.title.trim(),
          tags: selectedTags,
        }),
      })

      if (res.status === 401) {
        toast.error('로그인이 필요합니다.')
        return
      }

      if (!res.ok) {
        throw new Error('방 생성에 실패했습니다.')
      }

      toast.success('방이 생성되었습니다!')
      onCreated?.()
      onClose()
    } catch (error) {
      console.error('[rooms] create error', error)
      toast.error('방 생성에 실패했습니다.')
    }
  }

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove))
  }

  // 드래그 이벤트 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 100) {
      onClose()
    } else {
      setDragOffset(0)
    }
    
    setIsDragging(false)
  }

  // 마우스 드래그 지원 (데스크톱)
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY
    currentY.current = e.clientY
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    currentY.current = e.clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 100) {
      onClose()
    } else {
      setDragOffset(0)
    }
    
    setIsDragging(false)
  }

  // 마우스 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-[430px] rounded-t-3xl p-4 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto transition-transform duration-200"
        style={{
          transform: `translateY(${dragOffset}px)`,
          opacity: isDragging ? 1 - (dragOffset / 200) : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pt-2">
          <h2 className="text-xl font-bold text-black">방 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 방 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 제목
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              placeholder="방 제목을 입력하세요"
              required
            />
          </div>

          {/* 방 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 타입
            </label>
            <select
              value={formData.roomType}
              onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              required
            >
              <option value="">방 타입을 선택하세요</option>
              <option value="1 기숙사">1 기숙사</option>
              <option value="2 기숙사">2 기숙사</option>
              <option value="3 기숙사">3 기숙사</option>
            </select>
          </div>

          {/* 수용 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수용 인원
            </label>
            <select
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              required
            >
              <option value="">수용 인원을 선택하세요</option>
              <option value="2">2명</option>
              <option value="4">4명</option>
              <option value="6">6명</option>
            </select>
          </div>

          {/* 방 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              방 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              rows={4}
              placeholder="방에 대한 설명을 입력하세요"
              required
            />
          </div>

          {/* 태그 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              태그 선택 (최대 5개)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`p-2 text-xs rounded-lg border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-orange-200 text-orange-800 border-orange-300'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                  disabled={selectedTags.length >= 5 && !selectedTags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-black py-3 rounded-lg font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-black text-white py-3 rounded-lg font-medium"
            >
              방 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomModal
