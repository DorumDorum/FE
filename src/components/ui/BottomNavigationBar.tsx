import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Users, MessageCircle, Menu, Building2 } from 'lucide-react'

const BottomNavigationBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

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
    if (path === '/chats') {
      return location.pathname === '/chats'
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

  return (
    <nav className="bg-blue-50 border-t border-blue-100 px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-around h-full">
        <button
          onClick={() => navigate('/home')}
          className={getButtonClass()}
        >
          <Home className={getIconClass('/home')} />
        </button>
        <button
          onClick={() => navigate('/rooms/me')}
          className={getRoomManagementButtonClass()}
        >
          <Building2 className={getRoomManagementIconClass()} />
        </button>
        <button
          onClick={() => navigate('/rooms/search')}
          className={getButtonClass()}
        >
          <Users className={getIconClass('/rooms/search')} />
        </button>
        <button
          onClick={() => navigate('/chats')}
          className={getButtonClass()}
        >
          <div className="relative">
            <MessageCircle className={getIconClass('/chats')} />
            {/* TODO: 새 메시지 있으면 빨간 점 표시 */}
            {/* <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span> */}
          </div>
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
