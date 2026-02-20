import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App.tsx'
import './styles/globals.css'

// 브라우저 모드에서 실제 사용 가능한 뷰포트 높이 + 하단 툴바 높이(5번)
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream

if (!isStandalone) {
  const setViewportHeight = () => {
    const vh = window.innerHeight
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  }
  
  const setToolbarHeight = () => {
    // iOS (Safari, Chrome 등): 하단에 Android처럼 고정 툴바가 없어서 0 사용
    // PWA가 아니면 네비를 화면 맨 아래(bottom: 0)에 배치
    if (isIOS) {
      document.documentElement.style.setProperty('--toolbar-height', '0px')
      return
    }
    
    // Android Chrome 등: 하단 툴바 높이 계산 (5번)
    let bottomToolbarHeight = 50 // 기본값: 크롬 Android 하단 툴바
    
    if (window.visualViewport) {
      const visualHeight = window.visualViewport.height
      const innerHeight = window.innerHeight
      const diff = innerHeight - visualHeight
      const outerDiff = Math.max(0, window.outerHeight - window.innerHeight)
      
      if (diff > 0 || outerDiff > 0) {
        const measured = outerDiff > 0 ? outerDiff : diff
        if (measured >= 40 && measured <= 60) {
          bottomToolbarHeight = measured
        } else if (measured > 60) {
          bottomToolbarHeight = 50
        }
      }
    } else {
      const outerDiff = Math.max(0, window.outerHeight - window.innerHeight)
      if (outerDiff >= 40 && outerDiff <= 60) {
        bottomToolbarHeight = outerDiff
      }
    }
    
    document.documentElement.style.setProperty('--toolbar-height', `${bottomToolbarHeight}px`)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Toolbar Height]', {
        isIOS,
        visualViewport: window.visualViewport?.height,
        innerHeight: window.innerHeight,
        outerHeight: window.outerHeight,
        calculated: bottomToolbarHeight,
      })
    }
  }
  
  setViewportHeight()
  setToolbarHeight()
  
  window.addEventListener('resize', () => {
    setViewportHeight()
    // 약간의 딜레이를 주어 브라우저가 툴바를 숨기거나 보여준 후 계산
    setTimeout(setToolbarHeight, 100)
  })
  
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      setViewportHeight()
      setToolbarHeight()
    }, 100)
  })
  
  // Visual Viewport API 이벤트 리스너 (더 정확한 계산)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      setTimeout(setToolbarHeight, 50)
    })
    window.visualViewport.addEventListener('scroll', () => {
      setTimeout(setToolbarHeight, 50)
    })
  }
} else {
  document.documentElement.style.setProperty('--toolbar-height', '0px')
}

// PWA 업데이트 알림
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
