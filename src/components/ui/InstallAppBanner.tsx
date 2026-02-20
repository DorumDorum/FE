import { useState, useEffect } from 'react'

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

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 pt-2 bg-gradient-to-t from-gray-900/95 to-gray-900/90 text-white shadow-lg">
      <div className="max-w-[430px] mx-auto flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">앱처럼 사용해 보세요</p>
          <p className="text-xs text-gray-300 mt-0.5">
            홈 화면에 추가하면 주소창 없이 앱처럼 열립니다.
          </p>
          {deferredPrompt ? (
            <button
              type="button"
              onClick={handleInstall}
              className="mt-2 px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-lg"
            >
              앱 설치
            </button>
          ) : isIOS() ? (
            <p className="text-xs text-gray-400 mt-2">
              Safari에서 공유 버튼 → &quot;홈 화면에 추가&quot;
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
