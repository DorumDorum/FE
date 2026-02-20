import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'

interface NotificationItem {
  id: number
  title: string
  body: string
  createdAt: string
  read: boolean
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        setLoading(true)

        // TODO: 실제 알림 API로 교체 (예: /api/notifications)
        // 일단은 더미 데이터로 UI만 구성
        const dummy: NotificationItem[] = [
          {
            id: 1,
            title: '새 룸메이트 지원 요청',
            body: '도룸도룸 302호 방에 새로운 지원자가 있어요.',
            createdAt: '방금 전',
            read: false,
          },
          {
            id: 2,
            title: '공지사항 업데이트',
            body: '생활 수칙이 일부 변경되었어요. 확인해 주세요.',
            createdAt: '1시간 전',
            read: true,
          },
        ]

        setNotifications(dummy)
      } catch (e) {
        console.error('[notifications] fetch error', e)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [navigate])


  return (
    <div className="page-with-bottom-nav h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
      >
        {/* 헤더 */}
        <header className="bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1 mr-2 rounded hover:bg-gray-100"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="flex-1 text-2xl font-bold text-gray-900">알림</h1>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="px-4 pt-2 pb-4 space-y-3">
          {loading ? (
            <div className="text-sm text-gray-500 text-center py-10">불러오는 중...</div>
          ) : notifications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-gray-500">아직 받은 알림이 없어요.</p>
              </div>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border rounded-xl p-4 shadow-sm transition-colors ${
                  n.read ? 'border-gray-200' : 'border-[#3072E1] bg-blue-50/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{n.title}</p>
                    <p className="text-xs text-gray-600 mb-1 whitespace-pre-line">{n.body}</p>
                    <p className="text-[11px] text-gray-400">{n.createdAt}</p>
                  </div>
                  {!n.read && (
                    <span className="ml-2 mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#3072E1] text-white">
                      새 알림
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNavigationBar />
    </div>
  )
}

export default NotificationsPage

