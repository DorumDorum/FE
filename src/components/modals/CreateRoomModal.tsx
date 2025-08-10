import { useState, useRef, useEffect } from 'react'
import { X, User, Edit3, Tag, MessageCircle, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateRoomModalProps {
  onClose: () => void
}

const CreateRoomModal = ({ onClose }: CreateRoomModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    roomType: '',
    capacity: '',
    description: '',
    tags: [] as string[]
  })
  
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const availableTags = ['조용함', '깔끔함', '친구같은', '활발함', '게임', '밤샘', '운동', '건강', '요리', '맛집', '독서', '토론']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success('방이 생성되었습니다!')
    onClose()
  }

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()])
      setCustomTag('')
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
              <option value="2인실">2인실</option>
              <option value="3인실">3인실</option>
              <option value="4인실">4인실</option>
              <option value="6인실">6인실</option>
            </select>
          </div>

          {/* 수용 인원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              수용 인원
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              placeholder="수용 인원을 입력하세요"
              min="1"
              max="10"
              required
            />
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
            
            {/* 커스텀 태그 추가 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm text-black"
                placeholder="커스텀 태그"
                disabled={selectedTags.length >= 5}
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                disabled={!customTag.trim() || selectedTags.length >= 5}
              >
                추가
              </button>
            </div>
          </div>

          {/* 선택된 태그 표시 */}
          {selectedTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                선택된 태그
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

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
