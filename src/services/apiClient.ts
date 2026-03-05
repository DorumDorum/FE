import axios from 'axios'

// 공통 API 클라이언트: .env의 VITE_API_BASE_URL 기준으로 요청을 보냅니다.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
})

export default apiClient

