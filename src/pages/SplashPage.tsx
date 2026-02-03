import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '@/assets/images/logo.png'

const SplashPage = () => {
  const navigate = useNavigate()
  const [isFadingOut, setIsFadingOut] = useState(false)

  useEffect(() => {
    // 페이드인(0~0.6s) 이후 잠시 머물렀다가 페이드아웃(0.6s) → 네비게이션
    const fadeTimer = setTimeout(() => setIsFadingOut(true), 1300) // +0.2s 머무름
    const navTimer = setTimeout(() => navigate('/intro', { replace: true }), 1900)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
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

