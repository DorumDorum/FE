import { useState, useEffect, useCallback } from 'react'
import { Download, X, MoreVertical } from 'lucide-react'

const DISMISS_KEY = 'pwa-install-banner-dismissed'
const DISMISS_DAYS = 7

function isBeforeInstallPromptEvent(e: Event): e is BeforeInstallPromptEvent {
  return 'prompt' in e && typeof (e as BeforeInstallPromptEvent).prompt === 'function'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: boolean }).MSStream
}

async function checkAppInstalled(): Promise<boolean> {
  if (typeof navigator.getInstalledRelatedApps !== 'function') return false
  try {
    const relatedApps = await navigator.getInstalledRelatedApps()
    return relatedApps.length > 0
  } catch {
    return false
  }
}

export default function InstallAppBanner() {
  const [visible, setVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [appInstalled, setAppInstalled] = useState(false)
  const [installedCheckDone, setInstalledCheckDone] = useState(false)
  const [showAndroidGuide, setShowAndroidGuide] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const refreshAppInstalled = useCallback(async () => {
    const installed = await checkAppInstalled()
    setAppInstalled(installed)
    setInstalledCheckDone(true)
    if (installed) setVisible(false)
  }, [])

  // 설치 여부: 마운트 시 + 탭이 다시 보일 때(백그라운드에서 복귀) 재확인
  useEffect(() => {
    if (!mounted) return
    refreshAppInstalled()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshAppInstalled()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [mounted, refreshAppInstalled])

  // 배너 노출: standalone 아님, 모바일, 미설치 확인 후, 7일 미 dismiss
  useEffect(() => {
    if (!mounted || !installedCheckDone) return
    if (isStandalone()) return
    if (!isMobile()) return
    if (appInstalled) return

    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed) {
      const t = parseInt(dismissed, 10)
      if (Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
    }

    setVisible(true)
  }, [mounted, installedCheckDone, appInstalled])

  useEffect(() => {
    if (!mounted) return
    const handler = (e: Event) => {
      e.preventDefault()
      if (isBeforeInstallPromptEvent(e)) setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [mounted])

  const handleDismiss = () => {
    setVisible(false)
    setShowAndroidGuide(false)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    try {
      const { outcome } = await deferredPrompt.prompt()
      if (outcome === 'accepted') setVisible(false)
    } finally {
      setDeferredPrompt(null)
    }
  }

  const handleIOSInstall = async () => {
    if ('share' in navigator) {
      try {
        await navigator.share({
          title: '도룸도룸',
          text: '도룸도룸 앱을 홈 화면에 추가하세요',
          url: window.location.href,
        })
      } catch {
        // 사용자 취소 또는 에러
      }
    } else {
      alert('Safari에서 공유 버튼(⬆️)을 누르고 "홈 화면에 추가"를 선택해주세요.')
    }
  }

  const handleAndroidGuide = () => {
    setShowAndroidGuide(true)
  }

  if (!visible) return null

  return (
    <>
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
              onClick={handleAndroidGuide}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all shadow-sm"
            >
              <MoreVertical className="w-4 h-4" />
              설치 방법 안내
            </button>
          )}
        </div>
      </div>

      {/* Android 수동 안내: AOS는 beforeinstallprompt 미지원 → 홈 화면에 추가 방법 안내 */}
      {showAndroidGuide && (
        <div
          className="fixed inset-0 z-[101] bg-black/50 flex items-end justify-center"
          onClick={() => setShowAndroidGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-label="홈 화면에 추가 방법"
        >
          <div
            className="w-full max-w-[430px] bg-white rounded-t-2xl px-6 pt-6 pb-8 safe-area-pb"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="text-lg font-bold text-gray-900 mb-4">홈 화면에 추가하는 방법</h3>
            <ol className="text-sm text-gray-700 space-y-3 list-decimal list-inside">
              <li>브라우저 우측 상단 <strong>메뉴(⋮)</strong>를 누르세요.</li>
              <li><strong>홈 화면에 추가</strong> 또는 <strong>앱 설치</strong>를 선택하세요.</li>
              <li>표시되는 안내에 따라 추가를 완료하세요.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowAndroidGuide(false)}
              className="mt-6 w-full py-3 bg-[#3072E1] text-white font-semibold rounded-xl"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
