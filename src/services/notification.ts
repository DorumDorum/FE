import apiClient from './apiClient'

// 백엔드에 FCM 디바이스 토큰을 등록
export const sendFirebaseToken = (firebaseToken: string) =>
  apiClient.post('/api/notification', { firebaseToken })

