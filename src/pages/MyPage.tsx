import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit2, LogOut, Bell, Pencil } from 'lucide-react'
import BottomNavigationBar from '../components/ui/BottomNavigationBar'
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
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: '',
    grade: '',
    major: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingChecklist, setIsEditingChecklist] = useState(false)
  const [isSavingChecklist, setIsSavingChecklist] = useState(false)
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const res = await fetch('http://localhost:8080/api/users/profile/me', {
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

        const payload: Profile | null = data?.result ?? data?.data ?? data
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

        const res = await fetch('http://localhost:8080/api/users/me/checklist', {
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

          const payload: any = data?.result ?? data?.data ?? data
          
          // API 응답이 없거나 빈 경우 기본 템플릿 사용
          if (!payload || !payload.categories || payload.categories.length === 0) {
            setMyChecklist(defaultTemplate)
            return
          }

          // 기본 템플릿과 API 응답을 병합
          const mergedSections: ChecklistSection[] = defaultTemplate.map((defaultSection) => {
            // API에서 해당 카테고리 찾기
            const apiCategory = payload.categories.find(
              (cat: any) => cat.category === defaultSection.category
            )

            if (!apiCategory) {
              // API에 해당 카테고리가 없으면 기본 템플릿 사용
              return defaultSection
            }

            // 기본 템플릿의 각 항목에 대해 API 데이터 병합
            const mergedItems = defaultSection.items.map((defaultItem) => {
              // API에서 해당 항목 찾기
              const apiItem = apiCategory.items?.find(
                (item: any) => item.label === defaultItem.label && item.label !== '거주기간' && item.label !== '생활관'
              )

              if (!apiItem) {
                // API에 해당 항목이 없으면 기본 템플릿 사용
                return defaultItem
              }

              // API 데이터로 병합
              if (defaultItem.itemType === 'VALUE') {
                return {
                  ...defaultItem,
                  value: apiItem.value ?? defaultItem.value ?? '',
                }
              } else {
                // OPTION 타입인 경우
                const mergedOptions = defaultItem.options?.map((defaultOption) => {
                  const apiOption = apiItem.options?.find(
                    (opt: any) => opt.text === defaultOption.text
                  )
                  return {
                    ...defaultOption,
                    selected: apiOption?.selected ?? false,
                  }
                }) ?? []

                return {
                  ...defaultItem,
                  extraValue: apiItem.extraValue ?? defaultItem.extraValue ?? '',
                  options: mergedOptions,
                }
              }
            })

            return {
              ...defaultSection,
              items: mergedItems,
            }
          })

          setMyChecklist(mergedSections)
        } else {
          // API 호출 실패 시 기본 템플릿 사용
          setMyChecklist(defaultTemplate)
        }
      } catch (err) {
        console.error('[users] my checklist fetch error', err)
        // 에러 발생 시 기본 템플릿 사용
        setMyChecklist(createDefaultChecklistTemplate())
      }
    }

    void fetchMyChecklist()
  }, [])

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

      const res = await fetch('http://localhost:8080/api/users/profile', {
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
      setIsSavingChecklist(true)
      const token = localStorage.getItem('accessToken')
      if (!token) {
        navigate('/login', { replace: true })
        return
      }

      // 체크리스트 데이터를 백엔드 형식으로 변환
      const categories = myChecklist.map((section) => {
        // section.category가 있으면 사용, 없으면 title로 매핑
        const category: 'BASIC_INFO' | 'LIFESTYLE_PATTERN' | 'ADDITIONAL_RULES' =
          section.category ||
          (section.title === '기본 정보'
            ? 'BASIC_INFO'
            : section.title === '생활 패턴'
              ? 'LIFESTYLE_PATTERN'
              : 'ADDITIONAL_RULES')

        return {
          category,
          items: section.items.map((item) => ({
            label: item.label,
            itemType: item.options ? ('OPTION' as const) : ('VALUE' as const),
            value: item.value || null,
            extraValue: item.extraValue || null,
            options: item.options?.map((opt) => ({
              text: opt.text,
              selected: opt.selected || false,
            })) || null,
          })),
        }
      })

      const res = await fetch('http://localhost:8080/api/users/me/checklist', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otherNotes: '',
          categories,
        }),
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
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell className="w-7 h-7 text-gray-700" />
              </div>
            </div>
          </div>
        </header>
        {loading && (
          <div className="text-sm text-gray-500 flex items-center justify-center py-10">
            불러오는 중...
          </div>
        )}

        {!loading && profile && (
          <div className="px-4 pt-2 pb-4 space-y-6">
            {/* 프로필 카드 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">프로필 정보</h2>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1 hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4" />
                    편집
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-xl text-gray-600">
                      {profile.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-black">
                        {profile.nickname || profile.name}
                      </div>
                      <div className="text-sm text-gray-500">{profile.email}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500">이름</div>
                        <div className="text-sm font-medium text-black truncate">{profile.name}</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">성별</div>
                        <div className="text-sm font-medium text-black">{mapGenderToDisplay(profile.gender)}</div>
                      </div>

                      {profile.studentNo && (
                        <div>
                          <div className="text-xs text-gray-500">학번</div>
                          <div className="text-sm font-medium text-black truncate">{profile.studentNo}</div>
                        </div>
                      )}

                      {profile.major && (
                        <div>
                          <div className="text-xs text-gray-500">전공</div>
                          <div className="text-sm font-medium text-black truncate">{profile.major}</div>
                        </div>
                      )}

                      {profile.grade && (
                        <div>
                          <div className="text-xs text-gray-500">학년</div>
                          <div className="text-sm font-medium text-black">{profile.grade}</div>
                        </div>
                      )}

                      {profile.age !== undefined && profile.age !== null && (
                        <div>
                          <div className="text-xs text-gray-500">나이</div>
                          <div className="text-sm font-medium text-black">{profile.age}세</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={editForm.nickname}
                      onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                      maxLength={10}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e2dc] bg-[#f5f1ee] text-base text-black focus:outline-none focus:ring-2 focus:ring-[#fcb44e]"
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학년
                    </label>
                    <select
                      value={editForm.grade}
                      onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e2dc] bg-[#f5f1ee] text-base text-black focus:outline-none focus:ring-2 focus:ring-[#fcb44e] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-right pr-10"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전공
                    </label>
                    <input
                      type="text"
                      value={editForm.major}
                      onChange={(e) => setEditForm({ ...editForm, major: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e8e2dc] bg-[#f5f1ee] text-base text-black focus:outline-none focus:ring-2 focus:ring-[#fcb44e]"
                      placeholder="전공을 입력하세요"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-3 rounded-xl text-base font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSubmitting || !editForm.nickname.trim() || !editForm.grade.trim() || !editForm.major.trim()}
                      className="flex-1 py-3 rounded-xl text-base font-semibold bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? '저장 중...' : '저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 나의 체크리스트 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">나의 체크리스트</h2>
                <button
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (!isEditingChecklist) {
                      setIsEditingChecklist(true)
                    } else {
                      handleSaveChecklist()
                    }
                  }}
                  disabled={isSavingChecklist}
                >
                  <Pencil className="w-4 h-4" />
                  {isSavingChecklist ? '저장 중...' : isEditingChecklist ? '저장' : '편집'}
                </button>
              </div>
              {myChecklist.length > 0 ? (
                <div className="space-y-4">
                  {myChecklist.map((section, index) => (
                    <div key={section.title} className="space-y-3">
                      <h4 className="text-base font-bold text-black">{section.title}</h4>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="space-y-3 text-sm text-gray-700">
                        {section.items.map((item, itemIndex) => {
                          // 기본 정보 섹션은 수정 불가능 (이미 제거됨)
                          const isBasicInfo = false
                          const isEditable = isEditingChecklist && !isBasicInfo

                          return (
                            <div key={item.label} className="flex gap-2">
                              <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                              <div className={`flex flex-wrap gap-2 ${item.label === '드라이기' ? 'flex-1' : ''}`}>
                                {item.value !== undefined || (!item.options || item.options.length === 0) ? (
                                  isEditable ? (
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
                                              ? () => selectChecklistOption(index, itemIndex, optionIndex)
                                              : undefined
                                          }
                                          className={
                                            option.selected
                                              ? `bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md ${isEditable ? 'cursor-pointer' : ''}`
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
                                        onChange={(e) => updateChecklistExtraValue(index, itemIndex, e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-xs text-black w-24"
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
                                        onChange={(e) => updateChecklistExtraValue(index, itemIndex, e.target.value)}
                                        className="border border-gray-300 rounded px-2 py-1 text-xs text-black w-24"
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
                <div className="text-sm text-gray-500 text-center py-8">
                  체크리스트 정보를 불러오는 중...
                </div>
              )}
            </div>

            {/* 로그아웃 버튼 */}
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-xl text-base font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              로그아웃
            </button>
          </div>
        )}

        {!loading && !profile && (
          <div className="text-sm text-gray-500 flex items-center justify-center py-10">
            프로필 정보를 불러올 수 없습니다.
          </div>
        )}
      </main>

      {/* 하단 네비게이션 바 */}
      <BottomNavigationBar />
    </div>
  )
}

export default MyPage
