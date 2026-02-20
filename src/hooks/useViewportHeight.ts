import { useEffect } from 'react'

/**
 * 브라우저의 하단 네비게이션 바를 고려한 실제 사용 가능한 뷰포트 높이를 설정합니다.
 * 브라우저 모드에서만 적용되며, PWA 모드에서는 적용되지 않습니다.
 */
export function useViewportHeight() {
  useEffect(() => {
    // PWA 모드가 아닐 때만 적용
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      return
    }

    const setViewportHeight = () => {
      // 실제 사용 가능한 높이 측정
      const vh = window.innerHeight
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    // 초기 설정
    setViewportHeight()

    // 리사이즈 및 오리엔테이션 변경 시 업데이트
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)

    return () => {
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
    }
  }, [])
}
