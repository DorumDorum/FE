import { useNavigate } from 'react-router-dom'

const IntroPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-sm w-full mx-auto">
        <div className="space-y-3">
          <p className="text-2xl font-bold text-black leading-snug">
            룸메이트 매칭을 <br /> 시작해볼까요?
          </p>
        </div>
      </div>
      <div className="px-6 pb-10 max-w-sm w-full mx-auto space-y-3">
        <button
          onClick={() => navigate('/signup')}
          className="w-full py-4 bg-[#3072E1] text-white text-base font-semibold rounded-xl shadow-sm active:scale-[0.99] transition hover:bg-[#2563E1] animate-slide-up"
          style={{ animationDelay: '0.05s' }}
        >
          시작하기
        </button>
        <button
          onClick={() => navigate('/login')}
          className="w-full py-4 bg-blue-50 text-blue-600 text-base font-semibold rounded-xl border border-blue-200 shadow-sm active:scale-[0.99] transition hover:bg-blue-100 animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          로그인하기
        </button>
      </div>
    </div>
  )
}

export default IntroPage

