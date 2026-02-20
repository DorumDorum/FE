import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

const DISMISS_KEY = 'pwa-install-banner-dismissed'
const DISMISS_DAYS = 7

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (isStandalone()) return
    if (!isMobile()) return

    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const t = parseInt(dismissed, 10)
      if (Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    setVisible(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [mounted])

  const handleDismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setVisible(false)
    setDeferredPrompt(null)
  }

  const handleIOSInstall = () => {
    // iOS에서는 사용자에게 안내만 표시
    // 실제로는 Safari의 공유 버튼을 사용해야 함
    alert('Safari에서 공유 버튼(⬆️)을 누르고 "홈 화면에 추가"를 선택해주세요.')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 bg-gradient-to-t from-gray-900/95 to-gray-900/90 text-white shadow-lg">
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">앱처럼 사용해 보세요</p>
            <p className="text-xs text-gray-300 mt-0.5">
              홈 화면에 추가하면 주소창 없이 앱처럼 열립니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white p-1 flex-shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 다운로드 버튼 */}
        {deferredPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            앱 다운로드
          </button>
        ) : isIOS() ? (
          <button
            type="button"
            onClick={handleIOSInstall}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            홈 화면에 추가
          </button>
        ) : (
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 active:scale-[0.98] transition-all border border-white/20"
          >
            <Download className="w-4 h-4" />
            설치 방법 안내
          </button>
        )}
      </div>
    </div>
  )
}
