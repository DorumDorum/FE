import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, Pencil } from 'lucide-react'
import BottomNavigationBar from '../components/ui/BottomNavigationBar'
import GuestOnlyMessage from '../components/ui/GuestOnlyMessage'
import CreateChecklistModal from '../components/modals/CreateChecklistModal'
import { getApiUrl } from '../utils/api'
// import toast from 'react-hot-toast' // 토스트 알림 비활성화

const MyPage = () => {
  const navigate = useNavigate()
  
  type Profile = {
    userNo: number
    nickname?: string
    name: string
    email: string
    gender: 'MALE' | 'FEMALE'
    studentNo?: string
    major?: string
    grade?: string
    birth?: string
    age?: number
  }

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const [activeTab, setActiveTab] = useState<'프로필' | '체크리스트'>('프로필')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: '',
    grade: '',
    major: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false)
  const [isSavingChecklist, setIsSavingChecklist] = useState(false)
  const [showCreateChecklistModal, setShowCreateChecklistModal] = useState(false)
  const [hasChecklist, setHasChecklist] = useState<boolean | null>(null)
  const [checklistErrorFields, setChecklistErrorFields] = useState<Set<string>>(new Set())
  type ChecklistOption = {
    text: string
    selected?: boolean
  }

  type ChecklistItem = {
    label: string
    itemType?: 'VALUE' | 'OPTION'
    value?: string
    extraValue?: string
    options?: ChecklistOption[]
  }

  type ChecklistSection = {
    title: string
    category?: 'BASIC_INFO' | 'LIFESTYLE_PATTERN' | 'ADDITIONAL_RULES'
    items: ChecklistItem[]
  }

  const [myChecklist, setMyChecklist] = useState<ChecklistSection[]>([])
  const [checklistBeforeEdit, setChecklistBeforeEdit] = useState<ChecklistSection[] | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setIsGuest(true)
          setLoading(false)
          return
        }
        setIsGuest(false)

        const res = await fetch(getApiUrl('/api/users/profile/me'), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          setIsGuest(true)
          setLoading(false)
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[users] profile fetch failed', {
            status: res.status,
            contentType,
            body: rawBody,
          })
          throw new Error('프로필 정보를 불러오지 못했습니다.')
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[users] profile parse error', { contentType, rawBody }, e)
          throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
        }

        // ResponseEntity<ProfileResponse> 형식: 직접 접근
        const payload: Profile | null = data
        if (payload) {
          console.log('[users] profile payload:', payload) // 디버깅용
          setProfile(payload)
          setEditForm({
            nickname: payload.nickname || '',
            grade: payload.grade || '',
            major: payload.major || '',
          })
        }
      } catch (err) {
        console.error('[users] profile fetch error', err)
        // toast.error('프로필 정보를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }

    void fetchProfile()
  }, [navigate])

  // 기본 체크리스트 템플릿 생성 함수
  const createDefaultChecklistTemplate = (): ChecklistSection[] => {
    return [
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
  }

  // 나의 체크리스트 정보 가져오기
  useEffect(() => {
    const fetchMyChecklist = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) return

        // 먼저 기본 템플릿으로 초기화
        const defaultTemplate = createDefaultChecklistTemplate()

        const res = await fetch(getApiUrl('/api/users/me/checklist'), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.ok) {
          const rawBody = await res.text()
          let data: any
          try {
            data = rawBody ? JSON.parse(rawBody) : null
          } catch (e) {
            // 파싱 실패 시 기본 템플릿 사용
            setMyChecklist(defaultTemplate)
            return
          }

          // ResponseEntity 형식: 직접 접근
          const payload: any = data
          
          // API 응답이 없거나 빈 경우 체크리스트 없음으로 표시
          if (!payload) {
            setHasChecklist(false)
            setMyChecklist([])
            return
          }
          
          setHasChecklist(true)

          // Enum을 한글로 변환하는 함수들
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

          // 기본 템플릿과 API 응답을 병합
          const mergedSections: ChecklistSection[] = defaultTemplate.map((defaultSection) => {
            if (defaultSection.category === 'LIFESTYLE_PATTERN') {
              const mergedItems = defaultSection.items.map((defaultItem) => {
                if (defaultItem.label === '취침') {
                  return { ...defaultItem, value: payload.bedtime || '' }
                }
                if (defaultItem.label === '기상') {
                  return { ...defaultItem, value: payload.wakeUp || '' }
                }
                if (defaultItem.label === '귀가') {
                  const returnHomeValue = payload.returnHome
                  if (!returnHomeValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || [],
                      extraValue: ''
                    }
                  }
                  const mapped = mapReturnHomeFromEnum(returnHomeValue)
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
                  const cleaningValue = payload.cleaning
                  if (!cleaningValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapCleaningFromEnum(cleaningValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '방에서 전화') {
                  const phoneCallValue = payload.phoneCall
                  if (!phoneCallValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapPhoneCallFromEnum(phoneCallValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '잠귀') {
                  const sleepLightValue = payload.sleepLight
                  if (!sleepLightValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapSleepLightFromEnum(sleepLightValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '잠버릇') {
                  const sleepHabitValue = payload.sleepHabit
                  if (!sleepHabitValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapSleepHabitFromEnum(sleepHabitValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '코골이') {
                  const snoringValue = payload.snoring
                  if (!snoringValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapSnoringFromEnum(snoringValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '샤워시간') {
                  const showerTimeValue = payload.showerTime
                  if (!showerTimeValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapShowerTimeFromEnum(showerTimeValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '방에서 취식') {
                  const eatingValue = payload.eating
                  if (!eatingValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapEatingFromEnum(eatingValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '소등') {
                  const lightsOutValue = payload.lightsOut
                  if (!lightsOutValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || [],
                      extraValue: ''
                    }
                  }
                  const mapped = mapLightsOutFromEnum(lightsOutValue)
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
                  const homeVisitValue = payload.homeVisit
                  if (!homeVisitValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapHomeVisitFromEnum(homeVisitValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '흡연') {
                  const smokingValue = payload.smoking
                  if (!smokingValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapSmokingFromEnum(smokingValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '냉장고') {
                  const refrigeratorValue = payload.refrigerator
                  if (!refrigeratorValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapRefrigeratorFromEnum(refrigeratorValue)
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
                  const alarmValue = payload.alarm
                  if (!alarmValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapAlarmFromEnum(alarmValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '이어폰') {
                  const earphoneValue = payload.earphone
                  if (!earphoneValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapEarphoneFromEnum(earphoneValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '키스킨') {
                  const keyskinValue = payload.keyskin
                  if (!keyskinValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapKeyskinFromEnum(keyskinValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '더위') {
                  const heatValue = payload.heat
                  if (!heatValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapHeatFromEnum(heatValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '추위') {
                  const coldValue = payload.cold
                  if (!coldValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapColdFromEnum(coldValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '공부') {
                  const studyValue = payload.study
                  if (!studyValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapStudyFromEnum(studyValue)
                  return {
                    ...defaultItem,
                    options: defaultItem.options?.map(opt => ({
                      ...opt,
                      selected: opt.text === mapped.text
                    })) || []
                  }
                }
                if (defaultItem.label === '쓰레기통') {
                  const trashCanValue = payload.trashCan
                  if (!trashCanValue) {
                    return {
                      ...defaultItem,
                      options: defaultItem.options?.map(opt => ({
                        ...opt,
                        selected: false
                      })) || []
                    }
                  }
                  const mapped = mapTrashCanFromEnum(trashCanValue)
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

          setMyChecklist(mergedSections)
          setHasChecklist(true)
        } else if (res.status === 404) {
          // 404면 체크리스트 없음
          setHasChecklist(false)
          setMyChecklist([])
        } else {
          // API 호출 실패 시 체크리스트 없음으로 표시
          setHasChecklist(false)
          setMyChecklist([])
        }
      } catch (err) {
        console.error('[users] my checklist fetch error', err)
        // 에러 발생 시 체크리스트 없음으로 표시
        setHasChecklist(false)
        setMyChecklist([])
      }
    }

    void fetchMyChecklist()
  }, [])

  // 체크리스트 등록 후 다시 불러오기
  const handleChecklistCreated = () => {
    window.location.reload()
  }

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        nickname: profile.nickname || '',
        grade: profile.grade || '',
        major: profile.major || '',
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    if (!profile || isSubmitting) return

    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      const res = await fetch(getApiUrl('/api/users/profile'), {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: editForm.nickname,
          grade: editForm.grade,
          major: editForm.major,
        }),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        console.error('[users] profile update failed', {
          status: res.status,
          contentType,
          body: rawBody,
        })
        throw new Error('프로필 수정에 실패했습니다.')
      }

      // 기본 정보 섹션이 제거되었으므로 체크리스트 업데이트는 하지 않음
      // (프로필 업데이트만 수행)

      // toast.success('프로필이 수정되었습니다.')
      setIsEditing(false)
      // 프로필 다시 불러오기
      window.location.reload()
    } catch (err) {
      console.error('[users] profile update error', err)
      // toast.error('프로필 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    navigate('/login', { replace: true })
  }

  const mapGenderToDisplay = (gender: string) => {
    switch (gender) {
      case 'MALE':
        return '남성'
      case 'FEMALE':
        return '여성'
      default:
        return gender
    }
  }

  const updateChecklistValue = (sectionIndex: number, itemIndex: number, value: string) => {
    setMyChecklist((prev) =>
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
    setMyChecklist((prev) =>
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
    setMyChecklist((prev) =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section
        
        return {
          ...section,
          items: section.items.map((item, iIdx) => {
            if (iIdx !== itemIndex || !item.options) return item
            
            // 현재 선택된 옵션 확인
            const currentOption = item.options[optionIndex]
            const isCurrentlySelected = currentOption?.selected || false
            
            // 단일 선택 방식 (기본 정보, 생활 패턴)
            if (section.title === '기본 정보' || section.title === '생활 패턴') {
              // 이미 선택된 옵션을 다시 클릭하면 선택 해제
              if (isCurrentlySelected) {
              return {
                ...item,
                options: item.options.map((option) => ({
                  ...option,
                  selected: false,
                })),
              }
              }
              // 새로운 옵션 선택
              return {
                ...item,
                options: item.options.map((option, idx) => ({
                  ...option,
                  selected: idx === optionIndex,
                })),
              }
            }
            
            // 추가 규칙은 토글 방식
            return {
              ...item,
              options: item.options.map((option, idx) => ({
                ...option,
                selected: idx === optionIndex ? !option.selected : option.selected,
              })),
            }
          }),
        }
      })
    )
  }

  const handleSaveChecklist = async () => {
    if (isSavingChecklist) return

    try {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      // 이전 값과 같으면 API 요청 없이 편집 모드만 해제
      if (
        checklistBeforeEdit &&
        JSON.stringify(myChecklist) === JSON.stringify(checklistBeforeEdit)
      ) {
        setChecklistBeforeEdit(null)
        setIsEditingChecklist(false)
        return
      }

      setIsSavingChecklist(true)

      // 생활 패턴 섹션 필수 입력 검사 (다른 체크리스트와 동일하게 빨간색 표시)
      const newErrorFields = new Set<string>()
      myChecklist.forEach((section, sectionIndex) => {
        if (section.category !== 'LIFESTYLE_PATTERN') return
        section.items.forEach((item, itemIndex) => {
          const errorKey = `${sectionIndex}-${itemIndex}`
          if (item.options) {
            const hasSelected = item.options.some(opt => opt.selected)
            if (!hasSelected) newErrorFields.add(errorKey)
            if (item.label === '귀가' && item.options.some(opt => opt.text === '고정적' && opt.selected)) {
              if (!item.extraValue?.trim()) newErrorFields.add(errorKey)
            }
            if (item.label === '소등' && item.options.some(opt => opt.text === '__시 이후' && opt.selected)) {
              if (!item.extraValue?.trim()) newErrorFields.add(errorKey)
            }
          } else if (item.value !== undefined) {
            if (!item.value?.trim()) newErrorFields.add(errorKey)
          }
        })
      })
      if (newErrorFields.size > 0) {
        setChecklistErrorFields(newErrorFields)
        setIsSavingChecklist(false)
        return
      }
      setChecklistErrorFields(new Set())

      // Enum 매핑 함수들
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

      // 체크리스트 데이터를 백엔드 형식으로 변환
      const lifestyleSection = myChecklist.find(s => s.category === 'LIFESTYLE_PATTERN')
      const additionalSection = myChecklist.find(s => s.category === 'ADDITIONAL_RULES')

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

      const requestBody = {
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
        otherNotes: '',
      }

      const res = await fetch(getApiUrl('/api/users/me/checklist'), {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[users] checklist update failed', {
          status: res.status,
          error: errorData,
        })
        throw new Error('체크리스트 저장에 실패했습니다.')
      }

      // 저장 성공
      setChecklistBeforeEdit(null)
      setIsEditingChecklist(false)
      // toast.success('체크리스트가 수정되었습니다.')
    } catch (error) {
      console.error('[users] checklist save error', error)
      // toast.error('체크리스트 저장에 실패했습니다.')
    } finally {
      setIsSavingChecklist(false)
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* 헤더 */}
        <header className="bg-white px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="flex items-center space-x-3"
            >
              <div className="relative">
                <Bell className="w-7 h-7 text-gray-700" />
              </div>
            </button>
          </div>
        </header>
        {loading && (
          <div className="text-sm text-gray-500 flex items-center justify-center py-10">
            불러오는 중...
          </div>
        )}

        {!loading && isGuest && (
          <GuestOnlyMessage />
        )}

        {!loading && !isGuest && profile && (
          <div className="pb-4">
            {/* 프로필 헤더 섹션 */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex flex-col items-center">
                {/* 큰 아바타 */}
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-700 shadow-md mb-4">
                  {profile.name?.[0] || 'U'}
                </div>
                {/* 닉네임과 이메일 */}
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.nickname || profile.name}
                  </div>
                  <div className="text-sm text-gray-500">{profile.email}</div>
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div className="flex justify-between text-sm text-gray-500 px-4 border-b border-gray-200">
              {(['프로필', '체크리스트'] as ('프로필' | '체크리스트')[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 font-medium ${
                    activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 프로필 탭 */}
            {activeTab === '프로필' && (
              <div className="px-4 pt-4">
                <div className="mt space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-base font-bold text-black">프로필 정보</h4>
                      {!isEditing && (
                        <button
                          onClick={handleEdit}
                          className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          편집
                        </button>
                      )}
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      {!isEditing ? (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">이름</div>
                            <div className="text-sm font-medium text-black truncate">{profile.name}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500 mb-1">성별</div>
                            <div className="text-sm font-medium text-black">{mapGenderToDisplay(profile.gender)}</div>
                          </div>

                          {profile.studentNo && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">학번</div>
                              <div className="text-sm font-medium text-black truncate">{profile.studentNo}</div>
                            </div>
                          )}

                          {profile.major && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">전공</div>
                              <div className="text-sm font-medium text-black truncate">{profile.major}</div>
                            </div>
                          )}

                          {profile.grade && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">학년</div>
                              <div className="text-sm font-medium text-black">{profile.grade}</div>
                            </div>
                          )}

                          {profile.age !== undefined && profile.age !== null && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">나이</div>
                              <div className="text-sm font-medium text-black">{profile.age}세</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">닉네임</label>
                            <input
                              type="text"
                              value={editForm.nickname}
                              onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                              maxLength={10}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="닉네임을 입력하세요."
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 mb-1">학년</label>
                            <select
                              value={editForm.grade}
                              onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-10"
                              style={{ backgroundPosition: 'right 0.75rem center', backgroundSize: '1.5em 1.5em' }}
                            >
                              <option value="">학년을 선택하세요</option>
                              <option value="1학년">1학년</option>
                              <option value="2학년">2학년</option>
                              <option value="3학년">3학년</option>
                              <option value="4학년">4학년</option>
                              <option value="5학년">5학년</option>
                              <option value="6학년">6학년</option>
                            </select>
                          </div>

                          <div className="col-span-2">
                            <label className="block text-xs text-gray-500 mb-1">전공</label>
                            <input
                              type="text"
                              value={editForm.major}
                              onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="전공을 입력하세요."
                            />
                          </div>

                          <div className="col-span-2 flex gap-3 pt-2">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="flex-1 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              취소
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={isSubmitting || !editForm.nickname.trim() || !editForm.grade.trim() || !editForm.major.trim()}
                              className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {isSubmitting ? '저장 중...' : '저장'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 체크리스트 탭 */}
            {(activeTab as string) === '체크리스트' && (
              <div className="px-4 pt-4">
                {hasChecklist === null ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    체크리스트 정보를 불러오는 중...
                  </div>
                ) : hasChecklist && myChecklist.length > 0 ? (
                  <div className="mt space-y-4">
                    {myChecklist.map((section, index) => (
                      <div key={section.title} className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-base font-bold text-black">{section.title}</h4>
                          {index === 0 && (
                            <div className="flex items-center gap-2">
                              {isEditingChecklist ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (checklistBeforeEdit) {
                                        setMyChecklist(JSON.parse(JSON.stringify(checklistBeforeEdit)))
                                      }
                                      setChecklistBeforeEdit(null)
                                      setChecklistErrorFields(new Set())
                                      setIsEditingChecklist(false)
                                    }}
                                    className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSavingChecklist}
                                  >
                                    취소
                                  </button>
                                  <button
                                    type="button"
                                    className="flex items-center gap-1 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg px-2 py-1 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={() => handleSaveChecklist()}
                                    disabled={isSavingChecklist}
                                  >
                                    {isSavingChecklist ? '저장 중...' : '저장'}
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50"
                                  onClick={() => {
                                    setChecklistErrorFields(new Set())
                                    setChecklistBeforeEdit(JSON.parse(JSON.stringify(myChecklist)))
                                    setIsEditingChecklist(true)
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                  편집
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="space-y-3 text-sm text-gray-700">
                        {section.items.map((item, itemIndex) => {
                          // 기본 정보 섹션은 수정 불가능 (이미 제거됨)
                          const isBasicInfo = false
                          const isEditable = isEditingChecklist && !isBasicInfo
                          const errorKey = `${index}-${itemIndex}`
                          const hasError = section.category === 'LIFESTYLE_PATTERN' && checklistErrorFields.has(errorKey)
                          const clearThisError = () =>
                            setChecklistErrorFields((prev) => {
                              const next = new Set(prev)
                              next.delete(errorKey)
                              return next
                            })

                          return (
                            <div key={item.label} className="flex gap-2">
                              <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                              <div className={`flex flex-wrap gap-2 ${item.label === '드라이기' ? 'flex-1' : ''}`}>
                                {item.value !== undefined || (!item.options || item.options.length === 0) ? (
                                  isEditable ? (
                                    item.label === '학번(학년)' ? (
                                      <select
                                        value={item.value || ''}
                                        onChange={(e) => {
                                          updateChecklistValue(index, itemIndex, e.target.value)
                                          clearThisError()
                                        }}
                                        className={`rounded px-2 py-1 text-sm text-black border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
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
                                        onChange={(e) => {
                                          updateChecklistValue(
                                            index,
                                            itemIndex,
                                            e.target.value.replace(/[^0-9]/g, '')
                                          )
                                          clearThisError()
                                        }}
                                        className={`rounded px-2 py-1 text-sm text-black w-24 border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={item.value || ''}
                                        onChange={(e) => {
                                          updateChecklistValue(index, itemIndex, e.target.value)
                                          clearThisError()
                                        }}
                                        className={`rounded px-2 py-1 text-sm text-black border ${
                                          hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                        } ${item.label === '드라이기' ? 'w-full' : 'flex-1 min-w-0'}`}
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
                                      // 귀가/소등의 특정 옵션은 extraValue가 있을 때 별도로 표시
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
                                            isEditable
                                              ? () => {
                                                  selectChecklistOption(index, itemIndex, optionIndex)
                                                  clearThisError()
                                                }
                                              : undefined
                                          }
                                          className={
                                            option.selected
                                              ? `bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md ${isEditable ? 'cursor-pointer' : ''}`
                                              : hasError
                                                ? `text-gray-500 text-xs px-2 py-1 rounded-md border border-red-400 bg-red-50 ${isEditable ? 'cursor-pointer' : ''}`
                                                : `text-gray-500 text-xs px-2 py-1 ${isEditable ? 'cursor-pointer border border-transparent' : ''}`
                                          }
                                        >
                                          {option.text}
                                        </span>
                                      )
                                    })}
                                    {isEditable && item.label === '귀가' && item.options?.some(opt => opt.text === '고정적' && opt.selected) && (
                                      <select
                                        value={item.extraValue ?? ''}
                                        onChange={(e) => {
                                          updateChecklistExtraValue(index, itemIndex, e.target.value)
                                          clearThisError()
                                        }}
                                        className={`rounded px-2 py-1 text-xs text-black w-24 border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                      >
                                        <option value="">시간 선택</option>
                                        {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                                          <option key={hour} value={`${hour}시`}>
                                            {hour}시
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    {isEditable && item.label === '소등' && item.options?.some(opt => opt.text === '__시 이후' && opt.selected) && (
                                      <select
                                        value={item.extraValue ?? ''}
                                        onChange={(e) => {
                                          updateChecklistExtraValue(index, itemIndex, e.target.value)
                                          clearThisError()
                                        }}
                                        className={`rounded px-2 py-1 text-xs text-black w-24 border ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                      >
                                        <option value="">시간 선택</option>
                                        {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                                          <option key={hour} value={`${hour}시`}>
                                            {hour}시
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                    {!isEditingChecklist && item.extraValue && (
                                      <span className="text-black font-medium text-xs">{item.extraValue}</span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-gray-500">등록된 체크리스트가 없습니다.</p>
                  <button
                    onClick={() => setShowCreateChecklistModal(true)}
                    className="bg-[#3072E1] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#2563E1] transition-colors"
                  >
                    등록하기
                  </button>
                </div>
              )}
              </div>
            )}

            {/* 로그아웃 버튼 */}
            <div className="px-4 pt-8">
              <button
                onClick={handleLogout}
                className="w-full py-4 rounded-xl text-base font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                로그아웃
              </button>
            </div>
          </div>
        )}

        {!loading && !isGuest && !profile && (
          <div className="text-sm text-gray-500 flex items-center justify-center py-10">
            프로필 정보를 불러올 수 없습니다.
          </div>
        )}
      </main>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar />

      {/* 체크리스트 등록 모달 */}
      {showCreateChecklistModal && (
        <CreateChecklistModal
          onClose={() => setShowCreateChecklistModal(false)}
          onCreated={handleChecklistCreated}
        />
      )}
    </div>
  )
}

export default MyPage
