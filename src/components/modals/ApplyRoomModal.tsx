import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { getApiUrl } from '../../utils/api'

interface ApplyRoomModalProps {
  onClose: () => void
  roomInfo?: {
    title: string
    roomType: string
    capacity: number
    currentMembers: number
    residencePeriod?: string
  }
  roomId?: string
  onSuccess?: () => void
}

const ApplyRoomModal = ({ onClose, roomInfo, roomId, onSuccess }: ApplyRoomModalProps) => {
  const [formData, setFormData] = useState({
    introduction: '',
    additionalMessage: ''
  })
  const [introError, setIntroError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!roomId) return

    if (!formData.introduction.trim()) {
      setIntroError(true)
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        onClose()
        return
      }

      const res = await fetch(getApiUrl(`/api/rooms/${roomId}/join-request`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          introduction: formData.introduction.trim(),
          additionalMessage: formData.additionalMessage?.trim() || null
        })
      })

      if (!res.ok) {
        return
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('[rooms] apply room error', err)
    } finally {
      setIsSubmitting(false)
    }
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
        {/* 드래그 핸들 & 닫기 버튼 */}
        <div className="flex items-center justify-between mb-2 sticky top-0 bg-white pt-2">
          <div className="flex-1 flex justify-center">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 헤더 제목 */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-black">방 지원하기</h2>
        </div>

        {/* 섹션 1: 선택한 방 정보 (라벨 텍스트 없이) */}
        {roomInfo && (
          <section className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div className="text-base font-semibold text-black mb-2">
                {roomInfo.title}
              </div>
              <div className="text-sm text-gray-500">
                {roomInfo.roomType} · {roomInfo.capacity}인실
                {roomInfo.residencePeriod && ` · ${roomInfo.residencePeriod}`}
                {' · '}
                {roomInfo.currentMembers}/{roomInfo.capacity}명
              </div>
            </div>
          </section>
        )}

        {/* 섹션 2: 지원 내용 (구분선만 유지) */}
        <section className="border-t border-gray-200 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* 자기소개 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              자기소개
            </label>
            <textarea
              value={formData.introduction}
              onChange={(e) => {
                const value = e.target.value
                setFormData(prev => ({ ...prev, introduction: value }))
                if (introError && value.trim()) {
                  setIntroError(false)
                }
              }}
              className={`w-full p-3 rounded-lg focus:outline-none transition-all text-black ${
                introError
                  ? 'border border-red-500 focus:ring-2 focus:ring-red-500'
                  : 'border border-gray-300 focus:ring-2 focus:ring-primary-500'
              }`}
              rows={4}
              placeholder="자신을 간단히 소개해주세요."
            />
            {introError && (
              <p className="mt-1 text-xs text-red-500">자기소개를 입력해주세요.</p>
            )}
          </div>

          {/* 추가 메시지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가 메시지 (선택사항)
            </label>
            <textarea
              value={formData.additionalMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalMessage: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-black"
              rows={3}
              placeholder="룸메이트에게 전하고 싶은 말이 있다면 적어주세요."
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
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-lg font-medium ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#3072E1] text-white hover:bg-[#2563E1]'
              }`}
            >
              {isSubmitting ? '전송 중...' : '지원하기'}
            </button>
          </div>
        </form>
        </section>
      </div>
    </div>
  )
}

export default ApplyRoomModal
