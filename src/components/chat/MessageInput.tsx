import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend: (content: string) => void
  disabled?: boolean
}

const MessageInput = ({ onSend, disabled }: Props) => {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  // 텍스트 입력 시 textarea 높이 자동 조정
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`
  }, [value])

  return (
    <div className="flex items-end gap-2 px-3 py-2 bg-white border-t border-gray-100 flex-shrink-0">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="메시지를 입력하세요"
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-[#3072E1] disabled:opacity-50 overflow-y-auto"
        style={{ lineHeight: '1.5', maxHeight: '100px' }}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || disabled}
        className="w-9 h-9 rounded-full bg-[#3072E1] flex items-center justify-center disabled:opacity-40 flex-shrink-0 mb-0.5"
      >
        <Send className="w-4 h-4 text-white" />
      </button>
    </div>
  )
}

export default MessageInput
