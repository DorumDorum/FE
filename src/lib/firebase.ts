import { getApp, getApps, initializeApp } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

let messagingPromise: Promise<Messaging | null> | null = null

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  // Firebase 초기화와 FCM 지원 여부를 한 번만 검사해서 Messaging 인스턴스를 가져옵니다.
  if (messagingPromise) {
    return messagingPromise
  }

  messagingPromise = (async () => {
    if (!firebaseConfig.apiKey) {
      console.warn('Firebase 설정이 없습니다. 환경변수를 확인하세요.')
      return null
    }

    const supported = await isSupported().catch(() => false)
    if (!supported) {
      console.warn('이 브라우저는 FCM을 지원하지 않습니다.')
      return null
    }

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    return getMessaging(app)
  })()

  return messagingPromise
}

