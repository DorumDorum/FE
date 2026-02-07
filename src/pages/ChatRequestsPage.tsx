import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, X } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { decideChatRequest } from '@/services/chat/chatApi'
import { MessageRequestDecision } from '@/types/chat'
import toast from 'react-hot-toast'

const ChatRequestsPage = () => {
  const navigate = useNavigate()
  const { pendingRequests, removePendingRequest } = useChatStore()

  const handleDecision = async (
    messageRequestNo: string, // number → string
    decision: MessageRequestDecision
  ) => {
    try {
      await decideChatRequest(messageRequestNo, decision)
      removePendingRequest(messageRequestNo)
      
      const message =
        decision === MessageRequestDecision.APPROVE
          ? '채팅 요청을 수락했습니다'
          : '채팅 요청을 거절했습니다'
      
      toast.success(message)
    } catch (error: any) {
      console.error('Failed to decide chat request:', error)
      const errorMessage =
        error.response?.data?.message || '요청 처리에 실패했습니다'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/chats')}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">채팅 요청</h1>
      </header>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {pendingRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-sm">받은 채팅 요청이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.messageRequestNo}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="mb-3">
                  <p className="font-semibold text-gray-900 mb-1">
                    {request.senderName}님의 채팅 요청
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(request.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleDecision(
                        request.messageRequestNo,
                        MessageRequestDecision.REJECT
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">거절</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDecision(
                        request.messageRequestNo,
                        MessageRequestDecision.APPROVE
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">수락</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatRequestsPage
