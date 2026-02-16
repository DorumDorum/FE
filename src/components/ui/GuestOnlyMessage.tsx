import { useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

type GuestOnlyMessageProps = {
  /** 홈 등 박스 내에서 사용 시 true - 로그인 박스와 동일한 크기 */
  compact?: boolean
}

const GuestOnlyMessage = ({ compact = false }: GuestOnlyMessageProps) => {
  const navigate = useNavigate()

  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-base font-medium text-gray-700 mb-1.5">
          로그인 후 이용가능합니다.
        </p>
        <p className="text-xs text-gray-500 mb-4">
          로그인 후 이용해 주세요.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-[#3072E1] text-white px-6 py-2.5 rounded-lg text-base font-medium hover:bg-[#2563E1] active:scale-[0.99] transition-colors"
        >
          로그인
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] px-4">
      <UserPlus className="w-12 h-12 text-gray-300 mb-4" />
      <p className="text-base font-medium text-gray-700 mb-4">
        로그인 후 이용가능합니다.
      </p>
      <button
        onClick={() => navigate('/login')}
        className="bg-[#3072E1] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#2563E1] active:scale-[0.99] transition-colors"
      >
        로그인
      </button>
    </div>
  )
}

export default GuestOnlyMessage
