import { useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const TAB_PATHS = ['/home', '/rooms/me', '/rooms/search', '/chats', '/me'] as const

const SWIPE_THRESHOLD = 60
const HORIZONTAL_RATIO = 1.5 // horizontal movement must be 1.5x vertical to count as swipe

type Props = {
  children: React.ReactNode
}

export default function SwipeableTabLayout({ children }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const currentIndex = TAB_PATHS.indexOf(location.pathname as (typeof TAB_PATHS)[number])
  const isTabPage = currentIndex >= 0

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isTabPage) return
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }, [isTabPage])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isTabPage || !touchStart.current) return
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const dx = endX - touchStart.current.x
      const dy = endY - touchStart.current.y

      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      if (absDx < SWIPE_THRESHOLD || absDx < absDy * HORIZONTAL_RATIO) {
        touchStart.current = null
        return
      }

      if (dx > 0) {
        // swipe right -> previous tab
        if (currentIndex > 0) {
          navigate(TAB_PATHS[currentIndex - 1])
        }
      } else {
        // swipe left -> next tab
        if (currentIndex < TAB_PATHS.length - 1) {
          navigate(TAB_PATHS[currentIndex + 1])
        }
      }
      touchStart.current = null
    },
    [isTabPage, currentIndex, navigate]
  )

  return (
    <div
      className="h-full w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  )
}
