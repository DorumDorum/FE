/// <reference types="vite/client" />

/** PWA: BeforeInstallPrompt - 한 번 사용 후 초기화 권장 (일회성) */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/** PWA: getInstalledRelatedApps - manifest related_applications와 매칭된 설치 앱 목록 */
interface RelatedApplication {
  id?: string
  platform: string
  url?: string
  version?: string
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
  interface Navigator {
    getInstalledRelatedApps?: () => Promise<RelatedApplication[]>
  }
}

export {}

