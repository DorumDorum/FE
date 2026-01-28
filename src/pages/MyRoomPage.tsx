import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Bell, Home, Users, MessageCircle, Menu, Share2, Pencil, Settings, DoorOpen } from 'lucide-react'
import toast from 'react-hot-toast'

const MyRoomPage = () => {
  const navigate = useNavigate()
  type ApiRoom = {
    roomNo: number
    roomType: string
    capacity: number
    currentMateCount: number
    createdAt: string
    title: string
    hostNickname: string
    additionalTag: string[]
    roomStatus: string
    isHost?: boolean
  }

  type ApiRoommate = {
    roommateNo: number
    confirmStatus: string
    roomRole: string
    name: string
    nickname: string
    studentNo: string
    gender: string
    major?: string
    grade?: string
    age?: number
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
  }

  type ChecklistSection = {
    title: string
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

  const location = useLocation()
  const roomNoFromState = (location.state as { roomNo?: string } | null | undefined)?.roomNo

  const [room, setRoom] = useState<ApiRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'규칙' | '지원자' | '룸메이트'>('규칙')
  const [isHost, setIsHost] = useState<boolean>(() => localStorage.getItem('isHost') === 'true')
  const [roommates, setRoommates] = useState<ApiRoommate[]>([])
  const [roommatesLoading, setRoommatesLoading] = useState(true)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false)
  const [expandedRoommateIds, setExpandedRoommateIds] = useState<Set<number>>(new Set())
  const [expandedApplicantIds, setExpandedApplicantIds] = useState<Set<number>>(new Set())
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false) // 안 읽은 알람 여부
  const [showRoommateSettings, setShowRoommateSettings] = useState(false) // 룸메이트 설정 드롭다운
  const [roommateToRemove, setRoommateToRemove] = useState<{ roommateNo: number; name: string } | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false) // 방 나가기 확인
  const [applicantToAccept, setApplicantToAccept] = useState<{ id: number; name: string } | null>(null)
  const [applicantToReject, setApplicantToReject] = useState<{ id: number; name: string } | null>(null)
  const [otherNotes, setOtherNotes] = useState('')
  const [checklistSections, setChecklistSections] = useState<ChecklistSection[]>([])

  const mapApiRoomTypeToDisplay = (type: string) => {
    switch (type) {
      case 'ROOM_A':
        return '1 기숙사'
      case 'ROOM_B':
        return '2 기숙사'
      case 'ROOM_C':
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
        return '모집 종료'
      default:
        return '모집 중'
    }
  }

  const formatRelativeTime = (iso?: string): string => {
    if (!iso) return ''
    const now = new Date()
    const target = new Date(iso)
    const diffMs = now.getTime() - target.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)

    if (diffMin < 1) return '방금 전'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`

    const y = target.getFullYear()
    const m = String(target.getMonth() + 1).padStart(2, '0')
    const d = String(target.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  useEffect(() => {
    const fetchMyRoom = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          toast.error('로그인이 필요합니다.')
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
          toast.error('로그인이 필요합니다.')
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
        toast.error('내 방 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 방 규칙 조회
  useEffect(() => {
    // CheckMyRoomController에서 내려준 roomNo(state)를 그대로 사용한다.
    // state에 roomNo가 없으면 규칙 조회를 수행하지 않는다.
    if (!roomNoFromState) return
    const effectiveRoomNo = roomNoFromState

    const fetchRoomRule = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          toast.error('로그인이 필요합니다.')
          navigate('/login', { replace: true })
          return
        }

        const params = new URLSearchParams({ roomNo: effectiveRoomNo })
        const res = await fetch(`http://localhost:8080/api/rooms/me/rule?${params.toString()}`, {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          toast.error('로그인이 필요합니다.')
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
            items: category.items.map((item) => ({
              label: item.label,
              // VALUE 타입이면 value 사용, OPTION 타입이면 value는 사용하지 않음
              value: item.itemType === 'VALUE' ? item.value ?? '' : undefined,
              extraValue: item.extraValue ?? undefined,
              options: item.options?.map((opt) => ({
                text: opt.text,
                selected: opt.selected,
              })),
            })),
          }
        })

        setChecklistSections(mappedSections)
      } catch (err) {
        console.error('[rooms] my room rule fetch error', err)
        toast.error('방 규칙 정보를 불러오지 못했습니다.')
      }
    }

    void fetchRoomRule()
  }, [roomNoFromState, navigate])

  useEffect(() => {
    const fetchRoommates = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          toast.error('로그인이 필요합니다.')
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
          toast.error('로그인이 필요합니다.')
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
        toast.error('룸메이트 정보를 불러오지 못했습니다.')
      } finally {
        setRoommatesLoading(false)
      }
    }

    fetchRoommates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mapRoomRoleToDisplay = (role?: string) => {
    switch (role) {
      case 'HOST':
        return '방장'
      case 'MATE':
        return '룸메'
      default:
        return role || '룸메'
    }
  }

  const mapConfirmStatusToDisplay = (status?: string) => {
    switch (status) {
      case 'ACCEPTED':
        return '확정'
      case 'PENDING':
        return '대기'
      case 'REJECTED':
        return '거절'
      default:
        return status || '대기'
    }
  }

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
      prev.map((section, sIdx) =>
        sIdx !== sectionIndex
          ? section
          : {
              ...section,
              items: section.items.map((item, iIdx) => {
                if (iIdx !== itemIndex || !item.options) return item
                return {
                  ...item,
                  options: item.options.map((option, oIdx) => ({
                    ...option,
                    selected: oIdx === optionIndex,
                  })),
                }
              }),
            }
      )
    )
  }

  const displayRoomType = useMemo(
    () => (room ? mapApiRoomTypeToDisplay(room.roomType) : ''),
    [room]
  )
  const displayCapacity = room ? `${room.capacity}인실` : ''
  const displayMembers = room ? `${room.currentMateCount}/${room.capacity}명` : ''
  const displayStatus = room ? mapApiStatusToDisplay(room.roomStatus) : ''
  const displayCreatedAt = room ? formatRelativeTime(room.createdAt) : ''

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto">
        {/* 상단 바 */}
        <header className="bg-white h-15 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">방 관리</h1>
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
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <div className="flex items-center space-x-2">
              <span>{displayRoomType}</span>
              <span>·</span>
              <span>{displayCapacity}</span>
              <span>·</span>
              <span>{displayMembers}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{displayStatus}</span>
              <span>·</span>
              <span>{displayCreatedAt}</span>
            </div>
          </div>
          <h2 className="text-base font-semibold text-black mb-3">
            {room.title}
          </h2>
          <div className="flex flex-wrap gap-2 mb-4">
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
            <button className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 flex items-center justify-center gap-2">
              <Pencil className="w-4 h-4" />
              편집
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
                    onClick={() => {
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
                        toast.error('귀가 시간을 선택해 주세요.')
                        return
                      }

                      setIsEditingChecklist(false)
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
                        {'value' in item && item.value ? (
                          isEditingChecklist ? (
                            item.label === '학번(학년)' ? (
                              <select
                                value={item.value}
                                onChange={(e) => updateChecklistValue(index, itemIndex, e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm text-black"
                              >
                                {Array.from({ length: 11 }, (_, i) => 15 + i).map((year) => (
                                  <option key={year} value={`${year}학번`}>
                                    {year}학번
                                  </option>
                                ))}
                              </select>
                            ) : item.label === '나이(만)' ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={item.value}
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
                                value={item.value}
                                onChange={(e) => updateChecklistValue(index, itemIndex, e.target.value)}
                                className={`border border-gray-300 rounded px-2 py-1 text-sm text-black ${
                                  item.label === '드라이기' ? 'w-full' : 'flex-1 min-w-0'
                                }`}
                              />
                            )
                          ) : (
                            <span className="text-black font-medium">{item.value}</span>
                          )
                        ) : (
                          item.options?.map((option, optionIndex) => {
                            const optionLabel =
                              item.label === '소등' &&
                              option.text === '__시 이후' &&
                              option.selected &&
                              !isEditingChecklist &&
                              item.extraValue
                                ? `${item.extraValue} 이후`
                                : item.label === '귀가' &&
                                    option.text === '고정적' &&
                                    option.selected &&
                                    !isEditingChecklist &&
                                    item.extraValue
                                  ? `${item.extraValue} 고정적`
                                  : option.text
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
                                {optionLabel}
                              </span>
                            )
                          })
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
          <h3 className="text-base font-bold text-black">지원자 목록 (2명)</h3>
          {[
            {
              id: 1,
              name: '게임러버',
              dept: '기계 · 3학년',
              date: '2024-01-22',
              intro: '안녕하세요! 저는 게임을 좋아하지만 공부도 열심히 하는 학생입니다.',
              message: '조용한 환경에서 공부하고 싶어서 지원했습니다.',
            },
            {
              id: 2,
              name: '아침형인간',
              dept: '경영학 · 2학년',
              date: '2024-01-21',
              intro: '아침 일찍 일어나서 운동하고 공부하는 것을 좋아합니다.',
              message: '규칙적인 생활을 하는 룸메이트를 원해서 지원합니다.',
            },
          ].map((applicant) => {
            const isExpanded = expandedApplicantIds.has(applicant.id)
            
            const toggleApplicantChecklist = () => {
              setExpandedApplicantIds((prev) => {
                const newSet = new Set(prev)
                if (newSet.has(applicant.id)) {
                  newSet.delete(applicant.id)
                } else {
                  newSet.add(applicant.id)
                }
                return newSet
              })
            }
            
            // 더미 체크리스트 데이터
            const applicantChecklist = [
              {
                title: '기본 정보',
                items: [
                  { 
                    label: '단과대/학과', 
                    value: applicant.id === 1 ? '공과대학 기계공학과' : '경영대학 경영학과'
                  },
                  { 
                    label: '학번(학년)', 
                    value: applicant.id === 1 ? '21학번 (3학년)' : '22학번 (2학년)'
                  },
                  {
                    label: '나이(만)',
                    value: applicant.id === 1 ? '23세' : '22세',
                  },
                  {
                    label: '거주기간',
                    options: [
                      { text: '학기(16주)', selected: true },
                      { text: '반기(24주)', selected: false },
                      { text: '계절학기', selected: false },
                    ],
                  },
                  {
                    label: '생활관',
                    options: [
                      { text: '2', selected: true },
                      { text: '3', selected: false },
                      { text: '메디컬', selected: false },
                    ],
                  },
                ],
              },
              {
                title: '생활 패턴',
                items: [
                  { label: '취침', value: '12-1' },
                  { label: '기상', value: '7-9' },
                  {
                    label: '귀가',
                    options: [
                      { text: '유동적', selected: true },
                      { text: '고정적', selected: false },
                    ],
                  },
                  {
                    label: '청소',
                    options: [
                      { text: '주기적', selected: false },
                      { text: '비주기적', selected: true },
                    ],
                  },
                  {
                    label: '방에서 전화',
                    options: [
                      { text: '가능', selected: false },
                      { text: '불가능', selected: true },
                    ],
                  },
                  {
                    label: '잠귀',
                    options: [
                      { text: '밝음', selected: true },
                      { text: '어두움', selected: false },
                    ],
                  },
                  {
                    label: '잠버릇',
                    options: [
                      { text: '심함', selected: false },
                      { text: '중간', selected: true },
                      { text: '약함', selected: false },
                    ],
                  },
                  {
                    label: '코골이',
                    options: [
                      { text: '심함', selected: false },
                      { text: '중간', selected: false },
                      { text: '약함~없음', selected: true },
                    ],
                  },
                  {
                    label: '샤워시간',
                    options: [
                      { text: '아침', selected: true },
                      { text: '저녁', selected: false },
                    ],
                  },
                  {
                    label: '방에서 취식',
                    options: [
                      { text: '가능', selected: false },
                      { text: '불가능', selected: true },
                      { text: '가능+환기필수', selected: false },
                    ],
                  },
                  {
                    label: '소등',
                    options: [
                      { text: '__시 이후', selected: false },
                      { text: '한명 잘 때 알아서', selected: true },
                    ],
                  },
                  {
                    label: '본가 주기',
                    options: [
                      { text: '매주', selected: false },
                      { text: '2주', selected: false },
                      { text: '한달이상', selected: true },
                      { text: '거의 안 감', selected: false },
                    ],
                  },
                  {
                    label: '흡연',
                    options: [
                      { text: '연초', selected: false },
                      { text: '전자담배', selected: false },
                      { text: '비흡연', selected: true },
                    ],
                  },
                  {
                    label: '냉장고',
                    options: [
                      { text: '대여·구매·보유', selected: true },
                      { text: '협의 후 결정', selected: false },
                      { text: '필요 없음', selected: false },
                    ],
                  },
                ],
              },
              {
                title: '추가 규칙',
                items: [
                  {
                    label: '드라이기',
                    value: '12-7시만 피해 사용해 주면 좋을 것 같습니다.',
                  },
                  {
                    label: '이어폰',
                    options: [
                      { text: '항상', selected: true },
                      { text: '유동적', selected: false },
                    ],
                  },
                  {
                    label: '키스킨',
                    options: [
                      { text: '항상', selected: false },
                      { text: '유동적', selected: true },
                    ],
                  },
                  {
                    label: '더위',
                    options: [
                      { text: '많이 탐', selected: false },
                      { text: '중간', selected: true },
                      { text: '적게 탐', selected: false },
                    ],
                  },
                  {
                    label: '추위',
                    options: [
                      { text: '많이 탐', selected: false },
                      { text: '중간', selected: true },
                      { text: '적게 탐', selected: false },
                    ],
                  },
                  {
                    label: '공부',
                    options: [
                      { text: '기숙사 밖', selected: false },
                      { text: '기숙사 안', selected: false },
                      { text: '유동적', selected: true },
                    ],
                  },
                  {
                    label: '쓰레기통',
                    options: [
                      { text: '개별', selected: true },
                      { text: '공유', selected: false },
                    ],
                  },
                ],
              },
            ]
            
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
                      onClick={() => setApplicantToAccept({ id: applicant.id, name: applicant.name })}
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
                      onClick={() => setApplicantToReject({ id: applicant.id, name: applicant.name })}
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
              
              <div 
                className={`grid transition-all duration-300 ease-in-out ${
                  isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
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
                    
                    <div>
                      <h4 className="text-base font-bold text-black mb-2">기타</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          조용하고 깔끔한 환경을 선호합니다. 서로 배려하며 생활했으면 좋겠습니다.
                        </p>
                      </div>
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
                {roommates.length === 1 && (
                  <button 
                    onClick={() => setShowLeaveConfirm(true)}
                    className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
                  >
                    <DoorOpen className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowLeaveConfirm(true)}
                className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors"
              >
                <DoorOpen className="w-5 h-5" />
              </button>
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
            // 학번을 "21학번 (3학년) · 만 22세" 형식으로 변환
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
              displayStudentNoGrade += displayStudentNoGrade ? ` · 만 ${mate.age}세` : `만 ${mate.age}세`
            }
            
            const isExpanded = expandedRoommateIds.has(mate.roommateNo)
            
            const toggleRoommateChecklist = () => {
              setExpandedRoommateIds((prev) => {
                const newSet = new Set(prev)
                if (newSet.has(mate.roommateNo)) {
                  newSet.delete(mate.roommateNo)
                } else {
                  newSet.add(mate.roommateNo)
                }
                return newSet
              })
            }
            
            // 더미 체크리스트 데이터 (나중에 API로 대체 가능)
            const roommateChecklist = [
              {
                title: '기본 정보',
                items: [
                  { label: '단과대/학과', value: mate.major ? `${mate.major}` : '정보 없음' },
                  { label: '학번(학년)', value: displayStudentNoGrade.replace(' · 만 ' + mate.age + '세', '') || '정보 없음' },
                  { label: '나이(만)', value: mate.age ? `${mate.age}세` : '정보 없음' },
                  {
                    label: '거주기간',
                    options: [
                      { text: '학기(16주)', selected: true },
                      { text: '반기(24주)', selected: false },
                      { text: '계절학기', selected: false },
                    ],
                  },
                  {
                    label: '생활관',
                    options: [
                      { text: '2', selected: true },
                      { text: '3', selected: false },
                      { text: '메디컬', selected: false },
                    ],
                  },
                ],
              },
              {
                title: '생활 패턴',
                items: [
                  { label: '취침', value: '12-1' },
                  { label: '기상', value: '7-9' },
                  {
                    label: '귀가',
                    options: [
                      { text: '유동적', selected: true },
                      { text: '고정적', selected: false },
                    ],
                  },
                  {
                    label: '청소',
                    options: [
                      { text: '주기적', selected: false },
                      { text: '비주기적', selected: true },
                    ],
                  },
                  {
                    label: '방에서 전화',
                    options: [
                      { text: '가능', selected: false },
                      { text: '불가능', selected: true },
                    ],
                  },
                  {
                    label: '잠귀',
                    options: [
                      { text: '밝음', selected: true },
                      { text: '어두움', selected: false },
                    ],
                  },
                  {
                    label: '잠버릇',
                    options: [
                      { text: '심함', selected: false },
                      { text: '중간', selected: true },
                      { text: '약함', selected: false },
                    ],
                  },
                  {
                    label: '코골이',
                    options: [
                      { text: '심함', selected: false },
                      { text: '중간', selected: false },
                      { text: '약함~없음', selected: true },
                    ],
                  },
                  {
                    label: '샤워시간',
                    options: [
                      { text: '아침', selected: true },
                      { text: '저녁', selected: false },
                    ],
                  },
                  {
                    label: '방에서 취식',
                    options: [
                      { text: '가능', selected: false },
                      { text: '불가능', selected: true },
                      { text: '가능+환기필수', selected: false },
                    ],
                  },
                  {
                    label: '소등',
                    options: [
                      { text: '__시 이후', selected: false },
                      { text: '한명 잘 때 알아서', selected: true },
                    ],
                  },
                  {
                    label: '본가 주기',
                    options: [
                      { text: '매주', selected: false },
                      { text: '2주', selected: false },
                      { text: '한달이상', selected: true },
                      { text: '거의 안 감', selected: false },
                    ],
                  },
                  {
                    label: '흡연',
                    options: [
                      { text: '연초', selected: false },
                      { text: '전자담배', selected: false },
                      { text: '비흡연', selected: true },
                    ],
                  },
                  {
                    label: '냉장고',
                    options: [
                      { text: '대여·구매·보유', selected: true },
                      { text: '협의 후 결정', selected: false },
                      { text: '필요 없음', selected: false },
                    ],
                  },
                ],
              },
              {
                title: '추가 규칙',
                items: [
                  {
                    label: '드라이기',
                    value: '12-7시만 피해 사용해 주면 좋을 것 같습니다.(불가피하게 사용해야한다면 화장실에서)',
                  },
                  {
                    label: '이어폰',
                    options: [
                      { text: '항상', selected: true },
                      { text: '유동적', selected: false },
                    ],
                  },
                  {
                    label: '키스킨',
                    options: [
                      { text: '항상', selected: false },
                      { text: '유동적', selected: true },
                    ],
                  },
                  {
                    label: '더위',
                    options: [
                      { text: '많이 탐', selected: false },
                      { text: '중간', selected: true },
                      { text: '적게 탐', selected: false },
                    ],
                  },
                  {
                    label: '추위',
                    options: [
                      { text: '많이 탐', selected: false },
                      { text: '중간', selected: true },
                      { text: '적게 탐', selected: false },
                    ],
                  },
                  {
                    label: '공부',
                    options: [
                      { text: '기숙사 밖', selected: false },
                      { text: '기숙사 안', selected: false },
                      { text: '유동적', selected: true },
                    ],
                  },
                  {
                    label: '쓰레기통',
                    options: [
                      { text: '개별', selected: true },
                      { text: '공유', selected: false },
                    ],
                  },
                ],
              },
            ]
            
            return (
              <div key={mate.roommateNo} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-lg text-gray-600 flex-shrink-0">
                      {displayName?.[0]}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-base font-semibold text-black">{displayName}</div>
                      {displayMajor && (
                        <div className="text-xs text-gray-500">{displayMajor}</div>
                      )}
                      {displayStudentNoGrade && (
                        <div className="text-xs text-gray-400">{displayStudentNoGrade}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {showRoommateSettings && mate.confirmStatus === 'PENDING' ? (
                      <button 
                        onClick={() => {
                          setRoommateToRemove({ roommateNo: mate.roommateNo, name: displayName })
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded hover:bg-red-600 transition-colors"
                      >
                        내보내기
                      </button>
                    ) : (
                      <>
                        {mate.confirmStatus === 'COMPLETED' && (
                          <span className="text-xs font-semibold text-green-700 bg-green-100 border border-green-200 rounded px-2 py-1">
                            방 배정 완료
                          </span>
                        )}
                        {mate.confirmStatus === 'ACCEPTED' && (
                          <span className="text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded px-2 py-1">
                            방 배정 확정
                          </span>
                        )}
                        {mate.confirmStatus === 'PENDING' && (
                          <span className="text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded px-2 py-1">
                            방 배정 대기
                          </span>
                        )}
                        <button
                          onClick={toggleRoommateChecklist}
                          className="px-3 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors whitespace-nowrap"
                        >
                          {isExpanded ? '접기' : '체크리스트 보기'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div 
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                    {roommateChecklist.map((section) => (
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
                    
                    <div>
                      <h4 className="text-base font-bold text-black mb-2">기타</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          조용하고 깔끔한 환경을 선호합니다. 서로 배려하며 생활했으면 좋겠습니다.
                        </p>
                      </div>
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
      <nav className="bg-blue-50 border-t border-blue-100 h-15 px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1">
            <Home className="w-6 h-6 text-blue-600" />
            <span className="text-blue-600 text-xs font-semibold">방 관리</span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <Users className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600 text-xs">룸메 찾기</span>
          </button>
          <button className="flex flex-col items-center space-y-1 relative">
            <MessageCircle className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600 text-xs">채팅</span>
            <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
          </button>
          <button className="flex flex-col items-center space-y-1">
            <Menu className="w-6 h-6 text-gray-600" />
            <span className="text-gray-600 text-xs">마이페이지</span>
          </button>
        </div>
      </nav>

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
                  toast.success(`${roommateToRemove.name}님을 내보냈습니다.`)
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
                  toast.success('방에서 나갔습니다.')
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
                onClick={() => {
                  // TODO: 지원자 수락 API 호출
                  toast.success(`${applicantToAccept.name}님의 지원을 수락했습니다.`)
                  setApplicantToAccept(null)
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
                onClick={() => {
                  // TODO: 지원자 거절 API 호출
                  setApplicantToReject(null)
                }}
                className="flex-1 px-4 py-3 text-sm font-semibold text-red-600 bg-[#FEDCDC] rounded-xl hover:bg-[#FED0D0] transition-colors"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyRoomPage
