import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../utils/api'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const LoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const isValid = emailRegex.test(email) && password.length > 0

  const handleSubmit = () => {
    const doLogin = async () => {
      if (!isValid || isSubmitting) return
      setSubmitError('')
      setIsSubmitting(true)
      try {
        const res = await fetch(getApiUrl('/api/users/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        let data: any = null
        try {
          data = await res.json()
        } catch {
          // ignore
        }
        console.log('login response', { status: res.status, data })

        if (!res.ok) {
          let msg = data?.message
          if (!msg || msg === 'null' || msg === 'undefined') {
            msg = '로그인에 실패했습니다.'
          }
          throw new Error(msg)
        }

        // ResponseEntity<LoginResponse> 형식: { accessToken, refreshToken } 직접 접근
        const accessToken = data?.accessToken
        const refreshToken = data?.refreshToken

        if (accessToken) localStorage.setItem('accessToken', accessToken)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

        if (!accessToken) {
          throw new Error('토큰이 없습니다. 관리자에게 문의해주세요.')
        }

        navigate('/home', { replace: true })
      } catch (err) {
        if (err instanceof Error) {
          const msg = !err.message || err.message === 'null' || err.message === 'undefined'
            ? '로그인에 실패했습니다.'
            : err.message
          setSubmitError(msg)
        } else {
          setSubmitError('로그인에 실패했습니다.')
        }
      } finally {
        setIsSubmitting(false)
      }
    }
    void doLogin()
  }

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-white animate-fade-in">
      <div className="max-w-sm w-full mx-auto flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="px-4 pt-8 pb-3 flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -m-2 text-gray-700"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div
          className="flex-1 flex flex-col overflow-y-auto min-h-0 px-6 pb-8 space-y-6"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <h1 className="text-center text-lg font-bold text-black">로그인</h1>

          <div className="space-y-2">
            <FieldLabel>이메일</FieldLabel>
            <RoundedInput
              value={email}
              onChange={setEmail}
              placeholder="example@gachon.ac.kr"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>비밀번호</FieldLabel>
            <RoundedInput
              value={password}
              onChange={setPassword}
              placeholder="비밀번호를 입력하세요."
              type={showPassword ? 'text' : 'password'}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="p-1 text-gray-500 hover:text-gray-700"
                  aria-label="비밀번호 보기 전환"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white px-6 pb-10 pt-3 max-w-sm w-full mx-auto">
        {submitError && (
          <p className="text-xs text-red-500 font-semibold mb-2 text-center">{submitError}</p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className={`w-full py-4 rounded-xl text-base font-semibold shadow-sm transition ${
            isValid && !isSubmitting
              ? 'bg-[#3072E1] text-white active:scale-[0.99] hover:bg-[#2563E1]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          로그인
        </button>
      </div>
    </div>
  )
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-semibold text-black">{children}</p>
)

const RoundedInput = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  type = 'text',
  inputMode,
  rightIcon,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  rightIcon?: React.ReactNode
}) => (
  <div
    className={`relative rounded-xl border border-[#e8e2dc] bg-[#f5f1ee] px-4 py-3 ${
      disabled ? 'opacity-60' : ''
    } ${className}`}
  >
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-transparent outline-none text-base text-black placeholder:text-gray-500 ${
        rightIcon ? 'pr-8' : ''
      }`}
    />
    {rightIcon && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightIcon}
      </div>
    )}
  </div>
)

export default LoginPage

