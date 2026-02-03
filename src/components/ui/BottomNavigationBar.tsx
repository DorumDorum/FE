import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Home, Users, MessageCircle, Menu, Building2 } from 'lucide-react'

const BottomNavigationBar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [hasRoom, setHasRoom] = useState<boolean | null>(null)

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/home'
    }
    if (path === '/rooms/me') {
      return location.pathname === '/rooms/me'
    }
    if (path === '/me') {
      return location.pathname === '/me'
    }
    if (path === '/rooms/search') {
      return location.pathname === '/rooms/search'
    }
    return false
  }

  const getRoomManagementButtonClass = () => {
    return `flex items-center justify-center`
  }

  const getRoomManagementIconClass = () => {
    const active = isActive('/rooms/me')
    return `w-6 h-6 ${active ? 'text-[#3072E1]' : 'text-gray-600'}`
  }

  const getButtonClass = () => {
    return `flex items-center justify-center`
  }

  const getIconClass = (path: string) => {
    const active = isActive(path)
    return `w-6 h-6 ${active ? 'text-[#3072E1]' : 'text-gray-600'}`
  }

  useEffect(() => {
    const checkRoom = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setHasRoom(false)
          return
        }

        const res = await fetch('http://localhost:8080/api/rooms/me', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setHasRoom(res.ok)
      } catch (error) {
        console.error('[navigation] room check error', error)
        setHasRoom(false)
      }
    }

    checkRoom()
  }, [location.pathname])

  return (
    <nav className="bg-blue-50 border-t border-blue-100 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-around h-full">
        <button
          onClick={() => navigate('/home')}
          className={getButtonClass()}
        >
          <Home className={getIconClass('/home')} />
        </button>
        {hasRoom && (
          <button
            onClick={() => navigate('/rooms/me')}
            className={getRoomManagementButtonClass()}
          >
            <Building2 className={getRoomManagementIconClass()} />
          </button>
        )}
        <button
          onClick={() => navigate('/rooms/search')}
          className={getButtonClass()}
        >
          <Users className={getIconClass('/rooms/search')} />
        </button>
        <button className="flex items-center justify-center relative">
          <MessageCircle className="w-6 h-6 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
        </button>
        <button
          onClick={() => navigate('/me')}
          className={getButtonClass()}
        >
          <Menu className={getIconClass('/me')} />
        </button>
      </div>
    </nav>
  )
}

export default BottomNavigationBar
