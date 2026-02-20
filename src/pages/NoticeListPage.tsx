import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft, ChevronLeft } from 'lucide-react'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'
import SectionLoading from '@/components/ui/SectionLoading'
import { getApiUrl } from '@/utils/api'

const NoticeListPage = () => {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<Array<{ noticeNo: number; title: string; content: string; writtenDate: string; originalLink: string }>>([])
  const [loadingNotices, setLoadingNotices] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const totalPages = Math.ceil(notices.length / itemsPerPage)
  
  // 현재 페이지 주변 4개의 페이지 번호 계산
  const getVisiblePages = () => {
    const maxVisible = 4
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    // 끝에 도달했을 때 시작점 조정
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        setLoadingNotices(true)

        const res = await fetch(getApiUrl('/api/notices'), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        if (res.ok) {
          const contentType = res.headers.get('content-type') ?? ''
          const rawBody = await res.text()
          
          let data: any
          try {
            data = rawBody ? JSON.parse(rawBody) : null
          } catch (e) {
            console.error('[notices] parse error', { contentType, rawBody }, e)
            return
          }

          // ResponseEntity 형식: 직접 접근
          const payload = data
          if (Array.isArray(payload)) {
            setNotices(payload)
          }
        }
      } catch (error) {
        console.error('[notices] fetch error', error)
      } finally {
        setLoadingNotices(false)
      }
    }

    fetchNotices()
  }, [navigate])

  return (
    <div className="page-with-bottom-nav h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* 헤더 */}
        <header className="bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="px-4 pt-2 pb-4">
          {loadingNotices ? (
            <SectionLoading variant="notice" className="py-4" />
          ) : notices.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-gray-500">공지사항이 없습니다.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {notices
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((notice) => (
                  <div
                    key={notice.noticeNo}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => navigate(`/notices/${notice.noticeNo}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {notice.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {notice.writtenDate}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      {/* 페이지네이션 - 하단 고정 */}
      {notices.length > itemsPerPage && (
        <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-1 mx-2">
              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-[#3072E1] text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      <BottomNavigationBar />
    </div>
  )
}

export default NoticeListPage
