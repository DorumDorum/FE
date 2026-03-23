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
      <div className="flex flex-col items-end mb-2">
        <div className="max-w-[240px] rounded-2xl px-3 py-2 text-sm bg-[#3072E1] text-white rounded-br-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {showTime && (
          <div className="flex items-center gap-1 mt-0.5">
            {(message.unreadCount ?? 0) > 0 && (
              <span className="text-xs text-[#3072E1] font-medium leading-none">
                {message.unreadCount}
              </span>
            )}
            <span className="text-xs text-gray-400 leading-none">{time}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-end gap-1 mb-2 justify-start">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 self-end mb-1">
        <span className="text-blue-600 font-bold text-xs">?</span>
      </div>
      <div className="flex items-end gap-1">
        <div className="max-w-[240px] rounded-2xl px-3 py-2 text-sm bg-gray-100 text-gray-900 rounded-bl-sm">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {showTime && (
          <div className="flex flex-col items-start gap-0.5 mb-1">
            {(message.unreadCount ?? 0) > 0 && (
              <span className="text-xs text-[#3072E1] font-medium leading-none">
                {message.unreadCount}
              </span>
            )}
            <span className="text-xs text-gray-400 leading-none">{time}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
