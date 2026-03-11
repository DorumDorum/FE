import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

// 공통 API 클라이언트: api.ts의 API_BASE_URL 사용 (getApiUrl과 동일)
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export default apiClient

