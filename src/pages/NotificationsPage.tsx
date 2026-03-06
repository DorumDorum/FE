import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'
import SectionLoading from '@/components/ui/SectionLoading'
import { NotificationEvent } from '@/services/notification'

type NotificationItem = Required<Pick<NotificationEvent, 'title' | 'body'>> & {
  id: number
  createdAt: string
  read: boolean
}

const NotificationsPage = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // TODO: 전역 알림 상태를 도입하면 여기에서 구독해서 렌더링하도록 변경
    setLoading(false)
  }, [])


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
            <SectionLoading variant="list" className="py-4" />
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

