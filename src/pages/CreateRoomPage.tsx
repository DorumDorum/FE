import { useState, useRef, useEffect } from 'react'
import { X, Plus, User, Hash, Users, Edit3, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateRoomPageProps {
  onClose: () => void
}

const CreateRoomPage = ({ onClose }: CreateRoomPageProps) => {
  const [formData, setFormData] = useState({
    dormitory: '1 기숙사',
    roomType: '4인실',
    description: '',
    tags: [] as string[]
  })
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const dormitories = ['1 기숙사', '2 기숙사', '3 기숙사']
  const roomTypes = ['2인실', '4인실']
  const availableTags = ['조용함', '깔끔함', '사교적', '비흡연', '비음주', '아침형', '야행형']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('방이 성공적으로 생성되었습니다!')
    onClose()
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
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
    
    // 아래로 드래그할 때만 반응
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaY = currentY.current - startY.current
    
    // 드래그 거리가 충분하면 닫기
    if (deltaY > 100) {
      onClose()
    } else {
      // 원래 위치로 복귀
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
          {/* 기숙사 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4" />
              기숙사
            </label>
            <select
              value={formData.dormitory}
              onChange={(e) => setFormData(prev => ({ ...prev, dormitory: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              required
            >
              {dormitories.map(dormitory => (
                <option key={dormitory} value={dormitory}>{dormitory}</option>
              ))}
            </select>
          </div>

          {/* 방 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              방 타입
            </label>
            <select
              value={formData.roomType}
              onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
            >
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* 방 소개 (제목) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              방 소개 (제목)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              placeholder="방 제목을 입력해주세요 (예: 조용한 스터디 룸메 구합니다)"
              maxLength={30}
              required
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/30</p>
          </div>

          {/* 선호조건 (선택사항) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              선호조건 (선택사항)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-[#fcb54e] to-[#f39c12] text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1 shadow-sm"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-yellow-600 rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-1">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (!formData.tags.includes(tag)) {
                      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    formData.tags.includes(tag)
                      ? 'bg-orange-200 text-orange-600'
                      : 'bg-gray-100 text-black hover:bg-gray-200'
                  }`}
                  disabled={formData.tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 생성 버튼 */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#fcb54e] to-[#f39c12] text-white py-3 rounded-lg font-medium hover:from-[#f39c12] hover:to-[#e67e22] transition-all duration-200 shadow-lg"
          >
            방 만들기
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomPage
