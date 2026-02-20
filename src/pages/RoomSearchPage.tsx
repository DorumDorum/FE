import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Search, Plus, Filter, Star } from 'lucide-react'
import BottomNavigationBar from '@/components/ui/BottomNavigationBar'
// import RoomCard from '@/components/room/RoomCard'
import CreateRoomModal from '@/components/modals/CreateRoomModal'
import ApplyRoomModal from '@/components/modals/ApplyRoomModal'
import ChatRequestModal from '@/components/modals/ChatRequestModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { Room } from '@/types/room'
import { getApiUrl } from '@/utils/api'

const RoomSearchPage = () => {
  const navigate = useNavigate()
  type Relation = 'recruiting' | 'applied' | 'joined'
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
    residencePeriod?: string // 거주기간
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    roomType: [] as string[],
    roomSize: [] as string[],
    residencePeriod: [] as string[],
    sort: 'recent' as 'recent' | 'capacity' | 'remaining',
    checklist: {} as Record<string, string[]>, // 체크리스트 항목별 선택된 옵션들
  })
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showApplyRoom, setShowApplyRoom] = useState(false)
  const [showChatRequest, setShowChatRequest] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [hasUnreadNotifications] = useState(false) // 안 읽은 알람 여부
  const [activeTab, setActiveTab] = useState<'recruiting' | 'applied' | 'joined'>('recruiting')
  const [expandedRoomIds, setExpandedRoomIds] = useState<Set<string>>(new Set())
  const [roomRules, setRoomRules] = useState<Record<string, ChecklistSection[]>>({})
  const [roomOtherNotes, setRoomOtherNotes] = useState<Record<string, string>>({})
  const [hasMyRoom, setHasMyRoom] = useState<boolean | null>(null)
  
  // Enum을 한글로 변환하는 함수들 (재사용)
  const mapReturnHomeFromEnum = (enumValue: string): string => {
    if (enumValue === 'FLEXIBLE') return '유동적'
    if (enumValue === 'FIXED') return '고정적'
    return '유동적'
  }

  const mapCleaningFromEnum = (enumValue: string): string => {
    if (enumValue === 'REGULAR') return '주기적'
    if (enumValue === 'IRREGULAR') return '비주기적'
    return '주기적'
  }

  const mapPhoneCallFromEnum = (enumValue: string): string => {
    if (enumValue === 'ALLOWED') return '가능'
    if (enumValue === 'NOT_ALLOWED') return '불가능'
    return '가능'
  }

  const mapSleepLightFromEnum = (enumValue: string): string => {
    if (enumValue === 'BRIGHT') return '밝음'
    if (enumValue === 'DARK') return '어두움'
    return '밝음'
  }

  const mapSleepHabitFromEnum = (enumValue: string): string => {
    if (enumValue === 'SEVERE') return '심함'
    if (enumValue === 'MODERATE') return '중간'
    if (enumValue === 'MILD') return '약함'
    return '약함'
  }

  const mapSnoringFromEnum = (enumValue: string): string => {
    if (enumValue === 'SEVERE') return '심함'
    if (enumValue === 'MODERATE') return '중간'
    if (enumValue === 'MILD_OR_NONE') return '약함~없음'
    return '약함~없음'
  }

  const mapShowerTimeFromEnum = (enumValue: string): string => {
    if (enumValue === 'MORNING') return '아침'
    if (enumValue === 'EVENING') return '저녁'
    return '아침'
  }

  const mapEatingFromEnum = (enumValue: string): string => {
    if (enumValue === 'ALLOWED') return '가능'
    if (enumValue === 'NOT_ALLOWED') return '불가능'
    if (enumValue === 'ALLOWED_WITH_VENTILATION') return '가능+환기필수'
    return '가능'
  }

  const mapLightsOutFromEnum = (enumValue: string): string => {
    if (enumValue === 'AFTER_TIME') return '__시 이후'
    if (enumValue === 'WHEN_ONE_SLEEPS') return '한명 잘 때 알아서'
    return '한명 잘 때 알아서'
  }

  const mapHomeVisitFromEnum = (enumValue: string): string => {
    if (enumValue === 'WEEKLY') return '매주'
    if (enumValue === 'BIWEEKLY') return '2주'
    if (enumValue === 'MONTHLY_OR_MORE') return '한달이상'
    if (enumValue === 'RARELY') return '거의 안 감'
    return '매주'
  }

  const mapSmokingFromEnum = (enumValue: string): string => {
    if (enumValue === 'CIGARETTE') return '연초'
    if (enumValue === 'E_CIGARETTE') return '전자담배'
    if (enumValue === 'NON_SMOKER') return '비흡연'
    return '비흡연'
  }

  const mapRefrigeratorFromEnum = (enumValue: string): string => {
    if (enumValue === 'RENT_PURCHASE_OWN') return '대여·구매·보유'
    if (enumValue === 'DECIDE_AFTER_DISCUSSION') return '협의 후 결정'
    if (enumValue === 'NOT_NEEDED') return '필요 없음'
    return '필요 없음'
  }

  const mapAlarmFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'VIBRATION') return '진동'
    if (enumValue === 'SOUND') return '소리'
    return null
  }

  const mapEarphoneFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'ALWAYS') return '항상'
    if (enumValue === 'FLEXIBLE') return '유동적'
    return null
  }

  const mapKeyskinFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'ALWAYS') return '항상'
    if (enumValue === 'FLEXIBLE') return '유동적'
    return null
  }

  const mapHeatFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'VERY_SENSITIVE') return '많이 탐'
    if (enumValue === 'MODERATE') return '중간'
    if (enumValue === 'LESS_SENSITIVE') return '적게 탐'
    return null
  }

  const mapColdFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'VERY_SENSITIVE') return '많이 탐'
    if (enumValue === 'MODERATE') return '중간'
    if (enumValue === 'LESS_SENSITIVE') return '적게 탐'
    return null
  }

  const mapStudyFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'OUTSIDE_DORM') return '기숙사 밖'
    if (enumValue === 'INSIDE_DORM') return '기숙사 안'
    if (enumValue === 'FLEXIBLE') return '유동적'
    return null
  }

  const mapTrashCanFromEnum = (enumValue: string | null): string | null => {
    if (enumValue === 'INDIVIDUAL') return '개별'
    if (enumValue === 'SHARED') return '공유'
    return null
  }

  // API 응답을 체크리스트 섹션으로 변환하는 함수
  const convertApiRuleToChecklistSections = (payload: ApiRoomRule): ChecklistSection[] => {
    return [
      {
        title: '생활 패턴',
        category: 'LIFESTYLE_PATTERN',
        items: [
          { label: '취침', value: payload.bedtime || '' },
          { label: '기상', value: payload.wakeUp || '' },
          {
            label: '귀가',
            extraValue: payload.returnHomeTime || '',
            options: [
              { text: '유동적', selected: mapReturnHomeFromEnum(payload.returnHome || '') === '유동적' },
              { text: '고정적', selected: mapReturnHomeFromEnum(payload.returnHome || '') === '고정적' },
            ],
          },
          {
            label: '청소',
            options: [
              { text: '주기적', selected: mapCleaningFromEnum(payload.cleaning || '') === '주기적' },
              { text: '비주기적', selected: mapCleaningFromEnum(payload.cleaning || '') === '비주기적' },
            ],
          },
          {
            label: '방에서 전화',
            options: [
              { text: '가능', selected: mapPhoneCallFromEnum(payload.phoneCall || '') === '가능' },
              { text: '불가능', selected: mapPhoneCallFromEnum(payload.phoneCall || '') === '불가능' },
            ],
          },
          {
            label: '잠귀',
            options: [
              { text: '밝음', selected: mapSleepLightFromEnum(payload.sleepLight || '') === '밝음' },
              { text: '어두움', selected: mapSleepLightFromEnum(payload.sleepLight || '') === '어두움' },
            ],
          },
          {
            label: '잠버릇',
            options: [
              { text: '심함', selected: mapSleepHabitFromEnum(payload.sleepHabit || '') === '심함' },
              { text: '중간', selected: mapSleepHabitFromEnum(payload.sleepHabit || '') === '중간' },
              { text: '약함', selected: mapSleepHabitFromEnum(payload.sleepHabit || '') === '약함' },
            ],
          },
          {
            label: '코골이',
            options: [
              { text: '심함', selected: mapSnoringFromEnum(payload.snoring || '') === '심함' },
              { text: '중간', selected: mapSnoringFromEnum(payload.snoring || '') === '중간' },
              { text: '약함~없음', selected: mapSnoringFromEnum(payload.snoring || '') === '약함~없음' },
            ],
          },
          {
            label: '샤워시간',
            options: [
              { text: '아침', selected: mapShowerTimeFromEnum(payload.showerTime || '') === '아침' },
              { text: '저녁', selected: mapShowerTimeFromEnum(payload.showerTime || '') === '저녁' },
            ],
          },
          {
            label: '방에서 취식',
            options: [
              { text: '가능', selected: mapEatingFromEnum(payload.eating || '') === '가능' },
              { text: '불가능', selected: mapEatingFromEnum(payload.eating || '') === '불가능' },
              { text: '가능+환기필수', selected: mapEatingFromEnum(payload.eating || '') === '가능+환기필수' },
            ],
          },
          {
            label: '소등',
            extraValue: payload.lightsOutTime || '',
            options: [
              { text: '__시 이후', selected: mapLightsOutFromEnum(payload.lightsOut || '') === '__시 이후' },
              { text: '한명 잘 때 알아서', selected: mapLightsOutFromEnum(payload.lightsOut || '') === '한명 잘 때 알아서' },
            ],
          },
          {
            label: '본가 주기',
            options: [
              { text: '매주', selected: mapHomeVisitFromEnum(payload.homeVisit || '') === '매주' },
              { text: '2주', selected: mapHomeVisitFromEnum(payload.homeVisit || '') === '2주' },
              { text: '한달이상', selected: mapHomeVisitFromEnum(payload.homeVisit || '') === '한달이상' },
              { text: '거의 안 감', selected: mapHomeVisitFromEnum(payload.homeVisit || '') === '거의 안 감' },
            ],
          },
          {
            label: '흡연',
            options: [
              { text: '연초', selected: mapSmokingFromEnum(payload.smoking || '') === '연초' },
              { text: '전자담배', selected: mapSmokingFromEnum(payload.smoking || '') === '전자담배' },
              { text: '비흡연', selected: mapSmokingFromEnum(payload.smoking || '') === '비흡연' },
            ],
          },
          {
            label: '냉장고',
            options: [
              { text: '대여·구매·보유', selected: mapRefrigeratorFromEnum(payload.refrigerator || '') === '대여·구매·보유' },
              { text: '협의 후 결정', selected: mapRefrigeratorFromEnum(payload.refrigerator || '') === '협의 후 결정' },
              { text: '필요 없음', selected: mapRefrigeratorFromEnum(payload.refrigerator || '') === '필요 없음' },
            ],
          },
        ],
      },
      {
        title: '추가 규칙',
        category: 'ADDITIONAL_RULES',
        items: [
          { label: '드라이기', value: payload.hairDryer || '' },
          {
            label: '알람',
            options: [
              { text: '진동', selected: mapAlarmFromEnum(payload.alarm) === '진동' },
              { text: '소리', selected: mapAlarmFromEnum(payload.alarm) === '소리' },
            ],
          },
          {
            label: '이어폰',
            options: [
              { text: '항상', selected: mapEarphoneFromEnum(payload.earphone) === '항상' },
              { text: '유동적', selected: mapEarphoneFromEnum(payload.earphone) === '유동적' },
            ],
          },
          {
            label: '키스킨',
            options: [
              { text: '항상', selected: mapKeyskinFromEnum(payload.keyskin) === '항상' },
              { text: '유동적', selected: mapKeyskinFromEnum(payload.keyskin) === '유동적' },
            ],
          },
          {
            label: '더위',
            options: [
              { text: '많이 탐', selected: mapHeatFromEnum(payload.heat) === '많이 탐' },
              { text: '중간', selected: mapHeatFromEnum(payload.heat) === '중간' },
              { text: '적게 탐', selected: mapHeatFromEnum(payload.heat) === '적게 탐' },
            ],
          },
          {
            label: '추위',
            options: [
              { text: '많이 탐', selected: mapColdFromEnum(payload.cold) === '많이 탐' },
              { text: '중간', selected: mapColdFromEnum(payload.cold) === '중간' },
              { text: '적게 탐', selected: mapColdFromEnum(payload.cold) === '적게 탐' },
            ],
          },
          {
            label: '공부',
            options: [
              { text: '기숙사 밖', selected: mapStudyFromEnum(payload.study) === '기숙사 밖' },
              { text: '기숙사 안', selected: mapStudyFromEnum(payload.study) === '기숙사 안' },
              { text: '유동적', selected: mapStudyFromEnum(payload.study) === '유동적' },
            ],
          },
          {
            label: '쓰레기통',
            options: [
              { text: '개별', selected: mapTrashCanFromEnum(payload.trashCan) === '개별' },
              { text: '공유', selected: mapTrashCanFromEnum(payload.trashCan) === '공유' },
            ],
          },
        ],
      },
    ]
  }
  
  // 체크리스트 섹션 정의 (CreateRoomModal과 동일한 구조)
  type ChecklistOption = {
    text: string
    selected?: boolean
  }
  
  type ChecklistItem = {
    label: string
    value?: string
    options?: ChecklistOption[]
    extraValue?: string
  }
  
  type ChecklistSection = {
    title: string
    category: 'BASIC_INFO' | 'LIFESTYLE_PATTERN' | 'ADDITIONAL_RULES'
    items: ChecklistItem[]
  }

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
  
  const checklistSections: ChecklistSection[] = [
    {
      title: '기본 정보',
      category: 'BASIC_INFO',
      items: [
        {
          label: '수용 인원',
          options: [
            { text: '2명' },
            { text: '4명' },
            { text: '6명' },
          ],
        },
        {
          label: '거주기간',
          options: [
            { text: '학기(16주)' },
            { text: '반기(24주)' },
            { text: '계절학기' },
          ],
        },
        {
          label: '생활관',
          options: [
            { text: '2' },
            { text: '3' },
            { text: '메디컬' },
          ],
        },
      ],
    },
    {
      title: '생활 패턴',
      category: 'LIFESTYLE_PATTERN',
      items: [
        { label: '취침', value: '' },
        { label: '기상', value: '' },
        {
          label: '귀가',
          options: [
            { text: '유동적' },
            { text: '고정적' },
          ],
          extraValue: '',
        },
        {
          label: '청소',
          options: [
            { text: '주기적' },
            { text: '비주기적' },
          ],
        },
        {
          label: '방에서 전화',
          options: [
            { text: '가능' },
            { text: '불가능' },
          ],
        },
        {
          label: '잠귀',
          options: [
            { text: '밝음' },
            { text: '어두움' },
          ],
        },
        {
          label: '잠버릇',
          options: [
            { text: '심함' },
            { text: '중간' },
            { text: '약함' },
          ],
        },
        {
          label: '코골이',
          options: [
            { text: '심함' },
            { text: '중간' },
            { text: '약함~없음' },
          ],
        },
        {
          label: '샤워시간',
          options: [
            { text: '아침' },
            { text: '저녁' },
          ],
        },
        {
          label: '방에서 취식',
          options: [
            { text: '가능' },
            { text: '불가능' },
            { text: '가능+환기필수' },
          ],
        },
        {
          label: '소등',
          options: [
            { text: '__시 이후' },
            { text: '한명 잘 때 알아서' },
          ],
          extraValue: '',
        },
        {
          label: '본가 주기',
          options: [
            { text: '매주' },
            { text: '2주' },
            { text: '한달이상' },
            { text: '거의 안 감' },
          ],
        },
        {
          label: '흡연',
          options: [
            { text: '연초' },
            { text: '전자담배' },
            { text: '비흡연' },
          ],
        },
        {
          label: '냉장고',
          options: [
            { text: '대여·구매·보유' },
            { text: '협의 후 결정' },
            { text: '필요 없음' },
          ],
        },
      ],
    },
    {
      title: '추가 규칙',
      category: 'ADDITIONAL_RULES',
      items: [
        {
          label: '드라이기',
          value: '',
        },
        {
          label: '알람',
          options: [
            { text: '진동' },
            { text: '소리' },
          ],
        },
        {
          label: '이어폰',
          options: [
            { text: '항상' },
            { text: '유동적' },
          ],
        },
        {
          label: '키스킨',
          options: [
            { text: '항상' },
            { text: '유동적' },
          ],
        },
        {
          label: '더위',
          options: [
            { text: '많이 탐' },
            { text: '중간' },
            { text: '적게 탐' },
          ],
        },
        {
          label: '추위',
          options: [
            { text: '많이 탐' },
            { text: '중간' },
            { text: '적게 탐' },
          ],
        },
        {
          label: '공부',
          options: [
            { text: '기숙사 밖' },
            { text: '기숙사 안' },
            { text: '유동적' },
          ],
        },
        {
          label: '쓰레기통',
          options: [
            { text: '개별' },
            { text: '공유' },
          ],
        },
      ],
    },
  ]
  
  const [recruitingRooms, setRecruitingRooms] = useState<Room[]>([])
  const [appliedRooms, setAppliedRooms] = useState<Room[]>([])
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([])
  const [loadingTab, setLoadingTab] = useState<Relation | null>(null)
  const loadingDelayTimerRef = useRef<number | null>(null)
  const lastFetchedKeyRef = useRef<Record<Relation, string | null>>({
    recruiting: null,
    applied: null,
    joined: null,
  })

  const resetFilters = () => {
    setFilters({ roomType: [], roomSize: [], residencePeriod: [], sort: 'recent', checklist: {} })
  }

  const toggleChecklistOption = (itemLabel: string, option: string) => {
    setFilters((prev) => {
      // 기본정보 필터는 Room 필드로 직접 매핑 (다중 선택 가능)
      if (itemLabel === '수용 인원') {
        const capacity = option.replace('명', '')
        const currentSizes = prev.roomSize || []
        const newSizes = currentSizes.includes(capacity)
          ? currentSizes.filter((s) => s !== capacity)
          : [...currentSizes, capacity]
        return {
          ...prev,
          roomSize: newSizes,
        }
      }
      
      if (itemLabel === '거주기간') {
        const mapResidencePeriodToFilter = (period: string): string => {
          if (period === '학기(16주)') return 'SEMESTER'
          if (period === '반기(24주)') return 'HALF_YEAR'
          if (period === '계절학기') return 'SEASONAL'
          return ''
        }
        const periodValue = mapResidencePeriodToFilter(option)
        const currentPeriods = prev.residencePeriod || []
        const newPeriods = currentPeriods.includes(periodValue)
          ? currentPeriods.filter((p) => p !== periodValue)
          : [...currentPeriods, periodValue]
        return {
          ...prev,
          residencePeriod: newPeriods,
        }
      }
      
      if (itemLabel === '생활관') {
        const mapDormToRoomType = (dorm: string): string => {
          if (dorm === '2') return '2 기숙사'
          if (dorm === '3') return '3 기숙사'
          if (dorm === '메디컬') return '1 기숙사'
          return ''
        }
        const roomTypeValue = mapDormToRoomType(option)
        const currentTypes = prev.roomType || []
        const newTypes = currentTypes.includes(roomTypeValue)
          ? currentTypes.filter((t) => t !== roomTypeValue)
          : [...currentTypes, roomTypeValue]
        return {
          ...prev,
          roomType: newTypes,
        }
      }
      
      // 체크리스트 필터 (생활 패턴, 추가 규칙)
      const currentOptions = prev.checklist[itemLabel] || []
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter((o) => o !== option)
        : [...currentOptions, option]
      const updatedChecklist = { ...prev.checklist }
      if (newOptions.length > 0) {
        updatedChecklist[itemLabel] = newOptions
      } else {
        delete updatedChecklist[itemLabel]
      }
      return {
        ...prev,
        checklist: updatedChecklist,
      }
    })
  }

  const applyFilters = (list: Room[]) => {
    let result = [...list]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.hostName.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    if (filters.roomType.length > 0) {
      result = result.filter((r) => filters.roomType.includes(r.roomType))
    }

    if (filters.roomSize.length > 0) {
      result = result.filter((r) => {
        return filters.roomSize.some((size) => {
          const numSize = Number(size)
          return !Number.isNaN(numSize) && r.capacity === numSize
        })
      })
    }

    if (filters.residencePeriod.length > 0) {
      const mapResidencePeriodToDisplay = (period: string | undefined): string | undefined => {
        if (!period) return undefined
        if (period === 'SEMESTER') return '학기(16주)'
        if (period === 'HALF_YEAR') return '반기(24주)'
        if (period === 'SEASONAL') return '계절학기'
        return period
      }
      result = result.filter((r) => {
        const roomPeriod = mapResidencePeriodToDisplay(r.residencePeriod)
        return filters.residencePeriod.some((period) => {
          const targetPeriod = mapResidencePeriodToDisplay(period)
          return roomPeriod === targetPeriod
        })
      })
    }

    // 체크리스트 필터: 사용자가 선택한 옵션들을 모두 만족하는 방만 남긴다
    const checklistFilter = filters.checklist
    const checklistKeys = Object.keys(checklistFilter)

    if (checklistKeys.length > 0) {
      result = result.filter((room) => {
        const rules = roomRules[room.id]
        if (!rules) {
          // 아직 룸 규칙을 불러오지 못한 방은 필터에서 제외
          return false
        }

        // 각 필터 항목(label)에 대해, 방의 룰에서 해당 label의 선택된 옵션이 필터에 포함된 값 중 하나라도 포함되면 됨
        return checklistKeys.every((label) => {
          const requiredOptions = checklistFilter[label]
          if (!requiredOptions || requiredOptions.length === 0) return true

          // 룰 섹션들에서 해당 label을 가진 항목 찾기
          const section = rules.find((sec) => sec.items.some((item) => item.label === label))
          if (!section) return false

          const item = section.items.find((it) => it.label === label)
          if (!item || !item.options) return false

          const selectedOptionTexts = item.options.filter((opt) => opt.selected).map((opt) => opt.text)

          // 고정적 / __시 이후 등은 extraValue(시간)를 무시하고 옵션 텍스트만 비교
          // 필터에서 선택한 옵션 중 하나라도 방의 규칙에 포함되어 있으면 표시
          return requiredOptions.some((optText) => selectedOptionTexts.includes(optText))
        })
      })
    }

    if (filters.sort === 'capacity') {
      result.sort((a, b) => b.capacity - a.capacity)
    } else if (filters.sort === 'remaining') {
      result.sort(
        (a, b) =>
          (b.capacity - b.currentMembers) - (a.capacity - a.currentMembers)
      )
    }

    return result
  }

  const filteredRecruitingRooms = useMemo(
    () => applyFilters(recruitingRooms),
    [recruitingRooms, searchQuery, filters, roomRules]
  )

  const filteredAppliedRooms = useMemo(
    () => applyFilters(appliedRooms),
    [appliedRooms, searchQuery, filters, roomRules]
  )

  const filteredJoinedRooms = useMemo(
    () => applyFilters(joinedRooms),
    [joinedRooms, searchQuery, filters, roomRules]
  )

  // 관심 있는 방(좋아요 한 방)과 내가 지원한 방 목록은 상태 표시를 위해 초기에 한 번 미리 불러온다
  useEffect(() => {
    // 토큰 없으면 호출해도 바로 return 되므로 별도 체크는 필요 없음
    fetchRooms('joined', { showLoading: false })
    fetchRooms('applied', { showLoading: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 체크리스트 필터가 걸려 있을 때, 현재 탭의 방들에 대해 룸 규칙을 미리 로딩한다
  useEffect(() => {
    const checklistFilter = filters.checklist
    const hasChecklistFilter = Object.keys(checklistFilter).length > 0
    if (!hasChecklistFilter) return

    const currentList =
      activeTab === 'recruiting'
        ? recruitingRooms
        : activeTab === 'applied'
          ? appliedRooms
          : joinedRooms

    const loadRulesForRooms = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      await Promise.all(
        currentList
          .filter((room) => !roomRules[room.id])
          .map(async (room) => {
            try {
              const roomNo =
                typeof room.id === 'string' && room.id.startsWith('room-')
                  ? room.id.replace('room-', '')
                  : room.id

              const headers: HeadersInit = {
                'Content-Type': 'application/json',
              }
              if (token) {
                headers['Authorization'] = `Bearer ${token}`
              }
              const res = await fetch(`getApiUrl('/api/rooms/${roomNo}/rule`, {
                credentials: 'include',
                headers,
              })

              if (!res.ok) return

              const data = await res.json()
              // ResponseEntity<MyRoomRuleResponse> 형식: 직접 접근
              const payload: ApiRoomRule | null = data
              if (!payload) return

              const checklistSections = convertApiRuleToChecklistSections(payload)

              setRoomRules((prev) => ({
                ...prev,
                [room.id]: checklistSections,
              }))

              if (payload.otherNotes) {
                setRoomOtherNotes((prev) => ({
                  ...prev,
                  [room.id]: payload.otherNotes || '',
                }))
              }
            } catch (err) {
              console.error('[room] rule prefetch error', err)
            }
          })
      )
    }

    void loadRulesForRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.checklist, activeTab, recruitingRooms, appliedRooms, joinedRooms])

  // 내가 속한 방 존재 여부 조회
  useEffect(() => {
    const checkRoomExist = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          setHasMyRoom(false)
          return
        }

        const res = await fetch(getApiUrl('/api/rooms/me/exists'), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          setHasMyRoom(false)
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] check exists parse error', { contentType, rawBody }, e)
          setHasMyRoom(false)
          return
        }

        // ResponseEntity 형식: 직접 접근
        const payload = data
        setHasMyRoom(!!payload?.isExist)
      } catch (err) {
        console.error('[rooms] check exists error', err)
        setHasMyRoom(false)
      }
    }

    checkRoomExist()
  }, [])

  const mapRoomTypeToApi = (type: string) => {
    switch (type) {
      case '1 기숙사':
        return 'TYPE_MEDICAL'
      case '2 기숙사':
        return 'TYPE_2'
      case '3 기숙사':
        return 'TYPE_1'
      default:
        return undefined
    }
  }

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

  const mapApiStatusToDisplay = (status: string): Room['status'] => {
    switch (status) {
      case 'CONFIRM_PENDING':
        return 'recruiting'
      case 'IN_PROGRESS':
        return 'full'
      case 'COMPLETED':
        return 'closed'
      default:
        return 'recruiting'
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

  const mapApiRoom = (api: ApiRoom): Room => ({
    id: String(api.roomNo),
    title: api.title || '방',
    roomType: mapApiRoomTypeToDisplay(api.roomType),
    capacity: api.capacity,
    currentMembers: api.currentMateCount,
    description: '',
    hostName: api.hostNickname || '',
    tags: api.additionalTag || [],
    createdAt: formatRelativeTime(api.createdAt),
    status: mapApiStatusToDisplay(api.roomStatus),
    residencePeriod: mapResidencePeriodToDisplay(api.residencePeriod),
  })

  const formatRelativeTime = (iso?: string): string => {
    if (!iso) return ''
    const now = new Date()
    const target = new Date(iso)
    const diffMs = now.getTime() - target.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMin / 60)
    // const diffDay = Math.floor(diffHour / 24) // 사용되지 않음

    if (diffMin < 1) return '방금 전'
    if (diffMin < 60) return `${diffMin}분 전`
    if (diffHour < 24) return `${diffHour}시간 전`

    const y = target.getFullYear()
    const m = String(target.getMonth() + 1).padStart(2, '0')
    const d = String(target.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const fetchRooms = async (
    relation: Relation,
    opts?: { showLoading?: boolean; requestKey?: string }
  ) => {
    // "로딩 플래시" 방지: 아주 빠른 응답이면 로딩 문구를 아예 보여주지 않도록 지연 표시
    if (opts?.showLoading) {
      if (loadingDelayTimerRef.current) window.clearTimeout(loadingDelayTimerRef.current)
      loadingDelayTimerRef.current = window.setTimeout(() => {
        setLoadingTab(relation)
      }, 250)
    }
    try {
      const token = localStorage.getItem('accessToken')
      // 비회원은 RECRUITING만 조회 가능
      if (!token && relation !== 'recruiting') {
        if (loadingDelayTimerRef.current) window.clearTimeout(loadingDelayTimerRef.current)
        loadingDelayTimerRef.current = null
        setLoadingTab(null)
        return
      }

      const params = new URLSearchParams()
      const relationMap = {
        recruiting: 'RECRUITING',
        applied: 'APPLIED',
        joined: 'LIKED', // 관심 있는 방 탭은 내가 like한 방 목록
      } as const
      params.set('relation', relationMap[relation])

      // 기본정보 필터 배열의 모든 값을 API에 전송
      if (filters.roomType.length > 0) {
        filters.roomType.forEach((type) => {
          const apiRoomType = mapRoomTypeToApi(type)
          if (apiRoomType) params.append('types', apiRoomType)
        })
      }

      if (filters.roomSize.length > 0) {
        filters.roomSize.forEach((size) => {
          params.append('capacities', size)
        })
      }

      if (filters.residencePeriod.length > 0) {
        filters.residencePeriod.forEach((period) => {
          params.append('residencePeriods', period)
        })
      }

      if (filters.sort === 'remaining') {
        params.set('sort', 'REMAINING')
      } else {
        params.set('sort', 'CREATED_AT')
      }

      const url = `${getApiUrl('/api/rooms')}?${params.toString()}`
      console.log('[rooms] request', {
        relation,
        url,
        filters,
      })

      const startedAt = performance.now()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const res = await fetch(url, {
        credentials: 'include',
        headers,
      })
      const elapsedMs = Math.round(performance.now() - startedAt)
      console.log('[rooms] response meta', {
        relation,
        url,
        status: res.status,
        ok: res.ok,
        elapsedMs,
      })
      if (res.status === 401 && token) {
        navigate('/login')
        return
      }

      const contentType = res.headers.get('content-type') ?? ''
      const rawBody = await res.text()
      if (!res.ok) {
        console.error('[rooms] response not ok', {
          relation,
          url,
          status: res.status,
          elapsedMs,
          contentType,
          body: rawBody,
        })
        throw new Error('방 목록을 불러오지 못했습니다.')
      }

      let data: any
      try {
        data = rawBody ? JSON.parse(rawBody) : null
      } catch (e) {
        console.error('[rooms] failed to parse json', { relation, url, contentType, rawBody }, e)
        throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
      }
      // ResponseEntity<CursorPage<FindRoomsResponse>> 형식: { items, nextCursor, hasNext }
      const list: ApiRoom[] = data?.items ?? []
      const mapped = list.map(mapApiRoom)

      if (relation === 'recruiting') {
        setRecruitingRooms(mapped)
      }
      if (relation === 'applied') setAppliedRooms(mapped)
      if (relation === 'joined') setJoinedRooms(mapped)

      if (opts?.requestKey) lastFetchedKeyRef.current[relation] = opts.requestKey
    } catch (err) {
      console.error('[rooms] fetch error', {
        relation,
        filters,
        requestKey: opts?.requestKey,
      }, err)
    } finally {
      if (opts?.showLoading) {
        if (loadingDelayTimerRef.current) window.clearTimeout(loadingDelayTimerRef.current)
        loadingDelayTimerRef.current = null
        setLoadingTab(null)
      }
    }
  }

  useEffect(() => {
    const requestKey = JSON.stringify({
      relation: activeTab,
      roomType: filters.roomType,
      roomSize: filters.roomSize,
      residencePeriod: filters.residencePeriod,
      sort: filters.sort,
    })

    const currentList =
      activeTab === 'recruiting'
        ? recruitingRooms
        : activeTab === 'applied'
          ? appliedRooms
          : joinedRooms

    // 이미 같은 조건으로 데이터를 받아왔고 리스트도 있으면, 탭 전환 시 재호출하지 않음 (슬라이드가 더 자연스러움)
    if (lastFetchedKeyRef.current[activeTab] === requestKey && currentList.length > 0) return

    // 해당 탭에 데이터가 이미 있으면 UI는 그대로 두고 백그라운드로 갱신 (로딩 문구 미표시)
    fetchRooms(activeTab, { showLoading: currentList.length === 0, requestKey })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filters.roomType, filters.roomSize, filters.residencePeriod, filters.sort])

  // 내가 속한 방이 생기면 '내가 지원한 방' 탭은 숨기므로, 그 상태에서 activeTab이 'applied'이면 기본 탭으로 돌려준다
  useEffect(() => {
    if (hasMyRoom && activeTab === 'applied') {
      setActiveTab('recruiting')
    }
  }, [hasMyRoom, activeTab])

  // 비회원은 'recruiting' 탭만 사용 가능
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token && activeTab !== 'recruiting') {
      setActiveTab('recruiting')
    }
  }, [activeTab])

  // const handleChatRequest = (roomId: string) => {
  //   const room = recruitingRooms.find(r => r.id === roomId)
  //   if (room) {
  //     setSelectedRoom(room)
  //     setShowChatRequest(true)
  //   }
  // }

  // const handleApply = (roomId: string) => {
  //   const room = recruitingRooms.find(r => r.id === roomId) || appliedRooms.find(r => r.id === roomId)
  //   if (room) {
  //     setSelectedRoom(room)
  //     if (appliedRooms.some(r => r.id === roomId)) {
  //       // 이미 지원한 방이면 취소 확인 모달 표시
  //       setShowCancelConfirm(true)
  //     } else {
  //       // 새로운 방 지원이면 지원서 모달 표시
  //       setShowApplyRoom(true)
  //     }
  //   }
  // }

  const handleCreateRoom = () => {
    setShowCreateRoom(true)
  }

  // const handleLeave = (roomId: string) => {
  //   const room = joinedRooms.find(r => r.id === roomId)
  //   if (room) {
  //     setSelectedRoom(room)
  //     setShowLeaveConfirm(true)
  //   }
  // }

  const handleCancelApply = () => {
    const doCancel = async () => {
      if (!selectedRoom) return

      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login')
          return
        }

        // room.id는 프론트에서 사용하는 문자열 ID이지만, 실제로는 roomNo이므로 그대로 사용
        const roomNo = typeof selectedRoom.id === 'string' && selectedRoom.id.startsWith('room-')
          ? selectedRoom.id.replace('room-', '')
          : selectedRoom.id

        const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/join-request`), {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.error('[rooms] cancel apply failed', { status: res.status, body: text })
          return
        }

        // 서버 상태 기준으로 내가 지원한 방 목록을 다시 불러와서 상태 동기화
        await fetchRooms('applied', { showLoading: false })
      } catch (err) {
        console.error('[rooms] cancel apply error', err)
      } finally {
        setShowCancelConfirm(false)
        setSelectedRoom(null)
      }
    }

    void doCancel()
  }

  const handleConfirmLeave = () => {
    // TODO: 방 나가기 API 연동 시 구현
    setShowLeaveConfirm(false)
    setSelectedRoom(null)
  }

  return (
    <div className="page-with-bottom-nav h-screen bg-white flex flex-col overflow-hidden animate-fade-in">
      {/* 메인 콘텐츠 - 스크롤 가능 영역 */}
      <main className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        {/* 헤더 - 상단 고정 */}
        <header className="bg-white px-4 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">룸메 찾기</h1>
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
          
          {/* 검색 바 */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center space-x-2 mb-3">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="방장 닉네임, 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
            />
            {(() => {
              const hasActiveFilters =
                filters.roomType.length > 0 ||
                filters.roomSize.length > 0 ||
                filters.residencePeriod.length > 0 ||
                filters.sort !== 'recent' ||
                Object.keys(filters.checklist).length > 0
              
              const isDisabled =
                filters.roomType.length === 0 &&
                filters.roomSize.length === 0 &&
                filters.residencePeriod.length === 0 &&
                filters.sort === 'recent' &&
                Object.keys(filters.checklist).length === 0

              return (
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-lg transition-colors ${
                    showFilters || hasActiveFilters
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : isDisabled
                      ? 'text-gray-400 hover:bg-gray-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>필터</span>
                </button>
              )
            })()}
          </div>

          <div 
            className={`grid mb-3 ${
              showFilters 
                ? 'grid-rows-[1fr] opacity-100 transition-all duration-300 ease-out' 
                : 'grid-rows-[0fr] opacity-0 transition-all duration-200 ease-in'
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-4">
                {/* 체크리스트 필터 */}
                <div className="space-y-4">
                  {checklistSections.map((section, index) => (
                    <div key={section.category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold text-black">{section.title}</h4>
                        {index === 0 && (
                          <button
                            onClick={resetFilters}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            초기화
                          </button>
                        )}
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <div className="space-y-3 text-sm text-gray-700">
                          {section.items
                            .filter((item) => item.options && item.options.length > 0)
                            .map((item) => {
                              return (
                                <div key={item.label} className="flex gap-2">
                                  <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                                  <div className="flex flex-wrap gap-2 flex-1">
                                    {item.options?.map((option) => {
                                      // 기본정보 필터는 Room 필드로 직접 매핑되므로 선택 상태를 다르게 확인 (다중 선택)
                                      let isOptionSelected = false
                                      if (item.label === '수용 인원') {
                                        const capacity = option.text.replace('명', '')
                                        isOptionSelected = (filters.roomSize || []).includes(capacity)
                                      } else if (item.label === '거주기간') {
                                        const mapResidencePeriodToFilter = (period: string): string => {
                                          if (period === '학기(16주)') return 'SEMESTER'
                                          if (period === '반기(24주)') return 'HALF_YEAR'
                                          if (period === '계절학기') return 'SEASONAL'
                                          return ''
                                        }
                                        const periodValue = mapResidencePeriodToFilter(option.text)
                                        isOptionSelected = (filters.residencePeriod || []).includes(periodValue)
                                      } else if (item.label === '생활관') {
                                        const mapDormToRoomType = (dorm: string): string => {
                                          if (dorm === '2') return '2 기숙사'
                                          if (dorm === '3') return '3 기숙사'
                                          if (dorm === '메디컬') return '1 기숙사'
                                          return ''
                                        }
                                        const roomTypeValue = mapDormToRoomType(option.text)
                                        isOptionSelected = (filters.roomType || []).includes(roomTypeValue)
                                      } else {
                                        isOptionSelected = filters.checklist[item.label]?.includes(option.text) || false
                                      }
                                      
                                      return (
                                        <button
                                          key={option.text}
                                          type="button"
                                          onClick={() => toggleChecklistOption(item.label, option.text)}
                                          className={`${
                                            isOptionSelected
                                              ? 'bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md cursor-pointer'
                                              : 'text-gray-500 text-xs px-2 py-1 cursor-pointer border border-gray-200 rounded-md'
                                          }`}
                                        >
                                          {option.text}
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700">정렬</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, sort: 'recent' }))}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                        filters.sort === 'recent'
                          ? 'bg-[#3072E1] text-white border-[#3072E1]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      최신순
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, sort: 'capacity' }))}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                        filters.sort === 'capacity'
                          ? 'bg-[#3072E1] text-white border-[#3072E1]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      인원 많은순
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilters((prev) => ({ ...prev, sort: 'remaining' }))}
                      className={`py-2 text-xs font-medium rounded-lg border transition-colors ${
                        filters.sort === 'remaining'
                          ? 'bg-[#3072E1] text-white border-[#3072E1]'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      남은자리순
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 방 만들기 버튼 - 로그인한 사용자만 표시 */}
          {localStorage.getItem('accessToken') && (
            <button
              onClick={handleCreateRoom}
              className="w-full bg-[#3072E1] text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center space-x-2 hover:bg-[#2563E1] mb-2"
            >
              <Plus className="w-4 h-4" />
              <span>방 만들기</span>
            </button>
          )}
        </div>

        {/* 방 목록 */}
        <div className="mt-2 px-4">
          {loadingTab === activeTab &&
            (activeTab === 'recruiting'
              ? recruitingRooms.length === 0
              : activeTab === 'applied'
                ? appliedRooms.length === 0
                : joinedRooms.length === 0) && (
            <div className="text-xs text-gray-500 mb-2">불러오는 중...</div>
          )}

          {/* 탭 네비게이션 - 헤더 바로 아래에 고정 */}
          <div className="sticky top-[64px] z-10 bg-white pb-2">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('recruiting')}
                className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'recruiting'
                    ? 'border-[#3072E1] text-[#3072E1]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                모집 중인 방
              </button>
              {/* 로그인한 사용자만 다른 탭 표시 */}
              {localStorage.getItem('accessToken') && (
                <>
                  <button
                    onClick={() => setActiveTab('joined')}
                    className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'joined'
                        ? 'border-[#3072E1] text-[#3072E1]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    관심 있는 방
                  </button>
                  {!hasMyRoom && (
                    <button
                      onClick={() => setActiveTab('applied')}
                      className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === 'applied'
                          ? 'border-[#3072E1] text-[#3072E1]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      내가 지원한 방
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 탭 콘텐츠 */}
          {activeTab === 'recruiting' && (
            <div className="space-y-4">
              {filteredRecruitingRooms.map((room) => (
                <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-1 flex-1">
                      <h2 className="text-base font-semibold text-black">
                        {room.title}
                      </h2>
                    </div>
                    <button
                      onClick={async () => {
                        const isFavorite = joinedRooms.some((joined) => joined.id === room.id)
                        
                        try {
                          const token = localStorage.getItem('accessToken')
                          if (!token) return

                          const roomNo = typeof room.id === 'string' && room.id.startsWith('room-') 
                            ? room.id.replace('room-', '') 
                            : room.id

                          if (isFavorite) {
                            // 관심 있는 방에서 제거
                            const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/like`), {
                              method: 'DELETE',
                              credentials: 'include',
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            })

                            if (res.ok) {
                              // 서버 상태 기준으로 관심 있는 방 목록 재조회
                              fetchRooms('joined')
                            }
                          } else {
                            // 관심 있는 방으로 추가
                            const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/like`), {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            })

                            if (res.ok) {
                              // 서버 상태 기준으로 관심 있는 방 목록 재조회
                              fetchRooms('joined')
                            }
                          }
                        } catch (err) {
                          console.error('[room] favorite toggle error', err)
                        }
                      }}
                      className="p-1 -m-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star 
                        className={`w-5 h-5 ${joinedRooms.some((joined) => joined.id === room.id) ? 'fill-yellow-500/30 text-yellow-500' : ''}`}
                      />
                    </button>
                  </div>
                  
                  {/* 방 정보 */}
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <span>{room.roomType}</span>
                      <span>·</span>
                      <span>{room.capacity}인실</span>
                      {room.residencePeriod && (
                        <>
                          <span>·</span>
                          <span>{room.residencePeriod}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{room.currentMembers}/{room.capacity}명</span>
                    </div>
                  </div>
                  
                  {/* 버튼 */}
                  <div className={`grid gap-2 ${hasMyRoom ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <button
                      onClick={async () => {
                        const isCurrentlyExpanded = expandedRoomIds.has(room.id)
                        
                        if (isCurrentlyExpanded) {
                          // 접기
                          setExpandedRoomIds((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(room.id)
                            return newSet
                          })
                        } else {
                          // 펼치기 - 방 규칙이 없으면 API 호출
                          if (!roomRules[room.id]) {
                            try {
                              const token = localStorage.getItem('accessToken')
                              // 비회원도 체크리스트 조회 가능

                              // roomNo를 room.id에서 추출 (room.id가 roomNo인 경우)
                              // room.id에서 roomNo 추출 (Room 타입의 id는 string이지만 실제로는 roomNo)
                              const roomNo = typeof room.id === 'string' && room.id.startsWith('room-') 
                                ? room.id.replace('room-', '') 
                                : room.id

                              // 공개 API 사용
                              const headers: HeadersInit = {
                                'Content-Type': 'application/json',
                              }
                              if (token) {
                                headers['Authorization'] = `Bearer ${token}`
                              }
                              const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/rule`), {
                                credentials: 'include',
                                headers,
                              })

                              if (res.ok) {
                                const data = await res.json()
                                // ResponseEntity<MyRoomRuleResponse> 형식: 직접 접근
              const payload: ApiRoomRule | null = data
                                
                                if (payload) {
                                  // 기타 메모 저장
                                  if (payload.otherNotes) {
                                    setRoomOtherNotes((prev) => ({
                                      ...prev,
                                      [room.id]: payload.otherNotes || '',
                                    }))
                                  }

                                  // API 응답을 체크리스트 섹션 형식으로 변환
                                  const checklistSections = convertApiRuleToChecklistSections(payload)

                                  setRoomRules((prev) => ({
                                    ...prev,
                                    [room.id]: checklistSections,
                                  }))
                                }
                              }
                            } catch (err) {
                              console.error('[room] rule fetch error', err)
                            }
                          }
                          
                          // 펼치기
                          setExpandedRoomIds((prev) => {
                            const newSet = new Set(prev)
                            newSet.add(room.id)
                            return newSet
                          })
                        }
                      }}
                      className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-black text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span>{expandedRoomIds.has(room.id) ? '접기' : '체크리스트 보기'}</span>
                    </button>
                    {/* 지원하기 버튼 - 로그인한 사용자만 표시 */}
                    {localStorage.getItem('accessToken') && !hasMyRoom && (
                      (() => {
                        const alreadyApplied = appliedRooms.some((applied) => applied.id === room.id)

                        if (alreadyApplied) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 border border-gray-200 text-sm font-medium px-3 py-2 rounded-lg cursor-not-allowed"
                            >
                              <span>가입 요청 완료</span>
                            </button>
                          )
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoom(room)
                              setShowApplyRoom(true)
                            }}
                            className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <span>가입 요청</span>
                          </button>
                        )
                      })()
                    )}
                  </div>
                  
                  {/* 방 규칙 표시 */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedRoomIds.has(room.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                        {roomRules[room.id] && roomRules[room.id].length > 0 ? (
                          <>
                            {roomRules[room.id].map((section: ChecklistSection) => (
                              <div key={section.title} className="space-y-3">
                                <h4 className="text-base font-bold text-black">{section.title}</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                  <div className="space-y-3 text-sm text-gray-700">
                                    {section.items.map((item: ChecklistItem) => (
                                      <div key={item.label} className="flex gap-2">
                                        <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                                        <div className={`flex flex-wrap gap-2 flex-1`}>
                                          {item.value !== undefined && item.value !== null && item.value ? (
                                            <span className="text-black font-medium">{item.value}</span>
                                          ) : item.options && item.options.length > 0 ? (
                                            <>
                                              {item.options.map((option: ChecklistOption) => {
                                                // 귀가/소등의 특정 옵션은 extraValue가 있을 때 별도로 표시하므로 여기서는 숨김
                                                if (
                                                  item.extraValue &&
                                                  ((item.label === '소등' && option.text === '__시 이후' && option.selected) ||
                                                    (item.label === '귀가' && option.text === '고정적' && option.selected))
                                                ) {
                                                  return null
                                                }

                                                return (
                                                  <span
                                                    key={option.text}
                                                    className={
                                                      option.selected
                                                        ? `bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md`
                                                        : `text-gray-500 text-xs px-2 py-1`
                                                    }
                                                  >
                                                    {option.text}
                                                  </span>
                                                )
                                              })}
                                              {/* 귀가/소등의 시간 정보를 별도로 표시 */}
                                              {item.extraValue && (
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
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* 기타 메모 표시 */}
                            {roomOtherNotes[room.id] && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-black">기타</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {roomOtherNotes[room.id]}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : expandedRoomIds.has(room.id) ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="text-center py-4 text-gray-500 text-sm">
                              등록된 체크리스트가 없습니다.
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasMyRoom && activeTab === 'applied' && (
            <div className="space-y-4">
              {filteredAppliedRooms.map((room) => (
                <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-1 flex-1">
                      <h2 className="text-base font-semibold text-black">
                        {room.title}
                      </h2>
                    </div>
                  </div>

                  {/* 방 정보 */}
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <span>{room.roomType}</span>
                      <span>·</span>
                      <span>{room.capacity}인실</span>
                      {room.residencePeriod && (
                        <>
                          <span>·</span>
                          <span>{room.residencePeriod}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{room.currentMembers}/{room.capacity}명</span>
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => {
                        setSelectedRoom(room)
                        setShowCancelConfirm(true)
                      }}
                      className="flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <span>지원 취소</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'joined' && (
            <div className="space-y-4">
              {filteredJoinedRooms.map((room) => (
                <div key={room.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-1 flex-1">
                      <h2 className="text-base font-semibold text-black">
                        {room.title}
                      </h2>
                    </div>
                    <button
                      onClick={async () => {
                        const isFavorite = joinedRooms.some((joined) => joined.id === room.id)
                        
                        try {
                          const token = localStorage.getItem('accessToken')
                          if (!token) return

                          const roomNo = typeof room.id === 'string' && room.id.startsWith('room-') 
                            ? room.id.replace('room-', '') 
                            : room.id

                          if (isFavorite) {
                            // 관심 있는 방에서 제거
                            const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/like`), {
                              method: 'DELETE',
                              credentials: 'include',
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            })

                            if (res.ok) {
                              // 서버 상태 기준으로 관심 있는 방 목록 재조회
                              fetchRooms('joined')
                            }
                          } else {
                            // 관심 있는 방으로 추가
                            const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/like`), {
                              method: 'POST',
                              credentials: 'include',
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            })

                            if (res.ok) {
                              // 서버 상태 기준으로 관심 있는 방 목록 재조회
                              fetchRooms('joined')
                            }
                          }
                        } catch (err) {
                          console.error('[room] favorite toggle error', err)
                        }
                      }}
                      className="p-1 -m-1 text-gray-400 hover:text-yellow-500 transition-colors"
                    >
                      <Star 
                        className={`w-5 h-5 ${joinedRooms.some((joined) => joined.id === room.id) ? 'fill-yellow-500/30 text-yellow-500' : ''}`}
                      />
                    </button>
                  </div>

                  {/* 방 정보 */}
                  <div className="text-sm text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <span>{room.roomType}</span>
                      <span>·</span>
                      <span>{room.capacity}인실</span>
                      {room.residencePeriod && (
                        <>
                          <span>·</span>
                          <span>{room.residencePeriod}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>{room.currentMembers}/{room.capacity}명</span>
                    </div>
                  </div>

                  {/* 버튼 */}
                  <div className={`grid gap-2 ${hasMyRoom ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <button
                      onClick={async () => {
                        const isCurrentlyExpanded = expandedRoomIds.has(room.id)
                        
                        if (isCurrentlyExpanded) {
                          // 접기
                          setExpandedRoomIds((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(room.id)
                            return newSet
                          })
                        } else {
                          // 펼치기 - 방 규칙이 없으면 API 호출
                          if (!roomRules[room.id]) {
                            try {
                              const token = localStorage.getItem('accessToken')
                              // 비회원도 체크리스트 조회 가능

                              // roomNo를 room.id에서 추출 (room.id가 roomNo인 경우)
                              // room.id에서 roomNo 추출 (Room 타입의 id는 string이지만 실제로는 roomNo)
                              const roomNo = typeof room.id === 'string' && room.id.startsWith('room-') 
                                ? room.id.replace('room-', '') 
                                : room.id

                              // 공개 API 사용
                              const headers: HeadersInit = {
                                'Content-Type': 'application/json',
                              }
                              if (token) {
                                headers['Authorization'] = `Bearer ${token}`
                              }
                              const res = await fetch(getApiUrl(`/api/rooms/${roomNo}/rule`), {
                                credentials: 'include',
                                headers,
                              })

                              if (res.ok) {
                                const data = await res.json()
                                // ResponseEntity<MyRoomRuleResponse> 형식: 직접 접근
              const payload: ApiRoomRule | null = data
                                
                                if (payload) {
                                  // 기타 메모 저장
                                  if (payload.otherNotes) {
                                    setRoomOtherNotes((prev) => ({
                                      ...prev,
                                      [room.id]: payload.otherNotes || '',
                                    }))
                                  }

                                  // API 응답을 체크리스트 섹션 형식으로 변환
                                  const checklistSections = convertApiRuleToChecklistSections(payload)

                                  setRoomRules((prev) => ({
                                    ...prev,
                                    [room.id]: checklistSections,
                                  }))
                                }
                              }
                            } catch (err) {
                              console.error('[room] rule fetch error', err)
                            }
                          }
                          
                          // 펼치기
                          setExpandedRoomIds((prev) => {
                            const newSet = new Set(prev)
                            newSet.add(room.id)
                            return newSet
                          })
                        }
                      }}
                      className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-black text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span>{expandedRoomIds.has(room.id) ? '접기' : '체크리스트 보기'}</span>
                    </button>
                    {/* 지원하기 버튼 - 로그인한 사용자만 표시 */}
                    {localStorage.getItem('accessToken') && !hasMyRoom && (
                      (() => {
                        const alreadyApplied = appliedRooms.some((applied) => applied.id === room.id)

                        if (alreadyApplied) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-400 border border-gray-200 text-sm font-medium px-3 py-2 rounded-lg cursor-not-allowed"
                            >
                              <span>가입 요청 완료</span>
                            </button>
                          )
                        }

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoom(room)
                              setShowApplyRoom(true)
                            }}
                            className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <span>가입 요청</span>
                          </button>
                        )
                      })()
                    )}
                  </div>

                  {/* 방 규칙 표시 */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      expandedRoomIds.has(room.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
                        {roomRules[room.id] && roomRules[room.id].length > 0 ? (
                          <>
                            {roomRules[room.id].map((section: ChecklistSection) => (
                              <div key={section.title} className="space-y-3">
                                <h4 className="text-base font-bold text-black">{section.title}</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                  <div className="space-y-3 text-sm text-gray-700">
                                    {section.items.map((item: ChecklistItem) => (
                                      <div key={item.label} className="flex gap-2">
                                        <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                                        <div className={`flex flex-wrap gap-2 flex-1`}>
                                          {item.value !== undefined && item.value !== null && item.value ? (
                                            <span className="text-black font-medium">{item.value}</span>
                                          ) : item.options && item.options.length > 0 ? (
                                            <>
                                              {item.options.map((option: ChecklistOption) => {
                                                // 귀가/소등의 특정 옵션은 extraValue가 있을 때 별도로 표시하므로 여기서는 숨김
                                                if (
                                                  item.extraValue &&
                                                  ((item.label === '소등' && option.text === '__시 이후' && option.selected) ||
                                                    (item.label === '귀가' && option.text === '고정적' && option.selected))
                                                ) {
                                                  return null
                                                }

                                                return (
                                                  <span
                                                    key={option.text}
                                                    className={
                                                      option.selected
                                                        ? `bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md`
                                                        : `text-gray-500 text-xs px-2 py-1`
                                                    }
                                                  >
                                                    {option.text}
                                                  </span>
                                                )
                                              })}
                                              {/* 귀가/소등의 시간 정보를 별도로 표시 */}
                                              {item.extraValue && (
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
                                          ) : null}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {/* 기타 메모 표시 */}
                            {roomOtherNotes[room.id] && (
                              <div className="space-y-3">
                                <h4 className="text-base font-bold text-black">기타</h4>
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                    {roomOtherNotes[room.id]}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : expandedRoomIds.has(room.id) ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                            <div className="text-center py-4 text-gray-500 text-sm">
                              등록된 체크리스트가 없습니다.
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar />

      {/* 방 만들기 모달 */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}

      {/* 지원서 모달 */}
      {showApplyRoom && selectedRoom && (
        <ApplyRoomModal 
          onClose={() => {
            setShowApplyRoom(false)
            setSelectedRoom(null)
          }}
          roomInfo={{
            title: selectedRoom.title,
            roomType: selectedRoom.roomType,
            capacity: selectedRoom.capacity,
            currentMembers: selectedRoom.currentMembers,
            residencePeriod: selectedRoom.residencePeriod
          }}
          roomId={selectedRoom.id}
          onSuccess={() => {
            // 가입 요청 성공 시 즉시 로컬 상태 업데이트
            const roomId = selectedRoom.id
            setRecruitingRooms((prev) => prev.filter((room) => room.id !== roomId))
            setAppliedRooms((prev) => {
              // 이미 있는지 확인
              if (prev.some((room) => room.id === roomId)) {
                return prev
              }
              return [...prev, selectedRoom]
            })
            // 백그라운드에서 목록 새로고침
            void fetchRooms(activeTab, { showLoading: false })
          }}
        />
      )}

      {/* 문의하기 모달 */}
      {showChatRequest && selectedRoom && (
        <ChatRequestModal 
          onClose={() => {
            setShowChatRequest(false)
            setSelectedRoom(null)
          }}
          roomInfo={{
            title: selectedRoom.title,
            dormitory: selectedRoom.title,
            roomType: selectedRoom.roomType,
            description: selectedRoom.description,
            hostName: selectedRoom.hostName
          }}
        />
      )}

      {/* 지원 취소 확인 모달 */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="지원 취소"
        message="정말로 지원을 취소하시겠습니까?"
        confirmText="취소하기"
        onConfirm={handleCancelApply}
        onCancel={() => {
          setShowCancelConfirm(false)
          setSelectedRoom(null)
        }}
      />

      {/* 방 나가기 확인 모달 */}
      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="방 나가기"
        message="정말로 방에서 나가시겠습니까?"
        confirmText="나가기"
        onConfirm={handleConfirmLeave}
        onCancel={() => {
          setShowLeaveConfirm(false)
          setSelectedRoom(null)
        }}
      />
    </div>
  )
}

export default RoomSearchPage
