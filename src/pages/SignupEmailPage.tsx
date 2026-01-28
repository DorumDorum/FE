import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SignupEmailPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const isValid = emailRegex.test(email)
  const showError = touched && !isValid

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!isValid) return
    // TODO: 실제 회원가입 API 연동 후 다음 단계로 이동
    navigate('/rooms', { replace: true })
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-white animate-fade-in">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -m-2 text-gray-700"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col px-6 pt-4">
          <div className="mb-8">
            <p className="text-2xl font-black text-black leading-snug">
              본인 확인을 위해 <br /> 이메일을 입력해주세요.
            </p>
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <div className="rounded-xl border border-[#e8e2dc] bg-[#f5f1ee] px-4 py-3">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                className="w-full bg-transparent outline-none text-base text-black placeholder:text-gray-500"
              />
            </div>
            {showError && (
              <p className="text-xs text-red-500">이메일 형식이 올바르지 않습니다.</p>
            )}
          </form>
        </div>
      </div>

      <div className="px-6 pb-10 space-y-4 max-w-sm w-full mx-auto animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <p className="text-center text-xs text-gray-500 leading-relaxed">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full py-4 rounded-xl text-base font-semibold shadow-sm transition ${
            isValid
              ? 'bg-[#fcb44e] text-white active:scale-[0.99]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!isValid}
        >
          계속하기
        </button>
      </div>
    </div>
  )
}

export default SignupEmailPage

