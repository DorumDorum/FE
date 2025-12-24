import axios from 'axios'

// 공통 API 클라이언트: .env의 VITE_API_BASE_URL 기준으로 요청을 보냅니다.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})

// localStorage.accessToken이 있으면 Authorization 헤더에 자동으로 붙입니다.
apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

export default apiClient

