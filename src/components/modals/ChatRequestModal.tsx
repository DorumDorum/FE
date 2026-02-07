import { useState } from 'react'
import { X } from 'lucide-react'
import { sendChatRequest } from '@/services/chat/chatApi'
import toast from 'react-hot-toast'

interface ChatRequestModalProps {
  isOpen: boolean
  onClose: () => void
  receiverNo: number
  receiverName: string
}

const ChatRequestModal = ({ isOpen, onClose, receiverNo, receiverName }: ChatRequestModalProps) => {
  const [initMessage, setInitMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await sendChatRequest(receiverNo, initMessage.trim() || undefined)
      toast.success('채팅 요청을 보냈습니다')
      onClose()
      setInitMessage('')
    } catch (error: any) {
      console.error('Failed to send chat request:', error)
      const errorMessage = error.response?.data?.message || '채팅 요청에 실패했습니다'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">채팅 요청</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold text-gray-900">{receiverName}</span>님에게
              채팅 요청을 보냅니다
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              첫 메시지 (선택사항)
            </label>
            <textarea
              value={initMessage}
              onChange={(e) => setInitMessage(e.target.value)}
              placeholder="안녕하세요! 같이 룸메를 하고 싶어서 연락드렸습니다."
              rows={4}
              maxLength={128}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              {initMessage.length} / 128
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? '전송 중...' : '요청 보내기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatRequestModal
