import { format } from 'date-fns'
import type { ChatMessage } from '@/types/chat'

interface Props {
  message: ChatMessage
  myUserNo: string
  showTime?: boolean
}

const MessageBubble = ({ message, myUserNo, showTime = true }: Props) => {
  const isMe = message.senderNo === myUserNo
  const time = format(new Date(message.sentAt), 'HH:mm')

  if (message.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-3 py-1">
          {message.content}
        </span>
      </div>
    )
  }

  if (isMe) {
    return (
      <div className="flex flex-col items-end mb-2 pr-1">
        <div className="flex items-end gap-1.5 justify-end">
          {showTime && (
            <div className="flex flex-col items-end gap-0.5 mb-0.5">
              {(message.unreadCount ?? 0) > 0 && (
                <span className="text-[10px] text-[#3072E1] font-bold leading-none">
                  {message.unreadCount}
                </span>
              )}
              <span className="text-[10px] text-gray-400 leading-none">{time}</span>
            </div>
          )}
          <div className="max-w-[240px] rounded-2xl px-3 py-2 text-sm bg-[#3072E1] text-white rounded-tr-sm shadow-sm">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col mb-3 pl-1">
      <div className="flex items-start gap-2">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
          <span className="text-blue-500 font-bold text-sm">
            {message.senderNickname?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-gray-700 ml-0.5">
            {message.senderNickname || '알 수 없음'}
          </span>
          <div className="flex items-end gap-1.5">
            <div className="max-w-[240px] rounded-2xl px-3 py-2 text-sm bg-white border border-gray-100 text-gray-900 rounded-tl-sm shadow-sm">
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            {showTime && (
              <div className="flex flex-col items-start gap-0.5 mb-0.5">
                {(message.unreadCount ?? 0) > 0 && (
                  <span className="text-[10px] text-[#3072E1] font-bold leading-none">
                    {message.unreadCount}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 leading-none">{time}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
