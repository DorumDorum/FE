import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'

const NoticeDetailPage = () => {
  const navigate = useNavigate()
  const { noticeNo } = useParams<{ noticeNo: string }>()
  const [notice, setNotice] = useState<{ noticeNo: number; title: string; content: string; writtenDate: string; originalLink: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        setLoading(true)

        const res = await fetch('http://localhost:8080/api/notices', {
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

          const payload = data?.result ?? data?.data ?? data
          if (Array.isArray(payload)) {
            const foundNotice = payload.find((n: any) => String(n.noticeNo) === noticeNo)
            if (foundNotice) {
              setNotice(foundNotice)
            } else {
              navigate('/notices', { replace: true })
            }
          }
        }
      } catch (error) {
        console.error('[notice] fetch error', error)
        navigate('/notices', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    if (noticeNo) {
      fetchNotice()
    } else {
      navigate('/notices', { replace: true })
    }
  }, [noticeNo, navigate])

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
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
          {loading ? (
            <div className="text-sm text-gray-500 text-center py-10">
              불러오는 중...
            </div>
          ) : !notice ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-gray-500">공지사항을 찾을 수 없습니다.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {notice.title}
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  {notice.writtenDate}
                </p>
                {notice.originalLink && (
                  <a
                    href={notice.originalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    원문 보기
                  </a>
                )}
              </div>
              {notice.content && (
                <div 
                  className="prose prose-sm max-w-none text-gray-900"
                  dangerouslySetInnerHTML={{ __html: notice.content }}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNavigationBar />
    </div>
  )
}

export default NoticeDetailPage
