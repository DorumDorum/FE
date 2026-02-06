import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ChatRequestModalProps {
  onClose: () => void
  roomInfo?: {
    title: string
    dormitory: string
    roomType: string
    description: string
    hostName?: string
  }
}

const ChatRequestModal = ({ onClose, roomInfo }: ChatRequestModalProps) => {
  const [formData, setFormData] = useState({
    message: ''
  })
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
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
          <h2 className="text-xl font-bold text-black">문의하기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 방장 정보 */}
        {roomInfo && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center mb-2">
              <span className="font-medium text-black">{roomInfo.hostName || '깔끔이'}</span>
              <span className="text-sm text-gray-600 ml-2">{roomInfo.dormitory} / {roomInfo.roomType}</span>
            </div>
            <p className="text-sm text-gray-600">{roomInfo.description}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 메시지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              rows={4}
              placeholder="문의 내용을 적어주세요"
            />
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
              className="flex-1 bg-black text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              요청하기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatRequestModal
