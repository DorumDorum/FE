import type { NavigateFunction } from 'react-router-dom'
import toast from 'react-hot-toast'

const LIVE_CHAT_TOAST_ID = 'live-chat-notification'

const toRoomId = (value: unknown): string | null => {
  if (typeof value === 'string' && value.trim()) {
    return value
  }
  if (typeof value === 'number') {
    return String(value)
  }
  return null
}

export const extractMessageRoomId = (payload: Record<string, any> | undefined): string | null => {
  if (!payload) return null

  return (
    toRoomId(payload.messageRoomId) ??
    toRoomId(payload.messageRoomNo) ??
    toRoomId(payload.roomId) ??
    toRoomId(payload.roomNo)
  )
}

interface ShowChatNavigationToastParams {
  title: string
  description?: string
  icon?: string
  roomId: string | null
  navigate: NavigateFunction
  duration?: number
}

export const showChatNavigationToast = ({
  title,
  description,
  icon = '🔔',
  roomId,
  navigate,
  duration = 4000,
}: ShowChatNavigationToastParams) => {
  // 새 알림이 오면 기존 실시간 알림을 덮어쓴다.
  toast.dismiss(LIVE_CHAT_TOAST_ID)

  toast.custom(
    (toastInfo) => (
      <button
        type="button"
        onClick={() => {
          toast.dismiss(toastInfo.id)
          if (!roomId) return
          navigate(`/chats/${roomId}`)
        }}
        className="w-[340px] max-w-[92vw] rounded-xl border border-gray-200 bg-white px-4 py-3 text-left shadow-lg transition hover:bg-gray-50"
      >
        <div className="flex items-start gap-3">
          <span className="text-lg leading-6">{icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {description ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{description}</p>
            ) : null}
            {roomId ? (
              <p className="mt-1 text-[11px] font-medium text-blue-600">탭하면 채팅방으로 이동합니다</p>
            ) : null}
          </div>
        </div>
      </button>
    ),
    {
      id: LIVE_CHAT_TOAST_ID,
      duration,
      position: 'top-center',
    }
  )
}
