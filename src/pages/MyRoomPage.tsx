import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Share2, Pencil, Settings, DoorOpen, CheckCircle, Star } from 'lucide-react'
import BottomNavigationBar from '../components/ui/BottomNavigationBar'
// import toast from 'react-hot-toast' // 토스트 알림 비활성화

const MyRoomPage = () => {
  const navigate = useNavigate()
  type ApiRoom = {
    roomNo: number | string  // 백엔드에서 ToStringSerializer로 문자열로 직렬화될 수 있음
    roomType: string
    capacity: number
    currentMateCount: number
    createdAt: string
    title: string
    hostNickname: string
    additionalTag: string[]
    roomStatus: string
    isHost?: boolean
    residencePeriod?: string // 거주기간 (enum 값: SEMESTER, HALF_YEAR, SEASONAL)
  }

  type ApiRoommate = {
    roommateNo: number
    userNo: number
    confirmStatus: string
    roomRole: string
    name: string
    nickname: string
    studentNo: string
    gender: string
    major?: string
    grade?: string
    age?: number
    isMe: boolean
  }

  type ChecklistOption = {
    text: string
    selected?: boolean
  }

  type ChecklistItem = {
    label: string
    value?: string
    extraValue?: string
    options?: ChecklistOption[]
    itemType?: 'VALUE' | 'OPTION'
  }

  type ChecklistSection = {
    title: string
    category?: 'BASIC_INFO' | 'LIFESTYLE_PATTERN' | 'ADDITIONAL_RULES'
    items: ChecklistItem[]
  }

  // BE 룰 조회 응답 타입
  type RuleItemCategory = 'BASIC_INFO' | 'LIFESTYLE_PATTERN' | 'ADDITIONAL_RULES'
  type RuleItemType = 'VALUE' | 'OPTION'

  type ApiRoomRule = {
    otherNotes: string | null
    categories: {
      category: RuleItemCategory
      items: {
        label: string
        itemType: RuleItemType
        value: string | null
        extraValue: string | null
        options: {
          text: string
          selected: boolean
        }[] | null
      }[]
    }[]
  }

  const [room, setRoom] = useState<ApiRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'규칙' | '지원자' | '룸메이트'>('규칙')
  const [isHost, setIsHost] = useState<boolean>(() => localStorage.getItem('isHost') === 'true')
  const [roommates, setRoommates] = useState<ApiRoommate[]>([])
  const [roommatesLoading, setRoommatesLoading] = useState(true)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [expandedRoommateIds, setExpandedRoommateIds] = useState<Set<number>>(new Set())
  const [expandedApplicantIds, setExpandedApplicantIds] = useState<Set<number>>(new Set())
  const [roommateChecklists, setRoommateChecklists] = useState<Record<number, any>>({})
  const [roommateProfiles, setRoommateProfiles] = useState<Record<number, any>>({})
  const [hasUnreadNotifications] = useState(false) // 안 읽은 알람 여부
  const [showRoommateSettings, setShowRoommateSettings] = useState(false) // 룸메이트 설정 드롭다운
  const [roommateToRemove, setRoommateToRemove] = useState<{ roommateNo: number; name: string } | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false) // 방 나가기 확인
  const [showHostLeaveAlert, setShowHostLeaveAlert] = useState(false) // 방장 나가기 알림
  const [applicantToAccept, setApplicantToAccept] = useState<{ id: number; name: string; requestNo: string } | null>(null)
  const [applicantToReject, setApplicantToReject] = useState<{ id: number; name: string; requestNo: string } | null>(null)
  const [applicants, setApplicants] = useState<Array<{
    id: number
    name: string
    dept: string
    date: string
    intro: string
    message: string
    requestNo: string
    userNo: string
  }>>([])
  const [applicantsLoading, setApplicantsLoading] = useState(false)
  const [applicantChecklists, setApplicantChecklists] = useState<Record<string, ChecklistSection[]>>({}) // userNo를 키로 사용
  const [applicantOtherNotes, setApplicantOtherNotes] = useState<Record<string, string>>({}) // userNo를 키로 사용
  const [showConfirmAssignment, setShowConfirmAssignment] = useState(false) // 방 배정 확정 확인
  const [otherNotes, setOtherNotes] = useState('')
  const [checklistSections, setChecklistSections] = useState<ChecklistSection[]>([])

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
      case 'CONFIRM_PENDING':
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
        return period // 이미 한글이거나 다른 형식이면 그대로 반환
    }
  }

  // const formatRelativeTime = (iso?: string): string => {
  //   if (!iso) return ''
  //   const now = new Date()
  //   const target = new Date(iso)
  //   const diffMs = now.getTime() - target.getTime()
  //   const diffMin = Math.floor(diffMs / 60000)
  //   const diffHour = Math.floor(diffMin / 60)

  //   if (diffMin < 1) return '방금 전'
  //   if (diffMin < 60) return `${diffMin}분 전`
  //   if (diffHour < 24) return `${diffHour}시간 전`

  //   const y = target.getFullYear()
  //   const m = String(target.getMonth() + 1).padStart(2, '0')
  //   const d = String(target.getDate()).padStart(2, '0')
  //   return `${y}-${m}-${d}`
  // }

  useEffect(() => {
    const fetchMyRoom = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          // toast.error('로그인이 필요합니다.')
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
          // toast.error('로그인이 필요합니다.')
          navigate('/login', { replace: true })
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[rooms] my room fetch failed', {
            status: res.status,
            contentType,
            body: rawBody,
          })
          throw new Error('내 방 정보를 불러오지 못했습니다.')
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] my room parse error', { contentType, rawBody }, e)
          throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
        }

        const payload = data?.result ?? data?.data ?? data
        setRoom(payload ?? null)
        const hostFlag = Boolean(payload?.isHost)
        setIsHost(hostFlag)
        localStorage.setItem('isHost', hostFlag ? 'true' : 'false')
      } catch (err) {
        console.error('[rooms] my room fetch error', err)
        // toast.error('내 방 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 방 규칙 조회 (규칙 탭에 들어올 때마다 최신 상태로 재조회)
  useEffect(() => {
    // room이 로드되지 않았거나 현재 탭이 '규칙'이 아니면 조회하지 않는다.
    if (!room?.roomNo || activeTab !== '규칙') return
    // roomNo가 문자열 또는 숫자일 수 있으므로 항상 문자열로 변환
    const effectiveRoomNo = String(room.roomNo)

    const fetchRoomRule = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          // toast.error('로그인이 필요합니다.')
          navigate('/login', { replace: true })
          return
        }

        const res = await fetch(`http://localhost:8080/api/rooms/${effectiveRoomNo}/rule`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          // toast.error('로그인이 필요합니다.')
          navigate('/login', { replace: true })
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[rooms] my room rule fetch failed', {
            status: res.status,
            contentType,
            body: rawBody,
          })
          throw new Error('방 규칙 정보를 불러오지 못했습니다.')
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] my room rule parse error', { contentType, rawBody }, e)
          throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
        }

        const payload: ApiRoomRule | null = data?.result ?? data?.data ?? data
        if (!payload) return

        // 비고
        setOtherNotes(payload.otherNotes ?? '')

        // 카테고리 → 섹션 매핑
        const mappedSections: ChecklistSection[] = payload.categories.map((category) => {
          const title =
            category.category === 'BASIC_INFO'
              ? '기본 정보'
              : category.category === 'LIFESTYLE_PATTERN'
                ? '생활 패턴'
                : '추가 규칙'

          return {
            title,
            category: category.category,
            items: category.items.map((item) => {
              // 디버깅: 취침, 기상 항목 로그
              if (item.label === '취침' || item.label === '기상') {
                console.log(`[${item.label}] itemType:`, item.itemType, 'value:', item.value, 'options:', item.options)
              }
              
              return {
                label: item.label,
                itemType: item.itemType,
                // VALUE 타입이면 value 사용, OPTION 타입이면 value는 사용하지 않음
                value: item.itemType === 'VALUE' ? (item.value ?? '') : undefined,
                extraValue: item.extraValue ?? undefined,
              options: item.options && item.options.length > 0
                ? item.options.map((opt) => ({
                    text: opt.text,
                    selected: opt.selected,
                  }))
                : undefined,
              }
            }),
          }
        })

        setChecklistSections(mappedSections)
      } catch (err) {
        console.error('[rooms] my room rule fetch error', err)
        // toast.error('방 규칙 정보를 불러오지 못했습니다.')
      }
    }

    void fetchRoomRule()
  }, [room?.roomNo, navigate, activeTab])

  // 룸메이트 조회 (룸메이트 탭에 들어올 때마다 최신 상태로 재조회)
  useEffect(() => {
    const fetchRoommates = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          // toast.error('로그인이 필요합니다.')
          navigate('/login', { replace: true })
          return
        }

        const res = await fetch('http://localhost:8080/api/rooms/me/roommates', {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          // toast.error('로그인이 필요합니다.')
          navigate('/login', { replace: true })
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[rooms] roommates fetch failed', {
            status: res.status,
            contentType,
            body: rawBody,
          })
          throw new Error('룸메이트 정보를 불러오지 못했습니다.')
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] roommates parse error', { contentType, rawBody }, e)
          throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
        }

        const payload = data?.result ?? data?.data ?? data
        setRoommates(Array.isArray(payload) ? payload : [])
      } catch (err) {
        console.error('[rooms] roommates fetch error', err)
        // toast.error('룸메이트 정보를 불러오지 못했습니다.')
      } finally {
        setRoommatesLoading(false)
      }
    }

    // 현재 탭이 '룸메이트'가 아니라면 조회하지 않는다.
    if (activeTab !== '룸메이트') return

    fetchRoommates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // 지원자 목록 조회 (지원자 탭에 들어올 때마다, 또는 방 정보가 로드됐을 때 최신 상태로 재조회)
  useEffect(() => {
    // 현재 탭이 '지원자'가 아니면 조회하지 않는다.
    if (activeTab !== '지원자') return
    // room이 아직 로드되지 않았으면, room이 준비된 이후에 다시 실행된다.
    if (!room?.roomNo) return

    const effectiveRoomNo = String(room.roomNo)

    const fetchApplicants = async () => {
      try {
        setApplicantsLoading(true)
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const res = await fetch(`http://localhost:8080/api/rooms/${effectiveRoomNo}/applications`, {
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
        if (!res.ok) {
          console.error('[rooms] applicants fetch failed', {
            status: res.status,
            contentType,
            body: rawBody,
          })
          throw new Error('지원자 정보를 불러오지 못했습니다.')
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] applicants parse error', { contentType, rawBody }, e)
          throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
        }

        const payload = data?.result ?? data?.data ?? data
        const applications: any[] = Array.isArray(payload) ? payload : []

        // API 응답을 프론트엔드 형식으로 매핑
        const mapped = applications.map((app, index) => {
          // createdAt을 날짜 문자열로 변환
          const createdAt = app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : ''
          
          return {
            id: index + 1, // 임시 ID (userNo를 기반으로 할 수도 있음)
            name: app.name || '',
            dept: app.major || '',
            date: createdAt,
            intro: app.introduction || '',
            message: app.additionalMessage || '',
            requestNo: String(app.requestNo || ''), // requestNo를 String으로 유지
            userNo: app.userNo || ''
          }
        })

        setApplicants(mapped)
      } catch (err) {
        console.error('[rooms] applicants fetch error', err)
        setApplicants([])
      } finally {
        setApplicantsLoading(false)
      }
    }

    void fetchApplicants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, room?.roomNo])

  // const mapRoomRoleToDisplay = (role?: string) => {
  //   switch (role) {
  //     case 'HOST':
  //       return '방장'
  //     case 'MATE':
  //       return '룸메'
  //     default:
  //       return role || '룸메'
  //   }
  // }

  // const mapConfirmStatusToDisplay = (status?: string) => {
  //   switch (status) {
  //     case 'ACCEPTED':
  //       return '확정'
  //     case 'PENDING':
  //       return '대기'
  //     case 'REJECTED':
  //       return '거절'
  //     default:
  //       return status || '대기'
  //   }
  // }

  const updateChecklistValue = (sectionIndex: number, itemIndex: number, value: string) => {
    setChecklistSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx !== sectionIndex
          ? section
          : {
              ...section,
              items: section.items.map((item, iIdx) =>
                iIdx !== itemIndex ? item : { ...item, value }
              ),
            }
      )
    )
  }

  const updateChecklistExtraValue = (sectionIndex: number, itemIndex: number, extraValue: string) => {
    setChecklistSections((prev) =>
      prev.map((section, sIdx) =>
        sIdx !== sectionIndex
          ? section
          : {
              ...section,
              items: section.items.map((item, iIdx) =>
                iIdx !== itemIndex ? item : { ...item, extraValue }
              ),
            }
      )
    )
  }

  const selectChecklistOption = (sectionIndex: number, itemIndex: number, optionIndex: number) => {
    setChecklistSections((prev) =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section
        
        // 추가 규칙 섹션인지 확인
        const isAdditionalRules = section.category === 'ADDITIONAL_RULES'
        
        return {
          ...section,
          items: section.items.map((item, iIdx) => {
            if (iIdx !== itemIndex || !item.options) return item
            
            // 추가 규칙이면 토글 방식, 아니면 단일 선택 방식
            if (isAdditionalRules) {
              return {
                ...item,
                options: item.options.map((option, oIdx) => ({
                  ...option,
                  selected: oIdx === optionIndex ? !option.selected : option.selected,
                })),
              }
            } else {
              return {
                ...item,
                options: item.options.map((option, oIdx) => ({
                  ...option,
                  selected: oIdx === optionIndex,
                })),
              }
            }
          }),
        }
      })
    )
  }

  const displayRoomType = useMemo(
    () => (room ? mapApiRoomTypeToDisplay(room.roomType) : ''),
    [room]
  )
  const displayCapacity = room ? `${room.capacity}인실` : ''
  const displayMembers = room ? `${room.currentMateCount}/${room.capacity}명` : ''
  const displayStatus = room ? mapApiStatusToDisplay(room.roomStatus) : ''
  // const displayCreatedAt = room ? formatRelativeTime(room.createdAt) : '' // 사용되지 않음
  const displayResidencePeriod = room ? mapResidencePeriodToDisplay(room.residencePeriod) : ''
  
  // 자신의 confirmStatus 찾기
  const myConfirmStatus = useMemo(() => {
    const myRoommate = roommates.find(mate => mate.isMe)
    return myRoommate?.confirmStatus || null
  }, [roommates])

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* 상단 바 */}
        <header className="bg-white h-15 px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">방 관리</h1>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <Bell className="w-7 h-7 text-gray-700" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
                )}
              </div>
            </button>
          </div>
        </header>

        {/* 콘텐츠 */}
        <div className="px-4 pt-2 pb-4">
        {loading && (
          <div className="text-sm text-gray-500 flex items-center justify-center py-10">
            불러오는 중...
          </div>
        )}
        {!loading && !room && (
          <div className="text-sm text-gray-500 flex items-center justify-center py-10">
            내 방 정보를 찾을 수 없습니다.
          </div>
        )}
        {!loading && room && (
          <>
        {/* 방 요약 카드 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-1 flex-1">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  maxLength={20}
                  onBlur={async () => {
                    if (editingTitle.trim() && editingTitle.trim() !== room.title) {
                      try {
                        const token = localStorage.getItem('accessToken')
                        if (!token) {
                          navigate('/login', { replace: true })
                          return
                        }

                        const params = new URLSearchParams({ roomNo: String(room.roomNo) })
                        const updateRes = await fetch(`http://localhost:8080/api/rooms/me/title?${params.toString()}`, {
                          method: 'PUT',
                          credentials: 'include',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            title: editingTitle.trim(),
                          }),
                        })

                        if (updateRes.ok) {
                          setRoom({ ...room, title: editingTitle.trim() })
                        } else {
                          console.error('[rooms] title update failed', {
                            status: updateRes.status,
                          })
                        }
                      } catch (error) {
                        console.error('[rooms] title update error', error)
                      }
                    }
                    setIsEditingTitle(false)
                    setEditingTitle('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    } else if (e.key === 'Escape') {
                      setIsEditingTitle(false)
                      setEditingTitle('')
                    }
                  }}
                  autoFocus
                  className="text-base font-semibold text-black border border-gray-300 rounded px-2 py-1 flex-1"
                />
              ) : (
                <>
                  <h2 className="text-base font-semibold text-black">
                    {room.title}
                  </h2>
                  {isHost && (
                    <button
                      onClick={() => {
                        setEditingTitle(room.title)
                        setIsEditingTitle(true)
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Pencil className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </>
              )}
            </div>
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
            {room.additionalTag?.map((tag) => (
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
              onClick={() => myConfirmStatus !== 'ACCEPTED' && myConfirmStatus !== 'COMPLETED' && setShowConfirmAssignment(true)}
              disabled={myConfirmStatus === 'ACCEPTED' || myConfirmStatus === 'COMPLETED'}
              className={`flex-1 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                myConfirmStatus === 'COMPLETED'
                  ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                  : myConfirmStatus === 'ACCEPTED'
                    ? 'bg-[#3072E1] text-white border border-[#3072E1] cursor-not-allowed opacity-60'
                    : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              방 배정 확정
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex justify-between text-sm text-gray-500 mt-4">
          {(['규칙', '지원자', '룸메이트'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 ${
                activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : ''
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '규칙' && (
        <>
        {/* 룸메 체크리스트 */}
        <div className="mt-4 space-y-4">
          {checklistSections.map((section, index) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-base font-bold text-black">{section.title}</h4>
                {index === 0 && isHost && (
                  <button
                    className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1"
                    onClick={async () => {
                      if (!isEditingChecklist) {
                        setIsEditingChecklist(true)
                        return
                      }

                      const hasFixedArrivalWithoutTime = checklistSections.some((section) =>
                        section.items.some(
                          (item) =>
                            item.label === '귀가' &&
                            item.options?.some(
                              (option) => option.text === '고정적' && option.selected
                            ) &&
                            !item.extraValue
                        )
                      )

                      if (hasFixedArrivalWithoutTime) {
                        // toast.error('귀가 시간을 선택해 주세요.')
                        return
                      }

                      // API 호출
                      if (!room?.roomNo) {
                        // toast.error('방 정보를 불러올 수 없습니다.')
                        return
                      }

                      try {
                        const token = localStorage.getItem('accessToken')
                        if (!token) {
                          // toast.error('로그인이 필요합니다.')
                          navigate('/login', { replace: true })
                          return
                        }

                        // 기본 정보에서 수용 인원과 생활관, 거주기간 추출
                        const basicInfoSection = checklistSections.find(section => section.title === '기본 정보')
                        const capacityItem = basicInfoSection?.items.find(item => item.label === '수용 인원')
                        const dormItem = basicInfoSection?.items.find(item => item.label === '생활관')
                        const residencePeriodItem = basicInfoSection?.items.find(item => item.label === '거주기간')
                        
                        const selectedCapacity = capacityItem?.options?.find(opt => opt.selected)?.text.replace('명', '')
                        const capacity = selectedCapacity ? Number(selectedCapacity) : null
                        
                        const selectedDorm = dormItem?.options?.find(opt => opt.selected)?.text
                        const mapDormToRoomType = (dorm: string) => {
                          switch (dorm) {
                            case '2':
                              return 'TYPE_2'
                            case '3':
                              return 'TYPE_1'
                            case '메디컬':
                              return 'TYPE_MEDICAL'
                            default:
                              return null
                          }
                        }
                        const roomType = selectedDorm ? mapDormToRoomType(selectedDorm) : null
                        
                        // 거주기간 문자열을 enum 값으로 변환
                        const mapResidencePeriodToEnum = (period: string): string | null => {
                          switch (period) {
                            case '학기(16주)':
                              return 'SEMESTER'
                            case '반기(24주)':
                              return 'HALF_YEAR'
                            case '계절학기':
                              return 'SEASONAL'
                            default:
                              return null
                          }
                        }
                        const selectedResidencePeriod = residencePeriodItem?.options?.find(opt => opt.selected)?.text
                        const residencePeriod = selectedResidencePeriod ? mapResidencePeriodToEnum(selectedResidencePeriod) : null

                        // categories 변환
                        const categories = checklistSections.map((section) => {
                          // section.category가 있으면 사용, 없으면 title로 매핑
                          const category: RuleItemCategory =
                            section.category ||
                            (section.title === '기본 정보'
                              ? 'BASIC_INFO'
                              : section.title === '생활 패턴'
                                ? 'LIFESTYLE_PATTERN'
                                : 'ADDITIONAL_RULES')

                          return {
                            category,
                            items: section.items.map((item) => {
                              // capacity가 변경되었고 "수용 인원" 항목이면 selected 값 업데이트
                              if (capacity && item.label === '수용 인원' && item.options) {
                                return {
                                  label: item.label,
                                  itemType: item.options ? ('OPTION' as RuleItemType) : ('VALUE' as RuleItemType),
                                  value: item.value || null,
                                  extraValue: item.extraValue || null,
                                  options: item.options.map((opt) => ({
                                    text: opt.text,
                                    selected: opt.text === `${capacity}명`,
                                  })),
                                }
                              }
                              
                              return {
                              label: item.label,
                              itemType: item.options ? ('OPTION' as RuleItemType) : ('VALUE' as RuleItemType),
                              value: item.value || null,
                              extraValue: item.extraValue || null,
                              options: item.options?.map((opt) => ({
                                text: opt.text,
                                selected: opt.selected || false,
                              })) || null,
                              }
                            }),
                          }
                        })

                        const params = new URLSearchParams({ roomNo: String(room.roomNo) })
                        const res = await fetch(`http://localhost:8080/api/rooms/me/rule?${params.toString()}`, {
                          method: 'PUT',
                          credentials: 'include',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            otherNotes: otherNotes || null,
                            categories,
                            roomType: roomType || null,
                            capacity: capacity || null,
                            residencePeriod: residencePeriod || null,
                          }),
                        })

                        if (res.status === 401) {
                          // toast.error('로그인이 필요합니다.')
                          navigate('/login', { replace: true })
                          return
                        }

                        if (!res.ok) {
                          const contentType = res.headers.get('content-type') ?? ''
                          const rawBody = await res.text()
                          console.error('[rooms] update rule failed', {
                            status: res.status,
                            contentType,
                            body: rawBody,
                          })
                          throw new Error('방 규칙 수정에 실패했습니다.')
                        }

                        // toast.success('방 규칙이 수정되었습니다.')
                        setIsEditingChecklist(false)
                        // 방 정보가 변경되었으면 다시 불러오기
                        if (capacity || roomType) {
                          window.location.reload()
                        } else {
                          // capacity나 roomType이 변경되지 않았어도 RoomRule은 다시 불러와야 함
                          const effectiveRoomNo = String(room.roomNo)
                          const params = new URLSearchParams({ roomNo: effectiveRoomNo })
                          const refreshRes = await fetch(`http://localhost:8080/api/rooms/me/rule?${params.toString()}`, {
                            credentials: 'include',
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          })
                          if (refreshRes.ok) {
                            const refreshData = await refreshRes.json()
                            const refreshPayload: ApiRoomRule | null = refreshData?.result ?? refreshData?.data ?? refreshData
                            if (refreshPayload) {
                              setOtherNotes(refreshPayload.otherNotes ?? '')
                              const mappedSections: ChecklistSection[] = refreshPayload.categories.map((category) => {
                                const title =
                                  category.category === 'BASIC_INFO'
                                    ? '기본 정보'
                                    : category.category === 'LIFESTYLE_PATTERN'
                                      ? '생활 패턴'
                                      : '추가 규칙'
                                return {
                                  title,
                                  category: category.category,
                                  items: category.items.map((item) => ({
                                    label: item.label,
                                    itemType: item.itemType,
                                    value: item.itemType === 'VALUE' ? (item.value ?? '') : undefined,
                                    extraValue: item.extraValue ?? undefined,
                                    options: item.options && item.options.length > 0
                                      ? item.options.map((opt) => ({
                                          text: opt.text,
                                          selected: opt.selected,
                                        }))
                                      : undefined,
                                  })),
                                }
                              })
                              setChecklistSections(mappedSections)
                            }
                          }
                        }
                      } catch (err) {
                        console.error('[rooms] update rule error', err)
                        // toast.error('방 규칙 수정에 실패했습니다.')
                      }
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                    {isEditingChecklist ? '저장' : '편집'}
                  </button>
                )}
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="space-y-3 text-sm text-gray-700">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.label} className="flex gap-2">
                      <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                      <div className={`flex flex-wrap gap-2 ${item.label === '드라이기' ? 'flex-1' : ''}`}>
                        {item.itemType === 'VALUE' || (!item.options || item.options.length === 0) ? (
                          isEditingChecklist ? (
                            item.label === '학번(학년)' ? (
                              <select
                                value={item.value || ''}
                                onChange={(e) => updateChecklistValue(index, itemIndex, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                              >
                                {Array.from({ length: 11 }, (_, i) => 15 + i).map((year) => (
                                  <option key={year} value={`${year}학번`}>
                                    {year}학번
                                  </option>
                                ))}
                              </select>
                            ) : item.label === '나이' ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.value || ''}
                                onChange={(e) =>
                                  updateChecklistValue(
                                    index,
                                    itemIndex,
                                    e.target.value.replace(/[^0-9]/g, '')
                                  )
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-sm text-black w-24"
                              />
                            ) : (
                              <input
                                type="text"
                                value={item.value || ''}
                                onChange={(e) => updateChecklistValue(index, itemIndex, e.target.value)}
                                className={`border border-gray-300 rounded px-2 py-1 text-sm text-black ${
                                  item.label === '드라이기' ? 'w-full' : 'flex-1 min-w-0'
                                }`}
                                placeholder={
                                  item.label === '취침'
                                    ? '예: 23시-1시'
                                    : item.label === '기상'
                                      ? '예: 7시-9시'
                                      : item.label === '드라이기'
                                        ? '예: 12-7시만 피해 사용'
                                        : ''
                                }
                              />
                            )
                          ) : (
                            <span className="text-black font-medium">{item.value ?? ''}</span>
                          )
                        ) : (
                          <>
                            {item.options?.map((option, optionIndex) => {
                              // 귀가/소등의 특정 옵션은 extraValue가 있을 때 별도로 표시하므로 여기서는 숨김
                              if (
                                !isEditingChecklist &&
                                item.extraValue &&
                                ((item.label === '소등' && option.text === '__시 이후' && option.selected) ||
                                  (item.label === '귀가' && option.text === '고정적' && option.selected))
                              ) {
                                return null
                              }

                              return (
                                <span
                                  key={option.text}
                                  onClick={
                                    isEditingChecklist
                                      ? () => selectChecklistOption(index, itemIndex, optionIndex)
                                      : undefined
                                  }
                                  className={
                                    option.selected
                                      ? `bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md ${isEditingChecklist ? 'cursor-pointer' : ''}`
                                      : `text-gray-500 text-xs px-2 py-1 ${isEditingChecklist ? 'cursor-pointer border border-transparent' : ''}`
                                  }
                                >
                                  {option.text}
                                </span>
                              )
                            })}
                            {/* 귀가/소등의 시간 정보를 별도로 표시 */}
                            {!isEditingChecklist && item.extraValue && (
                              <>
                                {item.label === '소등' &&
                                  item.options?.some((opt) => opt.text === '__시 이후' && opt.selected) && (
                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md">
                                      {item.extraValue} 이후
                                    </span>
                                  )}
                                {item.label === '귀가' &&
                                  item.options?.some((opt) => opt.text === '고정적' && opt.selected) && (
                                    <span className="bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md">
                                      {item.extraValue} 고정적
                                    </span>
                                  )}
                              </>
                            )}
                          </>
                        )}
                        {item.label === '귀가' &&
                          item.options?.some((option) => option.text === '고정적' && option.selected) && (
                            isEditingChecklist ? (
                              <select
                                value={item.extraValue ?? ''}
                                onChange={(e) =>
                                  updateChecklistExtraValue(index, itemIndex, e.target.value)
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-xs text-black"
                              >
                                <option value="">시간 선택</option>
                                {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                                  <option key={hour} value={`${hour}시`}>
                                    {hour}시
                                  </option>
                                ))}
                              </select>
                            ) : null
                          )}
                        {item.label === '소등' &&
                          item.options?.some((option) => option.text === '__시 이후' && option.selected) && (
                            isEditingChecklist ? (
                              <select
                                value={item.extraValue ?? ''}
                                onChange={(e) =>
                                  updateChecklistExtraValue(index, itemIndex, e.target.value)
                                }
                                className="border border-gray-300 rounded px-2 py-1 text-xs text-black"
                              >
                                <option value="">시간 선택</option>
                                {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                                  <option key={hour} value={`${hour}시`}>
                                    {hour}시
                                  </option>
                                ))}
                              </select>
                            ) : null
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-base font-bold text-black">기타</h4>
            </div>
            {isEditingChecklist ? (
              <textarea
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-700 leading-6"
                rows={6}
              />
            ) : (
              <p className="text-sm text-gray-700 leading-6 whitespace-pre-line">
                {otherNotes}
              </p>
            )}
          </div>
        </div>
        </>
        )}

        {activeTab === '지원자' && (
        <>
        {/* 지원자 섹션 */}
        <div className="mt-4 space-y-4">
          <h3 className="text-base font-bold text-black">지원자 목록 ({applicants.length}명)</h3>
          {applicantsLoading ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              불러오는 중...
            </div>
          ) : applicants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              지원자가 없습니다.
            </div>
          ) : (
            applicants.map((applicant) => {
            const isExpanded = expandedApplicantIds.has(applicant.id)
            
            const toggleApplicantChecklist = () => {
              setExpandedApplicantIds((prev) => {
                const newSet = new Set(prev)
                const willExpand = !newSet.has(applicant.id)

                if (willExpand) {
                  newSet.add(applicant.id)

                  // 체크리스트를 항상 최신 상태로 보기 위해, 펼칠 때마다 해당 지원자의 체크리스트를 새로 로드
                  const loadChecklist = async () => {
                    try {
                      const token = localStorage.getItem('accessToken')
                      if (!token) {
                        navigate('/login', { replace: true })
                        return
                      }

                      const res = await fetch(`http://localhost:8080/api/users/${applicant.userNo}/checklist`, {
                        credentials: 'include',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      })

                      if (!res.ok) {
                        console.error('[rooms] applicant checklist fetch failed', applicant.userNo, res.status)
                        return
                      }

                      const contentType = res.headers.get('content-type') ?? ''
                      const rawBody = await res.text()

                      let data: any
                      try {
                        data = rawBody ? JSON.parse(rawBody) : null
                      } catch (e) {
                        console.error('[rooms] applicant checklist parse error', { contentType, rawBody }, e)
                        return
                      }

                      const payload: any = data?.result ?? data?.data ?? data
                      if (!payload) return

                      const sections: ChecklistSection[] = (payload.categories || []).map((cat: any) => {
                        let title = ''
                        if (cat.category === 'BASIC_INFO') title = '기본 정보'
                        else if (cat.category === 'LIFESTYLE_PATTERN') title = '생활 패턴'
                        else if (cat.category === 'ADDITIONAL_RULES') title = '추가 규칙'
                        else title = cat.category

                        return {
                          title,
                          category: cat.category,
                          items: (cat.items || []).map((item: any) => ({
                            label: item.label,
                            itemType: item.itemType,
                            value: item.value || undefined,
                            extraValue: item.extraValue || undefined,
                            options: item.options
                              ? item.options.map((opt: any) => ({
                                  text: opt.text,
                                  selected: opt.selected || false,
                                }))
                              : undefined,
                          })),
                        }
                      })

                      setApplicantChecklists((prev) => ({
                        ...prev,
                        [applicant.userNo]: sections,
                      }))

                      if (payload.otherNotes) {
                        setApplicantOtherNotes((prev) => ({
                          ...prev,
                          [applicant.userNo]: payload.otherNotes,
                        }))
                      }
                    } catch (err) {
                      console.error('[rooms] applicant checklist fetch error', applicant.userNo, err)
                    }
                  }

                  void loadChecklist()
                } else {
                  newSet.delete(applicant.id)
                }

                return newSet
              })
            }
            
            // 실제 체크리스트 데이터 사용
            const applicantChecklist = applicantChecklists[applicant.userNo] || []
            const applicantOtherNote = applicantOtherNotes[applicant.userNo] || ''
            
            return (
            <div key={applicant.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                    {applicant.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-black">{applicant.name}</div>
                    <div className="text-xs text-gray-500">{applicant.dept}</div>
                    <div className="text-xs text-gray-400">{applicant.date}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setApplicantToAccept({ id: applicant.id, name: applicant.name, requestNo: applicant.requestNo })}
                      className="px-3 py-1 text-xs font-semibold text-blue-600 bg-[#DBEAFE] rounded hover:bg-[#BFDBFE] transition-colors"
                    >
                      수락
                    </button>
                    <button 
                      onClick={() => navigate(`/chat/${applicant.id}`)}
                      className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
                    >
                      채팅
                    </button>
                    <button 
                      onClick={() => setApplicantToReject({ id: applicant.id, name: applicant.name, requestNo: applicant.requestNo })}
                      className="px-3 py-1 text-xs font-semibold text-red-600 bg-[#FEDCDC] rounded hover:bg-[#FED0D0] transition-colors"
                    >
                      거절
                    </button>
                  </div>
                  <button
                    onClick={toggleApplicantChecklist}
                    className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    {isExpanded ? '접기' : '체크리스트 보기'}
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div>
                  <div className="text-sm font-bold text-gray-700 mb-1">자기소개</div>
                  <p>{applicant.intro}</p>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-700 mb-1">추가 메시지</div>
                  <p>{applicant.message}</p>
                </div>
              </div>
              
              {isExpanded && (
                <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                  {applicantChecklist.length > 0 ? (
                    <>
                      {applicantChecklist.map((section) => (
                        <div key={section.title}>
                          <h4 className="text-base font-bold text-black mb-2">{section.title}</h4>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="space-y-3 text-sm text-gray-700">
                              {section.items.map((item) => (
                                <div key={item.label} className="flex gap-2">
                                  <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                                  <div className={`flex flex-wrap gap-2`}>
                                    {'value' in item && item.value ? (
                                      <span className="text-black font-medium">{item.value}</span>
                                    ) : (
                                      item.options?.map((option) => (
                                        <span
                                          key={option.text}
                                          className={
                                            option.selected
                                              ? `bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md`
                                              : `text-gray-400 text-xs px-2 py-1`
                                          }
                                        >
                                          {option.text}
                                        </span>
                                      ))
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {applicantOtherNote && (
                        <div>
                          <h4 className="text-base font-bold text-black mb-2">기타</h4>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                              {applicantOtherNote}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      체크리스트가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          }))}
        </div>
        </>
        )}

        {activeTab === '룸메이트' && (
        <>
        {/* 룸메이트 섹션 */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-black">
              룸메이트 목록 ({roommates.length}명)
            </h3>
            {isHost ? (
              <div className="flex gap-2">
              <button 
                onClick={() => setShowRoommateSettings(!showRoommateSettings)}
                className={`p-2 rounded-lg transition-colors ${
                    showRoommateSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Settings className="w-5 h-5" />
              </button>
                {myConfirmStatus === 'PENDING' && (
                  <button 
                    onClick={() => {
                      if (roommates.length === 1) {
                        // 방장이고 혼자만 있을 때만 나가기 가능
                        setShowLeaveConfirm(true)
                      } else {
                        // 방장이지만 다른 사람이 있을 때는 알림
                        setShowHostLeaveAlert(true)
                      }
                    }}
                    className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                  >
                    <DoorOpen className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              myConfirmStatus === 'PENDING' && (
              <button 
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
              >
                <DoorOpen className="w-5 h-5" />
              </button>
              )
            )}
          </div>
          {roommatesLoading && (
            <div className="text-sm text-gray-500">불러오는 중...</div>
          )}
          {!roommatesLoading && roommates.length === 0 && (
            <div className="text-sm text-gray-500">룸메이트가 없습니다.</div>
          )}
          {roommates.map((mate) => {
            const displayName = mate.nickname 
              ? `${mate.nickname}${mate.name ? ` (${mate.name})` : ''}`
              : mate.name
            const displayMajor = mate.major || ''
            // 학번을 "21학번 (3학년) · 22세" 형식으로 변환
            let displayStudentNoGrade = ''
            if (mate.studentNo) {
              const shortYear = mate.studentNo.substring(2, 4)
              displayStudentNoGrade = mate.grade 
                ? `${shortYear}학번 (${mate.grade})`
                : `${shortYear}학번`
            } else if (mate.grade) {
              displayStudentNoGrade = `(${mate.grade})`
            }
            
            // 나이 추가
            if (mate.age) {
              displayStudentNoGrade += displayStudentNoGrade ? ` · ${mate.age}세` : `${mate.age}세`
            }
            
            const isExpanded = expandedRoommateIds.has(mate.roommateNo)
            
            const toggleRoommateChecklist = async () => {
              const isCurrentlyExpanded = expandedRoommateIds.has(mate.roommateNo)
              
              if (isCurrentlyExpanded) {
                // 접기
                setExpandedRoommateIds((prev) => {
                  const newSet = new Set(prev)
                  newSet.delete(mate.roommateNo)
                  return newSet
                })
              } else {
                // 펼치기 - 프로필과 체크리스트가 없으면 API 호출
                const needsProfile = !roommateProfiles[mate.userNo]
                const needsChecklist = !roommateChecklists[mate.userNo]
                
                if (needsProfile || needsChecklist) {
                  try {
                    const token = localStorage.getItem('accessToken')
                    if (!token) return

                    // 프로필과 체크리스트를 병렬로 가져오기
                    const [profileRes, checklistRes] = await Promise.all([
                      needsProfile ? fetch(`http://localhost:8080/api/users/profile/${mate.userNo}`, {
                        credentials: 'include',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }) : Promise.resolve(null),
                      needsChecklist ? fetch(`http://localhost:8080/api/users/${mate.userNo}/checklist`, {
                        credentials: 'include',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }) : Promise.resolve(null),
                    ])

                    // 프로필 저장
                    if (profileRes) {
                      if (profileRes.ok) {
                        const profileData = await profileRes.json()
                        const profile: any = profileData?.result ?? profileData?.data ?? profileData
                        console.log('[roommate] profile loaded:', profile)
                        setRoommateProfiles((prev) => ({
                          ...prev,
                          [mate.userNo]: profile,
                        }))
                      } else {
                        console.error('[roommate] profile fetch failed:', profileRes.status, await profileRes.text())
                      }
                    }

                    // 체크리스트 저장
                    if (checklistRes && checklistRes.ok) {
                      const checklistData = await checklistRes.json()
                      const payload: any = checklistData?.result ?? checklistData?.data ?? checklistData
                      
                      if (payload && payload.categories) {
                        // API 응답을 체크리스트 섹션 형식으로 변환
                        const checklistSections: ChecklistSection[] = payload.categories.map((category: {
                          category: string
                          items?: Array<{
                            label: string
                            value?: string
                            extraValue?: string
                            options?: Array<{ text: string; selected?: boolean }>
                          }>
                        }) => ({
                          title: category.category === 'BASIC_INFO' ? '기본 정보' 
                                : category.category === 'LIFESTYLE_PATTERN' ? '생활 패턴'
                                : '추가 규칙',
                          category: category.category,
                          items: category.items
                            ?.filter((item: { label: string }) => item.label !== '거주기간' && item.label !== '생활관')
                            .map((item: {
                              label: string
                              value?: string
                              extraValue?: string
                              options?: Array<{ text: string; selected?: boolean }>
                            }) => {
                              if (item.value !== undefined && item.value !== null) {
                                return {
                                  label: item.label,
                                  itemType: 'VALUE' as const,
                                  value: item.value,
                                }
                              } else if (item.options) {
                                return {
                                  label: item.label,
                                  itemType: 'OPTION' as const,
                                  extraValue: item.extraValue || '',
                                  options: item.options.map((opt: { text: string; selected?: boolean }) => ({
                                    text: opt.text,
                                    selected: opt.selected || false,
                                  })),
                                }
                              }
                              return null
                            })
                            .filter((item: any) => item !== null) || [],
                        }))

                        setRoommateChecklists((prev) => ({
                          ...prev,
                          [mate.userNo]: checklistSections,
                        }))
                      }
                    }
                  } catch (err) {
                    console.error('[roommate] profile/checklist fetch error', err)
                  }
                }
                
                // 펼치기
                setExpandedRoommateIds((prev) => {
                  const newSet = new Set(prev)
                  newSet.add(mate.roommateNo)
                  return newSet
                })
              }
            }
            
            // 체크리스트 데이터 (API에서 가져온 데이터)
            const roommateChecklist = roommateChecklists[mate.userNo] || []
            
            return (
              <div key={mate.roommateNo} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg text-gray-600 flex-shrink-0">
                    {displayName?.[0]}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center gap-1">
                      <div className="text-base font-semibold text-black">{displayName}</div>
                      {mate.roomRole === 'HOST' && (
                        <Star className="w-3 h-3 text-black fill-black stroke-2" />
                      )}
                    </div>
                    {displayStudentNoGrade && (
                      <div className="text-xs text-gray-500">{displayStudentNoGrade}</div>
                    )}
                    {displayMajor && (
                      <div className="text-xs text-gray-500">{displayMajor}</div>
                    )}
                  </div>
                </div>
                {showRoommateSettings && mate.confirmStatus === 'PENDING' && !mate.isMe ? (
                  <button 
                    onClick={() => {
                      setRoommateToRemove({ roommateNo: mate.roommateNo, name: displayName })
                    }}
                    className="w-full px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                  >
                    내보내기
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      {mate.confirmStatus === 'COMPLETED' && (
                        <span className="block w-full text-center text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded px-3 py-1.5">
                          방 배정 완료
                        </span>
                      )}
                      {mate.confirmStatus === 'ACCEPTED' && (
                        <span className="block w-full text-center text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded px-3 py-1.5">
                          방 배정 확정
                        </span>
                      )}
                      {mate.confirmStatus === 'PENDING' && (
                        <span className="block w-full text-center text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded px-3 py-1.5">
                          방 배정 대기
                        </span>
                      )}
                    </div>
                    <button
                      onClick={toggleRoommateChecklist}
                      className="text-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors"
                    >
                      {isExpanded ? '접기' : '상세 보기'}
                    </button>
                  </div>
                )}
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                    {/* 프로필 정보 - 항상 표시 */}
                    {(() => {
                      const profile = roommateProfiles[mate.userNo]
                      // 프로필이 없으면 룸메이트 정보에서 기본 정보 사용
                      const displayProfile = profile || {
                        name: mate.name,
                        studentNo: mate.studentNo,
                        grade: mate.grade,
                        gender: mate.gender,
                        major: mate.major,
                        age: mate.age,
                      }
                      
                      const hasAnyProfileData = displayProfile.name || displayProfile.studentNo || displayProfile.grade || 
                                                displayProfile.gender || displayProfile.major || 
                                                (displayProfile.age !== null && displayProfile.age !== undefined)
                      
                      return hasAnyProfileData ? (
                        <div>
                          <h4 className="text-base font-bold text-black mb-3">프로필 정보</h4>
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {displayProfile.name && (
                                <div>
                                  <div className="text-gray-500 mb-1">이름</div>
                                  <div className="text-black font-medium">{displayProfile.name}</div>
                                </div>
                              )}
                              {displayProfile.studentNo && (
                                <div>
                                  <div className="text-gray-500 mb-1">학번</div>
                                  <div className="text-black font-medium">{displayProfile.studentNo}</div>
                                </div>
                              )}
                              {displayProfile.grade && (
                                <div>
                                  <div className="text-gray-500 mb-1">학년</div>
                                  <div className="text-black font-medium">{displayProfile.grade}</div>
                                </div>
                              )}
                              {displayProfile.gender && (
                                <div>
                                  <div className="text-gray-500 mb-1">성별</div>
                                  <div className="text-black font-medium">{displayProfile.gender === 'MALE' ? '남성' : '여성'}</div>
                                </div>
                              )}
                              {displayProfile.major && (
                                <div>
                                  <div className="text-gray-500 mb-1">전공</div>
                                  <div className="text-black font-medium">{displayProfile.major}</div>
                                </div>
                              )}
                              {displayProfile.age !== null && displayProfile.age !== undefined && (
                                <div>
                                  <div className="text-gray-500 mb-1">나이</div>
                                  <div className="text-black font-medium">{displayProfile.age}세</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null
                    })()}
                    
                    {/* 체크리스트 */}
                    <div>
                      <h4 className="text-base font-bold text-black mb-3">체크리스트</h4>
                      {roommateChecklist.length > 0 ? (
                        roommateChecklist.map((section: ChecklistSection) => (
                          <div key={section.title} className={section.title !== roommateChecklist[0]?.title ? 'mt-4' : ''}>
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">{section.title}</h5>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                              <div className="space-y-3 text-sm text-gray-700">
                                {section.items.map((item: ChecklistItem) => (
                                  <div key={item.label} className="flex gap-2">
                                    <div className="w-24 text-gray-500 shrink-0">{item.label}</div>
                                    <div className={`flex flex-wrap gap-2 flex-1`}>
                                      {'value' in item && item.value ? (
                                        <span className="text-black font-medium">{item.value}</span>
                                      ) : item.options && item.options.length > 0 ? (
                                        item.options.map((option: ChecklistOption) => (
                                          <span
                                            key={option.text}
                                            className={
                                              option.selected
                                                ? `text-black font-semibold`
                                                : `text-gray-400`
                                            }
                                          >
                                            {option.text}
                                          </span>
                                        ))
                                      ) : null}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                          <div className="text-center py-4 text-gray-500 text-sm">
                            등록된 체크리스트가 없습니다.
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </>
        )}
          </>
        )}
        </div>
      </main>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar />

      {/* 내보내기 확인 모달 */}
      {roommateToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">룸메이트 내보내기</h3>
            <p className="text-sm text-gray-600 mb-6">
              <span className="font-semibold text-gray-900">{roommateToRemove.name}</span>님을 내보내시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRoommateToRemove(null)}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // TODO: 내보내기 API 호출
                  // toast.success(`${roommateToRemove.name}님을 내보냈습니다.`)
                  setRoommates(prev => prev.filter(r => r.roommateNo !== roommateToRemove.roommateNo))
                  setRoommateToRemove(null)
                  setShowRoommateSettings(false)
                }}
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                내보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 방 나가기 확인 모달 */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">방 나가기</h3>
            <p className="text-sm text-gray-600 mb-6">
              정말로 이 방에서 나가시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  // TODO: 방 나가기 API 호출
                  // toast.success('방에서 나갔습니다.')
                  setShowLeaveConfirm(false)
                  navigate('/rooms/search')
                }}
                className="flex-1 px-4 py-3 text-sm font-bold text-red-600 bg-[#FEDCDC] rounded-xl hover:bg-[#FED0D0] transition-colors"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 방장 나가기 알림 모달 */}
      {showHostLeaveAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">방 나가기 불가</h3>
            <p className="text-sm text-gray-600 mb-6">
              방장은 다른 룸메이트가 있을 때 방을 나갈 수 없습니다.<br />
              방을 나가려면 먼저 다른 룸메이트를 내보내거나<br />
              방장 권한을 양도해야 합니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHostLeaveAlert(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지원자 수락 확인 모달 */}
      {applicantToAccept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">지원자 수락</h3>
            <p className="text-sm text-gray-600 mb-6">
              <span className="font-semibold text-gray-900">{applicantToAccept.name}</span>님의 지원을 수락하시겠습니까?<br />
              수락하면 이 사람이 룸메이트로 확정됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setApplicantToAccept(null)}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!applicantToAccept || !room?.roomNo) return
                  
                  try {
                    const token = localStorage.getItem('accessToken')
                    if (!token) {
                      // toast.error('로그인이 필요합니다.')
                      return
                    }

                    const roomNo = String(room.roomNo)
                    const response = await fetch(
                      `http://localhost:8080/api/rooms/${roomNo}/join-request/${applicantToAccept.requestNo}/approve`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                      }
                    )

                    if (!response.ok) {
                      throw new Error('수락 실패')
                    }

                    // 지원자 목록에서 제거
                    setApplicants((prev) => prev.filter((app) => app.id !== applicantToAccept.id))
                    setApplicantToAccept(null)
                    // 전체 페이지를 새로고침하여 방 정보/룸메이트/지원자 목록을 모두 최신 상태로 갱신
                    window.location.reload()
                  } catch (error) {
                    console.error('지원자 수락 실패:', error)
                    // toast.error('지원자 수락에 실패했습니다.')
                  }
                }}
                className="flex-1 px-4 py-3 text-sm font-semibold text-blue-600 bg-[#DBEAFE] rounded-xl hover:bg-[#BFDBFE] transition-colors"
              >
                수락
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 지원자 거절 확인 모달 */}
      {applicantToReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">지원자 거절</h3>
            <p className="text-sm text-gray-600 mb-6">
              <span className="font-semibold text-gray-900">{applicantToReject.name}</span>님의 지원을 거절하시겠습니까?<br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setApplicantToReject(null)}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!applicantToReject) return
                  
                  try {
                    const token = localStorage.getItem('accessToken')
                    if (!token) {
                      // toast.error('로그인이 필요합니다.')
                      return
                    }

                    const response = await fetch(
                      `http://localhost:8080/api/join-request/${applicantToReject.requestNo}/reject`,
                      {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                      }
                    )

                    if (!response.ok) {
                      throw new Error('거절 실패')
                    }

                    // 지원자 목록에서 제거
                    setApplicants((prev) => prev.filter((app) => app.id !== applicantToReject.id))
                    setApplicantToReject(null)
                    // 전체 페이지를 새로고침하여 방 정보/룸메이트/지원자 목록을 모두 최신 상태로 갱신
                    window.location.reload()
                  } catch (error) {
                    console.error('지원자 거절 실패:', error)
                    // toast.error('지원자 거절에 실패했습니다.')
                  }
                }}
                className="flex-1 px-4 py-3 text-sm font-semibold text-red-600 bg-[#FEDCDC] rounded-xl hover:bg-[#FED0D0] transition-colors"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 방 배정 확정 확인 모달 */}
      {showConfirmAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">방 배정 확정</h3>
            <p className="text-sm text-gray-600 mb-6">
              방 배정을 확정하시겠습니까?<br />
              확정 후에는 방에서 나갈 수 없으며<br />
              되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmAssignment(false)}
                className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  if (!room?.roomNo) {
                    // toast.error('방 정보를 불러올 수 없습니다.')
                    return
                  }

                  try {
                    const token = localStorage.getItem('accessToken')
                    if (!token) {
                      // toast.error('로그인이 필요합니다.')
                      navigate('/login', { replace: true })
                      return
                    }

                    const params = new URLSearchParams({ roomNo: String(room.roomNo) })
                    const res = await fetch(`http://localhost:8080/api/rooms/me/confirm?${params.toString()}`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    })

                    if (res.status === 401) {
                      // toast.error('로그인이 필요합니다.')
                      navigate('/login', { replace: true })
                      return
                    }

                    if (!res.ok) {
                      const contentType = res.headers.get('content-type') ?? ''
                      const rawBody = await res.text()
                      console.error('[rooms] confirm assignment failed', {
                        status: res.status,
                        contentType,
                        body: rawBody,
                      })
                      throw new Error('방 배정 확정에 실패했습니다.')
                    }

                    // toast.success('방 배정이 확정되었습니다.')
                    setShowConfirmAssignment(false)
                    // 페이지 새로고침하여 상태 업데이트
                    window.location.reload()
                  } catch (err) {
                    console.error('[rooms] confirm assignment error', err)
                    // toast.error('방 배정 확정에 실패했습니다.')
                  }
                }}
                disabled={myConfirmStatus === 'ACCEPTED' || myConfirmStatus === 'COMPLETED'}
                className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-colors ${
                  myConfirmStatus === 'COMPLETED'
                    ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                    : myConfirmStatus === 'ACCEPTED'
                      ? 'bg-[#3072E1] text-white border border-[#3072E1] cursor-not-allowed opacity-60'
                      : 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                확정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyRoomPage
