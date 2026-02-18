const API_BASE_URL = 'https://api.dorumdorum.com'

/**
 * API 엔드포인트 전체 URL을 생성합니다.
 * @param endpoint API 엔드포인트 경로 (예: '/api/users/profile/me')
 * @returns 전체 URL (예: 'https://api.dorumdorum.com/api/users/profile/me')
 */
export const getApiUrl = (endpoint: string): string => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${normalizedEndpoint}`
}
