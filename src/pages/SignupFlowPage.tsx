import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SignupFlowPage = () => {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [sendCodeError, setSendCodeError] = useState('')
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [verifyCodeError, setVerifyCodeError] = useState('')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [cooldown, setCooldown] = useState(0) // seconds

  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)

  const [nicknameSeed, setNicknameSeed] = useState(0)
  const [nickname, setNickname] = useState('')

  // unlock flags: 한번 노출되면 입력을 지워도 섹션을 유지
  const [unlockedName, setUnlockedName] = useState(false)
  const [unlockedStudentId, setUnlockedStudentId] = useState(false)
  const [unlockedGender, setUnlockedGender] = useState(false)
  const [unlockedPassword, setUnlockedPassword] = useState(false)
  const [unlockedPasswordConfirm, setUnlockedPasswordConfirm] = useState(false)
  const [unlockedNickname, setUnlockedNickname] = useState(false)

  const autoNickname = useMemo(() => {
    const moods = [
      '기분좋은', '행복한', '웃고있는', '신나는', '차분한', '따뜻한', '상냥한', '평온한', '산뜻한', '유쾌한',
      '싱그러운', '맑은', '편안한', '즐거운', '훈훈한', '온화한', '명랑한', '반짝이는', '산들산들한', '포근한',
      '순한', '밝은', '잔잔한', '따사로운', '설레는', '해사한', '눈부신', '은은한', '다정한', '선선한',
      '뽀송한', '보드라운', '향기로운', '햇살가득한', '초록초록한', '포근포근한', '말랑한', '미소짓는', '환한', '싱글벙글한',
      '따끈한', '싱싱한', '상쾌한', '반가운', '활기찬', '아늑한', '달콤한', '여유로운', '든든한', '희망찬'
    ]
    const animals = [
      '고양이', '강아지', '여우', '코알라', '다람쥐', '펭귄', '수달', '토끼', '부엉이', '햄스터',
      '고슴도치', '판다', '사슴', '고래', '돌고래', '바다거북', '기린', '미어캣', '너구리', '라쿤',
      '치타', '하늘다람쥐', '앵무새', '살쾡이', '고라니', '두루미', '두더지', '바다사자', '문어',
      '물개', '수리부엉이', '까치', '비버', '퓨마', '표범', '재규어', '알파카', '라마', '양',
      '염소', '말', '기니피그', '카피바라', '바위너구리', '청설모', '참새', '북극여우', '사막여우', '딱따구리', '홍학'
    ]
    const mood = moods[Math.floor(Math.random() * moods.length)]
    const animal = animals[Math.floor(Math.random() * animals.length)]
    return `${mood}${animal}`
  }, [isEmailVerified, studentId, nicknameSeed])

  // autoNickname 변경 시 입력값을 최신 자동 생성값으로 교체
  useEffect(() => {
    setNickname(autoNickname)
  }, [autoNickname])

  const passwordsMatch = password.length >= 8 && passwordConfirm.length > 0 && password === passwordConfirm

  // unlock 흐름: 조건을 한 번 만족하면 섹션 유지
  useEffect(() => {
    if (isEmailVerified) setUnlockedName(true)
  }, [isEmailVerified])

  useEffect(() => {
    if (name.trim().length > 0) setUnlockedStudentId(true)
  }, [name])

  useEffect(() => {
    if (studentId.trim().length > 0) setUnlockedGender(true)
  }, [studentId])

  useEffect(() => {
    if (gender) setUnlockedPassword(true)
  }, [gender])

  useEffect(() => {
    if (password.length > 0) setUnlockedPasswordConfirm(true)
  }, [password])

  useEffect(() => {
    if (passwordsMatch) setUnlockedNickname(true)
  }, [passwordsMatch])

  const canSendCode = emailRegex.test(email)
  const codeReady = code.trim().length >= 4
  const canVerify = isCodeSent && codeReady && !isEmailVerified

  const showName = unlockedName
  const showStudentId = unlockedStudentId
  const showGender = unlockedGender
  const showPasswordField = unlockedPassword
  const showPasswordConfirmField = unlockedPasswordConfirm
  const showNickname = unlockedNickname

  const canSubmit = showNickname && passwordsMatch && nickname.trim().length > 0 && !isSubmitting

  // cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleSendCode = async () => {
    if (!canSendCode || cooldown > 0 || isSendingCode) return
    setSendCodeError('')
    setIsSendingCode(true)
    try {
      const params = new URLSearchParams({ email })
      const res = await fetch(`http://localhost:8080/api/email/send?${params.toString()}`, {
        method: 'POST',
      })
      if (!res.ok) {
        let msg = '인증번호 전송에 실패했습니다. 잠시 후 다시 시도해주세요.'
        try {
          const data = await res.json()
          if (data?.message) msg = data.message
        } catch {
          const text = await res.text()
          if (text) msg = text
        }
        throw new Error(msg)
      }
      setIsCodeSent(true)
      setCooldown(60) // 60s cooldown
    } catch (err) {
      const msg = err instanceof Error ? err.message : '인증번호 전송에 실패했습니다. 잠시 후 다시 시도해주세요.'
      setSendCodeError(msg)
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!canVerify || isVerifyingCode) return
    setVerifyCodeError('')
    setIsVerifyingCode(true)
    try {
      const params = new URLSearchParams({ email, code })
      const res = await fetch(`http://localhost:8080/api/email/verify?${params.toString()}`, {
        method: 'POST',
      })
      if (!res.ok) {
        let msg = '인증에 실패했습니다. 인증번호를 확인해주세요.'
        try {
          const data = await res.json()
          if (data?.message) msg = data.message
        } catch {
          const text = await res.text()
          if (text) msg = text
        }
        throw new Error(msg)
      }
      setIsEmailVerified(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '인증에 실패했습니다. 잠시 후 다시 시도해주세요.'
      setVerifyCodeError(msg)
    } finally {
      setIsVerifyingCode(false)
    }
  }

  const handleSubmit = () => {
    const doSubmit = async () => {
      if (!canSubmit || isSubmitting) return
      setSubmitError('')
      setIsSubmitting(true)
      try {
        const res = await fetch('http://localhost:8080/api/users/sign-up', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            nickname,
            email,
            password,
            passwordCheck: passwordConfirm,
            gender,
            studentNo: studentId,
          }),
        })
        if (!res.ok) {
          let msg = '회원가입에 실패했습니다. 다시 시도해주세요.'
          try {
            const data = await res.json()
            if (data?.message) msg = data.message
          } catch {
            const text = await res.text()
            if (text) msg = text
          }
          throw new Error(msg)
        }
        setIsCompleted(true)
      } catch (err) {
        const msg = err instanceof Error ? err.message : '회원가입에 실패했습니다. 다시 시도해주세요.'
        setSubmitError(msg)
      } finally {
        setIsSubmitting(false)
      }
    }
    void doSubmit()
  }

  if (isCompleted) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-white animate-fade-in">
        <div className="max-w-sm w-full mx-auto flex-1 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-6">
            <p className="text-lg font-bold text-black">회원가입이 완료되었습니다!</p>
            <p className="text-base font-medium text-black">함께할 룸메이트를 만나러 가볼까요?</p>
          </div>
          <div className="sticky bottom-0 bg-white px-6 pb-10 pt-3 max-w-sm w-full mx-auto">
            <button
              type="button"
              onClick={() => navigate('/rooms', { replace: true })}
              className="w-full py-4 rounded-xl text-base font-semibold shadow-sm transition bg-[#fcb44e] text-white active:scale-[0.99]"
            >
              시작하기
            </button>
          </div>
        </div>
      </div>
    )
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
          className="flex-1 flex flex-col overflow-y-auto min-h-0 px-6 pb-8 space-y-5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <h1 className="text-center text-lg font-bold text-black">회원가입</h1>

          {/* 이메일 + 인증 */}
          <div className="space-y-2">
            <FieldLabel>이메일</FieldLabel>
            <RoundedInput
              value={email}
              onChange={setEmail}
              placeholder="example@example.com"
              type="email"
              disabled={isEmailVerified}
            />
            <div className="flex items-center gap-2">
              <RoundedInput
                value={code}
                onChange={setCode}
                placeholder="인증번호 입력"
                className="flex-1"
                disabled={isEmailVerified || !isCodeSent}
              />
                <button
                  type="button"
                  onClick={handleSendCode}
                disabled={!canSendCode || cooldown > 0 || isEmailVerified || isSendingCode}
                  className={`px-3 py-3 rounded-xl text-sm font-semibold ${
                  canSendCode && cooldown === 0 && !isEmailVerified && !isSendingCode
                      ? 'bg-[#fcb44e] text-white active:scale-[0.99]'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSendingCode
                    ? '전송중...'
                    : cooldown > 0
                      ? `${cooldown}초`
                      : isCodeSent
                        ? '재전송'
                        : '전송'}
                </button>
            </div>
            {sendCodeError && (
              <p className="text-xs text-red-500 font-semibold">{sendCodeError}</p>
            )}
            {verifyCodeError && (
              <p className="text-xs text-red-500 font-semibold">{verifyCodeError}</p>
            )}
            {isCodeSent && !isEmailVerified && (
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={!canVerify || isVerifyingCode}
                className={`w-full py-3 rounded-xl text-sm font-semibold ${
                  canVerify && !isVerifyingCode
                    ? 'bg-black text-white active:scale-[0.99]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isVerifyingCode ? '인증 중...' : '인증하기'}
              </button>
            )}
            {isEmailVerified && (
              <p className="text-xs text-green-600 font-semibold">이메일 인증 완료</p>
            )}
          </div>

          {/* 이름 */}
          {showName && (
            <div className="space-y-2 animate-slide-up">
              <FieldLabel>이름</FieldLabel>
              <RoundedInput
                value={name}
                onChange={setName}
                placeholder="이름을 입력하세요"
              />
            </div>
          )}

          {/* 학번 */}
          {showStudentId && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <FieldLabel>학번</FieldLabel>
              <RoundedInput
                value={studentId}
                onChange={setStudentId}
                placeholder="학번을 입력하세요"
                inputMode="numeric"
              />
            </div>
          )}

          {/* 성별 */}
          {showGender && (
            <div className="space-y-2 animate-slide-up">
              <FieldLabel>성별</FieldLabel>
              <div className="flex gap-2">
                {[
                  { label: '남성', value: 'MALE' },
                  { label: '여성', value: 'FEMALE' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`flex-1 py-3 rounded-xl border text-sm font-semibold transition ${
                      gender === opt.value
                        ? 'border-[#fcb44e] bg-orange-50 text-[#fcb44e]'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 비밀번호 */}
          {showPasswordField && (
            <div className="space-y-2 animate-slide-up">
              <FieldLabel>비밀번호 (8자 이상)</FieldLabel>
              <RoundedInput
                value={password}
                onChange={setPassword}
                placeholder="비밀번호를 입력하세요"
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
          )}

          {/* 비밀번호 확인 */}
          {showPasswordConfirmField && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <FieldLabel>비밀번호 확인</FieldLabel>
              <RoundedInput
                value={passwordConfirm}
                onChange={setPasswordConfirm}
                placeholder="비밀번호를 한번 더 입력하세요"
                type={showPasswordConfirm ? 'text' : 'password'}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    aria-label="비밀번호 확인 보기 전환"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
              {passwordConfirm.length > 0 && password !== passwordConfirm && (
                <p className="text-xs text-red-500 font-semibold">비밀번호가 일치하지 않습니다.</p>
              )}
              {password.length > 0 && password.length < 8 && (
                <p className="text-xs text-red-500 font-semibold">8자 이상 입력해주세요.</p>
              )}
            </div>
          )}

          {/* 자동생성 닉네임 */}
          {showNickname && (
            <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between">
                <FieldLabel>닉네임</FieldLabel>
                <button
                  type="button"
                  onClick={() => setNicknameSeed((v) => v + 1)}
                  className="text-xs text-[#fcb44e] font-semibold px-2 py-1 rounded hover:bg-orange-50 active:scale-[0.99]"
                >
                  새로고침
                </button>
              </div>
              <RoundedInput
                value={nickname}
                onChange={setNickname}
                placeholder={autoNickname}
              />
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white px-6 pb-10 pt-3 max-w-sm w-full mx-auto">
        {submitError && (
          <p className="text-xs text-red-500 font-semibold mb-2 text-center">{submitError}</p>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl text-base font-semibold shadow-sm transition ${
            canSubmit
              ? 'bg-[#fcb44e] text-white active:scale-[0.99]'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          완료
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
    className={`relative rounded-xl border border-[#e8e2dc] bg-[#f5f1ee] px-4 py-3 ${disabled ? 'opacity-60' : ''} ${className}`}
  >
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-transparent outline-none text-base text-black placeholder:text-gray-500 ${rightIcon ? 'pr-8' : ''}`}
    />
    {rightIcon && (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {rightIcon}
      </div>
    )}
  </div>
)

export default SignupFlowPage

