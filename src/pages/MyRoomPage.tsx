import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Share2, Pencil, Settings, DoorOpen, CheckCircle, Star } from 'lucide-react'
import BottomNavigationBar from '../components/ui/BottomNavigationBar'
import GuestOnlyMessage from '../components/ui/GuestOnlyMessage'
import { getApiUrl } from '../utils/api'
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
  type ApiRoomRule = {
    otherNotes: string | null
    bedtime: string
    wakeUp: string
    returnHome: string
    returnHomeTime: string
    cleaning: string
    phoneCall: string
    sleepLight: string
    sleepHabit: string
    snoring: string
    showerTime: string
    eating: string
    lightsOut: string
    lightsOutTime: string
    homeVisit: string
    smoking: string
    refrigerator: string
    hairDryer: string | null
    alarm: string | null
    earphone: string | null
    keyskin: string | null
    heat: string | null
    cold: string | null
    study: string | null
    trashCan: string | null
  }

  const [room, setRoom] = useState<ApiRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [activeTab, setActiveTab] = useState<'규칙' | '지원자' | '룸메이트'>('규칙')
  const [roommates, setRoommates] = useState<ApiRoommate[]>([])
  const isHost = useMemo(() => roommates.some((m) => m.isMe && m.roomRole === 'HOST'), [roommates])
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
          setIsGuest(true)
          setLoading(false)
          return
        }
        setIsGuest(false)

        // 1) CheckMyRoom 먼저 호출 - 방 없으면 LoadMyRoom 호출하지 않음
        const existsRes = await fetch(getApiUrl('/api/rooms/me/exists'), {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })

        if (existsRes.status === 401) {
          setIsGuest(true)
          setLoading(false)
          return
        }

        const existsRawBody = await existsRes.text()
        let existsData: any
        try {
          existsData = existsRawBody ? JSON.parse(existsRawBody) : null
        } catch (e) {
          setRoom(null)
          setLoading(false)
          return
        }

        // ResponseEntity<CheckMyRoomResponse> 형식: 직접 접근
        const existsPayload = existsData
        if (!existsPayload?.isExist) {
          setRoom(null)
          setLoading(false)
          return
        }

        // 2) 방이 있을 때만 LoadMyRoom 호출 (쿼리 방지)
        const res = await fetch(getApiUrl('/api/rooms/me'), {
          credentials: 'include',
          headers: { Authorization: `Bearer ${token}` },
        })

        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[rooms] my room fetch failed', { status: res.status })
          setRoom(null)
          setLoading(false)
          return
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] my room parse error', e)
          setRoom(null)
          setLoading(false)
          return
        }

        // ResponseEntity<FindRoomsResponse> 형식: 직접 접근
        const payload = data
        setRoom(payload ?? null)
      } catch (err) {
        console.error('[rooms] my room fetch error', err)
        setRoom(null)
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
        if (!token) return

        const res = await fetch(getApiUrl(`/api/rooms/${effectiveRoomNo}/rule`), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) return

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

        // ResponseEntity<MyRoomRuleResponse> 형식: 직접 접근
        const payload: ApiRoomRule | null = data
        if (!payload) return

        // 비고
        setOtherNotes(payload.otherNotes ?? '')

        // Enum을 한글로 변환하는 함수들 (MyPage와 동일)
        const mapReturnHomeFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'FLEXIBLE') return { text: '유동적', selected: true }
          if (enumValue === 'FIXED') return { text: '고정적', selected: true }
          return { text: '유동적', selected: false }
        }

        const mapCleaningFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'REGULAR') return { text: '주기적', selected: true }
          if (enumValue === 'IRREGULAR') return { text: '비주기적', selected: true }
          return { text: '주기적', selected: false }
        }

        const mapPhoneCallFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'ALLOWED') return { text: '가능', selected: true }
          if (enumValue === 'NOT_ALLOWED') return { text: '불가능', selected: true }
          return { text: '가능', selected: false }
        }

        const mapSleepLightFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'BRIGHT') return { text: '밝음', selected: true }
          if (enumValue === 'DARK') return { text: '어두움', selected: true }
          return { text: '밝음', selected: false }
        }

        const mapSleepHabitFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'SEVERE') return { text: '심함', selected: true }
          if (enumValue === 'MODERATE') return { text: '중간', selected: true }
          if (enumValue === 'MILD') return { text: '약함', selected: true }
          return { text: '약함', selected: false }
        }

        const mapSnoringFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'SEVERE') return { text: '심함', selected: true }
          if (enumValue === 'MODERATE') return { text: '중간', selected: true }
          if (enumValue === 'MILD_OR_NONE') return { text: '약함~없음', selected: true }
          return { text: '약함~없음', selected: false }
        }

        const mapShowerTimeFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'MORNING') return { text: '아침', selected: true }
          if (enumValue === 'EVENING') return { text: '저녁', selected: true }
          return { text: '아침', selected: false }
        }

        const mapEatingFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'ALLOWED') return { text: '가능', selected: true }
          if (enumValue === 'NOT_ALLOWED') return { text: '불가능', selected: true }
          if (enumValue === 'ALLOWED_WITH_VENTILATION') return { text: '가능+환기필수', selected: true }
          return { text: '가능', selected: false }
        }

        const mapLightsOutFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'AFTER_TIME') return { text: '__시 이후', selected: true }
          if (enumValue === 'WHEN_ONE_SLEEPS') return { text: '한명 잘 때 알아서', selected: true }
          return { text: '한명 잘 때 알아서', selected: false }
        }

        const mapHomeVisitFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'WEEKLY') return { text: '매주', selected: true }
          if (enumValue === 'BIWEEKLY') return { text: '2주', selected: true }
          if (enumValue === 'MONTHLY_OR_MORE') return { text: '한달이상', selected: true }
          if (enumValue === 'RARELY') return { text: '거의 안 감', selected: true }
          return { text: '매주', selected: false }
        }

        const mapSmokingFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'CIGARETTE') return { text: '연초', selected: true }
          if (enumValue === 'E_CIGARETTE') return { text: '전자담배', selected: true }
          if (enumValue === 'NON_SMOKER') return { text: '비흡연', selected: true }
          return { text: '비흡연', selected: false }
        }

        const mapRefrigeratorFromEnum = (enumValue: string): { text: string; selected: boolean } => {
          if (enumValue === 'RENT_PURCHASE_OWN') return { text: '대여·구매·보유', selected: true }
          if (enumValue === 'DECIDE_AFTER_DISCUSSION') return { text: '협의 후 결정', selected: true }
          if (enumValue === 'NOT_NEEDED') return { text: '필요 없음', selected: true }
          return { text: '필요 없음', selected: false }
        }

        const mapAlarmFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'VIBRATION') return { text: '진동', selected: true }
          if (enumValue === 'SOUND') return { text: '소리', selected: true }
          return { text: '진동', selected: false }
        }

        const mapEarphoneFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'ALWAYS') return { text: '항상', selected: true }
          if (enumValue === 'FLEXIBLE') return { text: '유동적', selected: true }
          return { text: '항상', selected: false }
        }

        const mapKeyskinFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'ALWAYS') return { text: '항상', selected: true }
          if (enumValue === 'FLEXIBLE') return { text: '유동적', selected: true }
          return { text: '항상', selected: false }
        }

        const mapHeatFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'VERY_SENSITIVE') return { text: '많이 탐', selected: true }
          if (enumValue === 'MODERATE') return { text: '중간', selected: true }
          if (enumValue === 'LESS_SENSITIVE') return { text: '적게 탐', selected: true }
          return { text: '중간', selected: false }
        }

        const mapColdFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'VERY_SENSITIVE') return { text: '많이 탐', selected: true }
          if (enumValue === 'MODERATE') return { text: '중간', selected: true }
          if (enumValue === 'LESS_SENSITIVE') return { text: '적게 탐', selected: true }
          return { text: '중간', selected: false }
        }

        const mapStudyFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'OUTSIDE_DORM') return { text: '기숙사 밖', selected: true }
          if (enumValue === 'INSIDE_DORM') return { text: '기숙사 안', selected: true }
          if (enumValue === 'FLEXIBLE') return { text: '유동적', selected: true }
          return { text: '유동적', selected: false }
        }

        const mapTrashCanFromEnum = (enumValue: string | null): { text: string; selected: boolean } => {
          if (enumValue === 'INDIVIDUAL') return { text: '개별', selected: true }
          if (enumValue === 'SHARED') return { text: '공유', selected: true }
          return { text: '개별', selected: false }
        }

        // 기본 템플릿 생성 (MyPage와 동일한 구조)
        const defaultTemplate: ChecklistSection[] = [
          {
            title: '생활 패턴',
            category: 'LIFESTYLE_PATTERN',
            items: [
              { label: '취침', itemType: 'VALUE', value: '' },
              { label: '기상', itemType: 'VALUE', value: '' },
              {
                label: '귀가',
                itemType: 'OPTION',
                extraValue: '',
                options: [
                  { text: '유동적', selected: false },
                  { text: '고정적', selected: false },
                ],
              },
              {
                label: '청소',
                itemType: 'OPTION',
                options: [
                  { text: '주기적', selected: false },
                  { text: '비주기적', selected: false },
                ],
              },
              {
                label: '방에서 전화',
                itemType: 'OPTION',
                options: [
                  { text: '가능', selected: false },
                  { text: '불가능', selected: false },
                ],
              },
              {
                label: '잠귀',
                itemType: 'OPTION',
                options: [
                  { text: '밝음', selected: false },
                  { text: '어두움', selected: false },
                ],
              },
              {
                label: '잠버릇',
                itemType: 'OPTION',
                options: [
                  { text: '심함', selected: false },
                  { text: '중간', selected: false },
                  { text: '약함', selected: false },
                ],
              },
              {
                label: '코골이',
                itemType: 'OPTION',
                options: [
                  { text: '심함', selected: false },
                  { text: '중간', selected: false },
                  { text: '약함~없음', selected: false },
                ],
              },
              {
                label: '샤워시간',
                itemType: 'OPTION',
                options: [
                  { text: '아침', selected: false },
                  { text: '저녁', selected: false },
                ],
              },
              {
                label: '방에서 취식',
                itemType: 'OPTION',
                options: [
                  { text: '가능', selected: false },
                  { text: '불가능', selected: false },
                  { text: '가능+환기필수', selected: false },
                ],
              },
              {
                label: '소등',
                itemType: 'OPTION',
                extraValue: '',
                options: [
                  { text: '__시 이후', selected: false },
                  { text: '한명 잘 때 알아서', selected: false },
                ],
              },
              {
                label: '본가 주기',
                itemType: 'OPTION',
                options: [
                  { text: '매주', selected: false },
                  { text: '2주', selected: false },
                  { text: '한달이상', selected: false },
                  { text: '거의 안 감', selected: false },
                ],
              },
              {
                label: '흡연',
                itemType: 'OPTION',
                options: [
                  { text: '연초', selected: false },
                  { text: '전자담배', selected: false },
                  { text: '비흡연', selected: false },
                ],
              },
              {
                label: '냉장고',
                itemType: 'OPTION',
                options: [
                  { text: '대여·구매·보유', selected: false },
                  { text: '협의 후 결정', selected: false },
                  { text: '필요 없음', selected: false },
                ],
              },
            ],
          },
          {
            title: '추가 규칙',
            category: 'ADDITIONAL_RULES',
            items: [
              { label: '드라이기', itemType: 'VALUE', value: '' },
              {
                label: '알람',
                itemType: 'OPTION',
                options: [
                  { text: '진동', selected: false },
                  { text: '소리', selected: false },
                ],
              },
              {
                label: '이어폰',
                itemType: 'OPTION',
                options: [
                  { text: '항상', selected: false },
                  { text: '유동적', selected: false },
                ],
              },
              {
                label: '키스킨',
                itemType: 'OPTION',
                options: [
                  { text: '항상', selected: false },
                  { text: '유동적', selected: false },
                ],
              },
              {
                label: '더위',
                itemType: 'OPTION',
                options: [
                  { text: '많이 탐', selected: false },
                  { text: '중간', selected: false },
                  { text: '적게 탐', selected: false },
                ],
              },
              {
                label: '추위',
                itemType: 'OPTION',
                options: [
                  { text: '많이 탐', selected: false },
                  { text: '중간', selected: false },
                  { text: '적게 탐', selected: false },
                ],
              },
              {
                label: '공부',
                itemType: 'OPTION',
                options: [
                  { text: '기숙사 밖', selected: false },
                  { text: '기숙사 안', selected: false },
                  { text: '유동적', selected: false },
                ],
              },
              {
                label: '쓰레기통',
                itemType: 'OPTION',
                options: [
                  { text: '개별', selected: false },
                  { text: '공유', selected: false },
                ],
              },
            ],
          },
        ]

        // 기본 템플릿과 API 응답을 병합
        const mappedSections: ChecklistSection[] = defaultTemplate.map((defaultSection) => {
          if (defaultSection.category === 'LIFESTYLE_PATTERN') {
            const mergedItems = defaultSection.items.map((defaultItem) => {
              if (defaultItem.label === '취침') {
                return { ...defaultItem, value: payload.bedtime || '' }
              }
              if (defaultItem.label === '기상') {
                return { ...defaultItem, value: payload.wakeUp || '' }
              }
              if (defaultItem.label === '귀가') {
                const mapped = mapReturnHomeFromEnum(payload.returnHome || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || [],
                  extraValue: payload.returnHomeTime || ''
                }
              }
              if (defaultItem.label === '청소') {
                const mapped = mapCleaningFromEnum(payload.cleaning || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '방에서 전화') {
                const mapped = mapPhoneCallFromEnum(payload.phoneCall || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '잠귀') {
                const mapped = mapSleepLightFromEnum(payload.sleepLight || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '잠버릇') {
                const mapped = mapSleepHabitFromEnum(payload.sleepHabit || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '코골이') {
                const mapped = mapSnoringFromEnum(payload.snoring || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '샤워시간') {
                const mapped = mapShowerTimeFromEnum(payload.showerTime || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '방에서 취식') {
                const mapped = mapEatingFromEnum(payload.eating || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '소등') {
                const mapped = mapLightsOutFromEnum(payload.lightsOut || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || [],
                  extraValue: payload.lightsOutTime || ''
                }
              }
              if (defaultItem.label === '본가 주기') {
                const mapped = mapHomeVisitFromEnum(payload.homeVisit || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '흡연') {
                const mapped = mapSmokingFromEnum(payload.smoking || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '냉장고') {
                const mapped = mapRefrigeratorFromEnum(payload.refrigerator || '')
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              return defaultItem
            })
            return { ...defaultSection, items: mergedItems }
          }
          if (defaultSection.category === 'ADDITIONAL_RULES') {
            const mergedItems = defaultSection.items.map((defaultItem) => {
              if (defaultItem.label === '드라이기') {
                return { ...defaultItem, value: payload.hairDryer || '' }
              }
              if (defaultItem.label === '알람') {
                const mapped = mapAlarmFromEnum(payload.alarm || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '이어폰') {
                const mapped = mapEarphoneFromEnum(payload.earphone || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '키스킨') {
                const mapped = mapKeyskinFromEnum(payload.keyskin || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '더위') {
                const mapped = mapHeatFromEnum(payload.heat || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '추위') {
                const mapped = mapColdFromEnum(payload.cold || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '공부') {
                const mapped = mapStudyFromEnum(payload.study || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              if (defaultItem.label === '쓰레기통') {
                const mapped = mapTrashCanFromEnum(payload.trashCan || null)
                return {
                  ...defaultItem,
                  options: defaultItem.options?.map(opt => ({
                    ...opt,
                    selected: opt.text === mapped.text
                  })) || []
                }
              }
              return defaultItem
            })
            return { ...defaultSection, items: mergedItems }
          }
          return defaultSection
        })

        setChecklistSections(mappedSections)
      } catch (err) {
        console.error('[rooms] my room rule fetch error', err)
        // toast.error('방 규칙 정보를 불러오지 못했습니다.')
      }
    }

    void fetchRoomRule()
  }, [room?.roomNo, navigate, activeTab])

  // 룸메이트 조회 (room 로드 시 isHost 계산용으로 먼저 로드, 룸메이트 탭에서 재조회)
  useEffect(() => {
    if (!room?.roomNo) return

    const fetchRoommates = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        const res = await fetch(getApiUrl('/api/rooms/me/roommates'), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) return

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[rooms] roommates fetch failed', { status: res.status, contentType, body: rawBody })
          return
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] roommates parse error', { contentType, rawBody }, e)
          return
        }

        // ResponseEntity<FindRoomsResponse> 형식: 직접 접근
        const payload = data
        setRoommates(Array.isArray(payload) ? payload : [])
      } catch (err) {
        console.error('[rooms] roommates fetch error', err)
      } finally {
        setRoommatesLoading(false)
      }
    }

    fetchRoommates()
  }, [room?.roomNo, navigate])

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

        const res = await fetch(getApiUrl(`/api/rooms/${effectiveRoomNo}/applications`), {
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

        // ResponseEntity<FindRoomsResponse> 형식: 직접 접근
        const payload = data
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
    <div className="page-with-bottom-nav h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
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
        {!loading && isGuest && (
          <GuestOnlyMessage />
        )}
        {!loading && !isGuest && !room && (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] px-4">
            <p className="text-lg font-medium text-gray-700 mb-2">
              속한 방이 없습니다.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              룸메를 찾아보세요
            </p>
            <button
              onClick={() => navigate('/rooms/search')}
              className="bg-[#3072E1] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2563E1] active:scale-[0.99] transition-colors"
            >
              룸메 찾기
            </button>
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
                        const updateRes = await fetch(`${getApiUrl('/api/rooms/me/title')}?${params.toString()}`, {
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

                        // Enum 매핑 함수들 (CreateRoomModal과 동일)
                        const mapReturnHome = (text: string): string => {
                          if (text === '유동적') return 'FLEXIBLE'
                          if (text === '고정적') return 'FIXED'
                          return 'FLEXIBLE'
                        }

                        const mapCleaning = (text: string): string => {
                          if (text === '주기적') return 'REGULAR'
                          if (text === '비주기적') return 'IRREGULAR'
                          return 'REGULAR'
                        }

                        const mapPhoneCall = (text: string): string => {
                          if (text === '가능') return 'ALLOWED'
                          if (text === '불가능') return 'NOT_ALLOWED'
                          return 'ALLOWED'
                        }

                        const mapSleepLight = (text: string): string => {
                          if (text === '밝음') return 'BRIGHT'
                          if (text === '어두움') return 'DARK'
                          return 'BRIGHT'
                        }

                        const mapSleepHabit = (text: string): string => {
                          if (text === '심함') return 'SEVERE'
                          if (text === '중간') return 'MODERATE'
                          if (text === '약함') return 'MILD'
                          return 'MILD'
                        }

                        const mapSnoring = (text: string): string => {
                          if (text === '심함') return 'SEVERE'
                          if (text === '중간') return 'MODERATE'
                          if (text === '약함~없음') return 'MILD_OR_NONE'
                          return 'MILD_OR_NONE'
                        }

                        const mapShowerTime = (text: string): string => {
                          if (text === '아침') return 'MORNING'
                          if (text === '저녁') return 'EVENING'
                          return 'MORNING'
                        }

                        const mapEating = (text: string): string => {
                          if (text === '가능') return 'ALLOWED'
                          if (text === '불가능') return 'NOT_ALLOWED'
                          if (text === '가능+환기필수') return 'ALLOWED_WITH_VENTILATION'
                          return 'ALLOWED'
                        }

                        const mapLightsOut = (text: string): string => {
                          if (text === '__시 이후') return 'AFTER_TIME'
                          if (text === '한명 잘 때 알아서') return 'WHEN_ONE_SLEEPS'
                          return 'WHEN_ONE_SLEEPS'
                        }

                        const mapHomeVisit = (text: string): string => {
                          if (text === '매주') return 'WEEKLY'
                          if (text === '2주') return 'BIWEEKLY'
                          if (text === '한달이상') return 'MONTHLY_OR_MORE'
                          if (text === '거의 안 감') return 'RARELY'
                          return 'WEEKLY'
                        }

                        const mapSmoking = (text: string): string => {
                          if (text === '연초') return 'CIGARETTE'
                          if (text === '전자담배') return 'E_CIGARETTE'
                          if (text === '비흡연') return 'NON_SMOKER'
                          return 'NON_SMOKER'
                        }

                        const mapRefrigerator = (text: string): string => {
                          if (text === '대여·구매·보유') return 'RENT_PURCHASE_OWN'
                          if (text === '협의 후 결정') return 'DECIDE_AFTER_DISCUSSION'
                          if (text === '필요 없음') return 'NOT_NEEDED'
                          return 'NOT_NEEDED'
                        }

                        const mapAlarm = (text: string): string | null => {
                          if (text === '진동') return 'VIBRATION'
                          if (text === '소리') return 'SOUND'
                          return null
                        }

                        const mapEarphone = (text: string): string | null => {
                          if (text === '항상') return 'ALWAYS'
                          if (text === '유동적') return 'FLEXIBLE'
                          return null
                        }

                        const mapKeyskin = (text: string): string | null => {
                          if (text === '항상') return 'ALWAYS'
                          if (text === '유동적') return 'FLEXIBLE'
                          return null
                        }

                        const mapHeat = (text: string): string | null => {
                          if (text === '많이 탐') return 'VERY_SENSITIVE'
                          if (text === '중간') return 'MODERATE'
                          if (text === '적게 탐') return 'LESS_SENSITIVE'
                          return null
                        }

                        const mapCold = (text: string): string | null => {
                          if (text === '많이 탐') return 'VERY_SENSITIVE'
                          if (text === '중간') return 'MODERATE'
                          if (text === '적게 탐') return 'LESS_SENSITIVE'
                          return null
                        }

                        const mapStudy = (text: string): string | null => {
                          if (text === '기숙사 밖') return 'OUTSIDE_DORM'
                          if (text === '기숙사 안') return 'INSIDE_DORM'
                          if (text === '유동적') return 'FLEXIBLE'
                          return null
                        }

                        const mapTrashCan = (text: string): string | null => {
                          if (text === '개별') return 'INDIVIDUAL'
                          if (text === '공유') return 'SHARED'
                          return null
                        }

                        // 체크리스트 데이터 구성
                        const lifestyleSection = checklistSections.find(s => s.category === 'LIFESTYLE_PATTERN')
                        const additionalSection = checklistSections.find(s => s.category === 'ADDITIONAL_RULES')

                        const getItemValue = (label: string) => {
                          const item = lifestyleSection?.items.find(i => i.label === label) || additionalSection?.items.find(i => i.label === label)
                          return item?.value || ''
                        }

                        const getSelectedOption = (label: string) => {
                          const item = lifestyleSection?.items.find(i => i.label === label) || additionalSection?.items.find(i => i.label === label)
                          return item?.options?.find(opt => opt.selected)?.text || null
                        }

                        const getExtraValue = (label: string) => {
                          const item = lifestyleSection?.items.find(i => i.label === label) || additionalSection?.items.find(i => i.label === label)
                          return item?.extraValue || ''
                        }

                        const rule = {
                          bedtime: getItemValue('취침'),
                          wakeUp: getItemValue('기상'),
                          returnHome: mapReturnHome(getSelectedOption('귀가') || ''),
                          returnHomeTime: getExtraValue('귀가'),
                          cleaning: mapCleaning(getSelectedOption('청소') || ''),
                          phoneCall: mapPhoneCall(getSelectedOption('방에서 전화') || ''),
                          sleepLight: mapSleepLight(getSelectedOption('잠귀') || ''),
                          sleepHabit: mapSleepHabit(getSelectedOption('잠버릇') || ''),
                          snoring: mapSnoring(getSelectedOption('코골이') || ''),
                          showerTime: mapShowerTime(getSelectedOption('샤워시간') || ''),
                          eating: mapEating(getSelectedOption('방에서 취식') || ''),
                          lightsOut: mapLightsOut(getSelectedOption('소등') || ''),
                          lightsOutTime: getExtraValue('소등'),
                          homeVisit: mapHomeVisit(getSelectedOption('본가 주기') || ''),
                          smoking: mapSmoking(getSelectedOption('흡연') || ''),
                          refrigerator: mapRefrigerator(getSelectedOption('냉장고') || ''),
                          hairDryer: getItemValue('드라이기') || null,
                          alarm: mapAlarm(getSelectedOption('알람') || ''),
                          earphone: mapEarphone(getSelectedOption('이어폰') || ''),
                          keyskin: mapKeyskin(getSelectedOption('키스킨') || ''),
                          heat: mapHeat(getSelectedOption('더위') || ''),
                          cold: mapCold(getSelectedOption('추위') || ''),
                          study: mapStudy(getSelectedOption('공부') || ''),
                          trashCan: mapTrashCan(getSelectedOption('쓰레기통') || ''),
                          otherNotes: otherNotes || null,
                        }

                        const params = new URLSearchParams({ roomNo: String(room.roomNo) })
                        const res = await fetch(`${getApiUrl('/api/rooms/me/rule')}?${params.toString()}`, {
                          method: 'PUT',
                          credentials: 'include',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            rule,
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
                          const refreshRes = await fetch(`getApiUrl('/api/rooms/me/rule?${params.toString()}`, {
                            credentials: 'include',
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          })
                          if (refreshRes.ok) {
                            const refreshData = await refreshRes.json()
                            // ResponseEntity<MyRoomRuleResponse> 형식: 직접 접근
                            const refreshPayload: ApiRoomRule | null = refreshData
                            if (refreshPayload) {
                              setOtherNotes(refreshPayload.otherNotes ?? '')
                              // fetchRoomRule과 동일한 로직 사용 (Enum 매핑 함수 재사용)
                              // 여기서는 간단히 window.location.reload()로 처리하거나
                              // fetchRoomRule 로직을 재사용하는 것이 좋지만,
                              // 코드 중복을 피하기 위해 페이지 새로고침으로 처리
                              window.location.reload()
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

                      const res = await fetch(getApiUrl(`/api/users/${applicant.userNo}/checklist`), {
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

                      // ResponseEntity 형식: 직접 접근
                      const payload: any = data
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
                      needsProfile ? fetch(getApiUrl(`/api/users/profile/${mate.userNo}`), {
                        credentials: 'include',
                        headers: {
                          Authorization: `Bearer ${token}`,
                        },
                      }) : Promise.resolve(null),
                      needsChecklist ? fetch(getApiUrl(`/api/users/${mate.userNo}/checklist`), {
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
                        // ResponseEntity<ProfileResponse> 형식: 직접 접근
                        const profile: any = profileData
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
                      // ResponseEntity 형식: 직접 접근
                      const payload: any = checklistData
                      
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
                      getApiUrl(`/api/rooms/${roomNo}/join-request/${applicantToAccept.requestNo}/approve`),
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
                      getApiUrl(`/api/join-request/${applicantToReject.requestNo}/reject`),
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
                    const res = await fetch(`${getApiUrl('/api/rooms/me/confirm')}?${params.toString()}`, {
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
