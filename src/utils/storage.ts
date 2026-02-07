// 로컬 스토리지 키
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_ID: 'userId',
  FCM_TOKEN: 'fcmToken',
} as const

// 토큰 관리
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  setAccessToken: (token: string) => localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token),
  removeAccessToken: () => localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),

  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  setRefreshToken: (token: string) => localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token),
  removeRefreshToken: () => localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
}

// 유저 정보 관리
export const userStorage = {
  getUserId: () => localStorage.getItem(STORAGE_KEYS.USER_ID),
  setUserId: (userId: string) => localStorage.setItem(STORAGE_KEYS.USER_ID, userId),
  removeUserId: () => localStorage.removeItem(STORAGE_KEYS.USER_ID),
}

// FCM 토큰 관리
export const fcmStorage = {
  getFcmToken: () => localStorage.getItem(STORAGE_KEYS.FCM_TOKEN),
  setFcmToken: (token: string) => localStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token),
  removeFcmToken: () => localStorage.removeItem(STORAGE_KEYS.FCM_TOKEN),
}

// 전체 초기화 (로그아웃 시)
export const clearAllStorage = () => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER_ID)
  localStorage.removeItem(STORAGE_KEYS.FCM_TOKEN)
}
