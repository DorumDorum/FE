import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Share2, Calendar, ChevronRight, ChevronLeft, Menu } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, addMonths, subMonths, isSameDay as isSameDayCheck } from 'date-fns'
import { ko } from 'date-fns/locale'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'

const HomePage = () => {
  const navigate = useNavigate()
  const [hasRoom, setHasRoom] = useState<boolean | null>(null)
  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarEvents, setCalendarEvents] = useState<Array<{ date: Date; title: string }>>([])
  const [loadingCalendar, setLoadingCalendar] = useState(false)
  const [calendarViewMode, setCalendarViewMode] = useState<'calendar' | 'list'>('calendar')
  const [notices, setNotices] = useState<Array<{ noticeNo: number; title: string; content: string; writtenDate: string; originalLink: string }>>([])
  const [loadingNotices, setLoadingNotices] = useState(false)

  useEffect(() => {
    const fetchMyRoom = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const res = await fetch('http://localhost:8080/api/rooms/me', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        
        if (res.ok) {
          let data: any
          try {
            data = rawBody ? JSON.parse(rawBody) : null
          } catch (e) {
            console.error('[rooms] parse error', { contentType, rawBody }, e)
            setHasRoom(false)
            setLoading(false)
            return
          }

          const payload = data?.result ?? data?.data ?? data
          if (payload) {
            setRoom(payload)
            setHasRoom(true)
          } else {
            setHasRoom(false)
          }
        } else {
          setHasRoom(false)
        }
      } catch (error) {
        console.error('[rooms] fetch error', error)
        setHasRoom(false)
      } finally {
        setLoading(false)
      }
    }

    fetchMyRoom()
  }, [navigate])

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          return
        }

        setLoadingCalendar(true)
        
        // 현재 월의 시작일과 종료일 계산
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        
        // API 호출을 위한 날짜 형식 변환 (YYYY-MM-DD)
        const startDateStr = format(monthStart, 'yyyy-MM-dd')
        const endDateStr = format(monthEnd, 'yyyy-MM-dd')

        const res = await fetch(
          `http://localhost:8080/api/calendar/events?startDate=${startDateStr}&endDate=${endDateStr}`,
          {
            credentials: 'include',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (res.ok) {
          const contentType = res.headers.get('content-type') ?? ''
          const rawBody = await res.text()
          
          let data: any
          try {
            data = rawBody ? JSON.parse(rawBody) : null
          } catch (e) {
            console.error('[calendar] parse error', { contentType, rawBody }, e)
            return
          }

          const payload = data?.result ?? data?.data ?? data
          if (Array.isArray(payload)) {
            // API 응답을 캘린더 형식으로 변환
            const events = payload.map((event: { date: string; title: string }) => ({
              date: new Date(event.date),
              title: event.title,
            }))
            setCalendarEvents(events)
          }
        }
      } catch (error) {
        console.error('[calendar] fetch error', error)
      } finally {
        setLoadingCalendar(false)
      }
    }

    fetchCalendarEvents()
  }, [currentDate])

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          return
        }

        setLoadingNotices(true)

        const res = await fetch('http://localhost:8080/api/notices', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

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
  }, [])

  const mapApiRoomTypeToDisplay = (type: string) => {
    switch (type) {
      case 'TYPE_MEDICAL':
        return '메디컬 기숙사'
      case 'TYPE_2':
        return '2 기숙사'
      case 'TYPE_1':
        return '3 기숙사'
      default:
        return type || '기숙사'
    }
  }

  const mapApiStatusToDisplay = (status: string) => {
    switch (status) {
      case 'RECRUITING':
        return '모집 중'
      case 'IN_PROGRESS':
        return '인원 확정'
      case 'COMPLETED':
        return '모집 완료'
      default:
        return '모집 중'
    }
  }

  const mapResidencePeriodToDisplay = (period: string | undefined): string | undefined => {
    if (!period) return undefined
    switch (period) {
      case 'SEMESTER':
        return '학기(16주)'
      case 'HALF_YEAR':
        return '반기(24주)'
      case 'SEASONAL':
        return '계절학기'
      default:
        return period
    }
  }

  const displayRoomType = room ? mapApiRoomTypeToDisplay(room.roomType) : ''
  const displayCapacity = room ? `${room.capacity}인실` : ''
  const displayResidencePeriod = room ? mapResidencePeriodToDisplay(room.residencePeriod) : undefined
  const displayMembers = room ? `${room.currentMateCount}/${room.capacity}명` : ''
  const displayStatus = room ? mapApiStatusToDisplay(room.roomStatus) : ''

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* 헤더 */}
        <header className="bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">홈</h1>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-7 h-7 text-gray-700" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="px-4 pt-2 pb-4 space-y-6">
          {/* 내 방 섹션 */}
          {loading && (
            <div className="text-sm text-gray-500 flex items-center justify-center py-10">
              불러오는 중...
            </div>
          )}

          {!loading && hasRoom && room && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-base font-semibold text-black">
                  {room.title}
                </h2>
                <span className={`text-xs px-2 py-1 rounded-md font-semibold whitespace-nowrap ${
                  room?.roomStatus === 'COMPLETED'
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}>
                  {displayStatus}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                <div className="flex items-center space-x-1">
                  <span>{displayRoomType}</span>
                  <span>·</span>
                  <span>{displayCapacity}</span>
                  {displayResidencePeriod && (
                    <>
                      <span>·</span>
                      <span>{displayResidencePeriod}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{displayMembers}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {room.additionalTag?.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4" />
                  초대 링크
                </button>
                <button
                  onClick={() => navigate('/rooms/me')}
                  className="flex-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-100"
                >
                  자세히 보기
                </button>
              </div>
            </div>
          )}

          {!loading && !hasRoom && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="text-center">
                <p className="text-gray-600 mb-4">아직 속한 방이 없습니다.</p>
                <button
                  onClick={() => navigate('/rooms/search')}
                  className="bg-blue-50 text-blue-600 border border-blue-200 rounded-lg px-6 py-2 text-sm font-medium hover:bg-blue-100"
                >
                  룸메 찾기
                </button>
              </div>
            </div>
          )}

          {/* 캘린더 섹션 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">학사일정</h2>
              <button
                onClick={() => setCalendarViewMode(calendarViewMode === 'calendar' ? 'list' : 'calendar')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {calendarViewMode === 'calendar' ? (
                  <Menu className="w-5 h-5 text-gray-600" />
                ) : (
                  <Calendar className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
            
            {calendarViewMode === 'calendar' ? (
              <>
                {/* 캘린더 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="text-base font-semibold text-gray-900">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                  </h3>
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                    <div
                      key={day}
                      className={`text-center text-xs font-medium py-2 ${
                        index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-600'
                      }`}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* 캘린더 그리드 */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const monthStart = startOfMonth(currentDate)
                    const monthEnd = endOfMonth(currentDate)
                    const startDate = new Date(monthStart)
                    startDate.setDate(startDate.getDate() - getDay(monthStart))
                    
                    const endDate = new Date(monthEnd)
                    endDate.setDate(endDate.getDate() + (6 - getDay(monthEnd)))
                    
                    const days = eachDayOfInterval({ start: startDate, end: endDate })
                    
                    return days.map((day, index) => {
                      const isCurrentMonth = isSameMonth(day, currentDate)
                      const isToday = isSameDay(day, new Date())
                      const dayEvents = calendarEvents.filter(event => isSameDay(event.date, day))
                      
                      return (
                        <div
                          key={index}
                          className={`aspect-square p-1 ${
                            !isCurrentMonth ? 'text-gray-300' : 'text-gray-900'
                          } ${isToday ? 'bg-blue-50 rounded' : ''}`}
                        >
                          <div className={`text-xs font-medium mb-1 ${
                            getDay(day) === 0 ? 'text-red-500' : getDay(day) === 6 ? 'text-blue-500' : ''
                          }`}>
                            {format(day, 'd')}
                          </div>
                          {dayEvents.length > 0 && (
                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                <div
                                  key={eventIndex}
                                  className="bg-blue-100 text-blue-700 text-[10px] px-1 py-0.5 rounded truncate"
                                  title={event.title}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-[10px] text-gray-500">
                                  +{dayEvents.length - 2}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()}
                </div>
              </>
            ) : (
              /* 리스트 뷰 */
              <div className="space-y-3">
                {/* 캘린더 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <h3 className="text-base font-semibold text-gray-900">
                    {format(currentDate, 'yyyy년 M월', { locale: ko })}
                  </h3>
                  <button
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                {loadingCalendar ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    불러오는 중...
                  </div>
                ) : calendarEvents.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    이번 달 일정이 없습니다.
                  </div>
                ) : (
                  calendarEvents
                    .filter(event => isSameMonth(event.date, currentDate))
                    .sort((a, b) => a.date.getTime() - b.date.getTime())
                    .map((event, index) => (
                      <div
                        key={index}
                        className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center min-w-[50px]">
                            <div className="text-base font-bold text-gray-900">
                              {format(event.date, 'd')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {format(event.date, 'EEE', { locale: ko })}
                            </div>
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-sm font-medium text-gray-900">
                              {event.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>

          {/* 공지사항 섹션 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">공지사항</h2>
            </div>
            {loadingNotices ? (
              <div className="text-sm text-gray-500 text-center py-8">
                불러오는 중...
              </div>
            ) : notices.length === 0 ? (
              <div className="space-y-3">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">공지사항이 없습니다</p>
                      <p className="text-xs text-gray-500">새로운 공지사항이 등록되면 알려드립니다.</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {notices.slice(0, 3).map((notice) => (
                    <div
                      key={notice.noticeNo}
                      className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
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
                {notices.length > 3 && (
                  <button
                    onClick={() => navigate('/notices')}
                    className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 text-center py-2"
                  >
                    더보기 ({notices.length - 3}개)
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <BottomNavigationBar />
    </div>
  )
}

export default HomePage
