import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/images/logo.png'
import { getApiUrl } from '@/utils/api'

const SplashPage = () => {
  const navigate = useNavigate()
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    let fadeTimer: NodeJS.Timeout | null = null
    let navTimer: NodeJS.Timeout | null = null
    let isCancelled = false

    const attemptAutoLogin = async () => {
      // HttpOnly refresh 쿠키 기반으로 토큰 재발급 시도
      try {
        const res = await fetch(getApiUrl('/api/token/reissue'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (isCancelled) return

        if (res.ok) {
          // 토큰 재발급 성공
          const data = await res.json()
          const newAccessToken = data?.accessToken

          if (newAccessToken) localStorage.setItem('accessToken', newAccessToken)

          // 홈 화면으로 리다이렉트
          fadeTimer = setTimeout(() => setIsFadingOut(true), 1300)
          navTimer = setTimeout(() => {
            if (!isCancelled) navigate('/home', { replace: true })
          }, 1900)
        } else {
          // 토큰 재발급 실패 (만료 등) - intro로 이동
          localStorage.removeItem('accessToken')
          fadeTimer = setTimeout(() => setIsFadingOut(true), 1300)
          navTimer = setTimeout(() => {
            if (!isCancelled) navigate('/intro', { replace: true })
          }, 1900)
        }
      } catch (error) {
        // 네트워크 오류 등 - intro로 이동
        if (isCancelled) return
        console.error('Auto login failed:', error)
        localStorage.removeItem('accessToken')
        fadeTimer = setTimeout(() => setIsFadingOut(true), 1300)
        navTimer = setTimeout(() => {
          if (!isCancelled) navigate('/intro', { replace: true })
        }, 1900)
      }
    }

    attemptAutoLogin()

    return () => {
      isCancelled = true
      if (fadeTimer) clearTimeout(fadeTimer)
      if (navTimer) clearTimeout(navTimer)
    }
  }, [navigate])

  return (
    <div
      className={`min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#3072E1] text-white animate-fade-in ${
        isFadingOut ? 'animate-fade-out' : ''
      }`}
    >
       <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center justify-center animate-scale-in">
          <img 
            src={logo} 
            alt="DorumDorum" 
            className="w-28 h-28 border-0" 
            style={{
              border: 'none',
              outline: 'none',
              display: 'block',
            }}
          />
        </div>
        <div className="text-2xl font-bold tracking-tight animate-slide-up">도룸도룸</div>
      </div>
    </div>
  )
}

export default SplashPage

