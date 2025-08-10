import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, _password: string) => {
    try {
      // 실제로는 API 호출
      const mockUser: User = {
        id: '1',
        name: '테스트 사용자',
        email: email,
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      return { success: true }
    } catch (error) {
      return { success: false, error: '로그인에 실패했습니다.' }
    }
  }

  const register = async (name: string, email: string, _password: string) => {
    try {
      // 실제로는 API 호출
      const mockUser: User = {
        id: '1',
        name: name,
        email: email,
      }
      
      setUser(mockUser)
      localStorage.setItem('user', JSON.stringify(mockUser))
      return { success: true }
    } catch (error) {
      return { success: false, error: '회원가입에 실패했습니다.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    navigate('/login')
  }

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }
}
