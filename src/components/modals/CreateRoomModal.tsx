import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreateRoomModalProps {
  onClose: () => void
  onCreated?: () => void
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
  category: 'BASIC_INFO' | 'LIFESTYLE_PATTERN' | 'ADDITIONAL_RULES'
  items: ChecklistItem[]
}

const CreateRoomModal = ({ onClose, onCreated }: CreateRoomModalProps) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
  })
  
  const [otherNotes, setOtherNotes] = useState('')
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set())
  const [checklistSections, setChecklistSections] = useState<ChecklistSection[]>([
    {
      title: '기본 정보',
      category: 'BASIC_INFO',
      items: [
        {
          label: '수용 인원',
          options: [
            { text: '2명', selected: false },
            { text: '4명', selected: false },
            { text: '6명', selected: false },
          ],
        },
        {
          label: '거주기간',
          options: [
            { text: '학기(16주)', selected: false },
            { text: '반기(24주)', selected: false },
            { text: '계절학기', selected: false },
          ],
        },
        {
          label: '생활관',
          options: [
            { text: '2', selected: false },
            { text: '3', selected: false },
            { text: '메디컬', selected: false },
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
            { text: '유동적', selected: false },
            { text: '고정적', selected: false },
          ],
          extraValue: '',
        },
        {
          label: '청소',
          options: [
            { text: '주기적', selected: false },
            { text: '비주기적', selected: false },
          ],
        },
        {
          label: '방에서 전화',
          options: [
            { text: '가능', selected: false },
            { text: '불가능', selected: false },
          ],
        },
        {
          label: '잠귀',
          options: [
            { text: '밝음', selected: false },
            { text: '어두움', selected: false },
          ],
        },
        {
          label: '잠버릇',
          options: [
            { text: '심함', selected: false },
            { text: '중간', selected: false },
            { text: '약함', selected: false },
          ],
        },
        {
          label: '코골이',
          options: [
            { text: '심함', selected: false },
            { text: '중간', selected: false },
            { text: '약함~없음', selected: false },
          ],
        },
        {
          label: '샤워시간',
          options: [
            { text: '아침', selected: false },
            { text: '저녁', selected: false },
          ],
        },
        {
          label: '방에서 취식',
          options: [
            { text: '가능', selected: false },
            { text: '불가능', selected: false },
            { text: '가능+환기필수', selected: false },
          ],
        },
        {
          label: '소등',
          options: [
            { text: '__시 이후', selected: false },
            { text: '한명 잘 때 알아서', selected: false },
          ],
          extraValue: '',
        },
        {
          label: '본가 주기',
          options: [
            { text: '매주', selected: false },
            { text: '2주', selected: false },
            { text: '한달이상', selected: false },
            { text: '거의 안 감', selected: false },
          ],
        },
        {
          label: '흡연',
          options: [
            { text: '연초', selected: false },
            { text: '전자담배', selected: false },
            { text: '비흡연', selected: false },
          ],
        },
        {
          label: '냉장고',
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
        {
          label: '드라이기',
          value: '',
        },
        {
          label: '알람',
          options: [
            { text: '진동', selected: false },
            { text: '소리', selected: false },
          ],
        },
        {
          label: '이어폰',
          options: [
            { text: '항상', selected: false },
            { text: '유동적', selected: false },
          ],
        },
        {
          label: '키스킨',
          options: [
            { text: '항상', selected: false },
            { text: '유동적', selected: false },
          ],
        },
        {
          label: '더위',
          options: [
            { text: '많이 탐', selected: false },
            { text: '중간', selected: false },
            { text: '적게 탐', selected: false },
          ],
        },
        {
          label: '추위',
          options: [
            { text: '많이 탐', selected: false },
            { text: '중간', selected: false },
            { text: '적게 탐', selected: false },
          ],
        },
        {
          label: '공부',
          options: [
            { text: '기숙사 밖', selected: false },
            { text: '기숙사 안', selected: false },
            { text: '유동적', selected: false },
          ],
        },
        {
          label: '쓰레기통',
          options: [
            { text: '개별', selected: false },
            { text: '공유', selected: false },
          ],
        },
      ],
    },
  ])
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)

  const mapRoomTypeToApi = (dormType: string) => {
    switch (dormType) {
      case '2':
        return 'TYPE_2'
      case '3':
        return 'TYPE_1'
      case '메디컬':
        return 'TYPE_MEDICAL'
      default:
        return undefined
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('로그인이 필요합니다.')
      return
    }

    // 에러 필드 초기화
    const newErrorFields = new Set<string>()

    // 방 이름 검사
    if (!formData.title || formData.title.trim() === '') {
      newErrorFields.add('title')
    }

    // 모든 항목 유효성 검사 (추가 규칙 제외)
    checklistSections.forEach((section, sectionIndex) => {
      // 추가 규칙은 선택사항이므로 검사 제외
      if (section.category === 'ADDITIONAL_RULES') return

      section.items.forEach((item, itemIndex) => {
        const errorKey = `${sectionIndex}-${itemIndex}`

        // 옵션 타입 항목: 하나 이상 선택되어야 함
        if (item.options) {
          const hasSelected = item.options.some(opt => opt.selected)
          if (!hasSelected) {
            newErrorFields.add(errorKey)
          }

          // 귀가 고정적 선택 시 시간 필수
          if (item.label === '귀가' && item.options.some(opt => opt.text === '고정적' && opt.selected)) {
            if (!item.extraValue || item.extraValue.trim() === '') {
              newErrorFields.add(errorKey)
            }
          }

          // 소등 __시 이후 선택 시 시간 필수
          if (item.label === '소등' && item.options.some(opt => opt.text === '__시 이후' && opt.selected)) {
            if (!item.extraValue || item.extraValue.trim() === '') {
              newErrorFields.add(errorKey)
            }
          }
        }
        // 텍스트 입력 항목: 값이 비어있으면 안됨
        else if (item.value !== undefined) {
          if (!item.value || item.value.trim() === '') {
            newErrorFields.add(errorKey)
          }
        }
      })
    })

    // 에러가 있으면 표시하고 중단
    if (newErrorFields.size > 0) {
      setErrorFields(newErrorFields)
      return
    }

    // 에러 없으면 초기화
    setErrorFields(new Set())

    // 수용 인원 추출
    const capacityItem = checklistSections[0].items.find(item => item.label === '수용 인원')
    const selectedCapacity = capacityItem?.options?.find(opt => opt.selected)?.text.replace('명', '')
    const capacity = selectedCapacity ? Number(selectedCapacity) : 0

    // 생활관 추출 및 방 타입 매핑
    const dormItem = checklistSections[0].items.find(item => item.label === '생활관')
    const selectedDorm = dormItem?.options?.find(opt => opt.selected)?.text
    const roomType = selectedDorm ? mapRoomTypeToApi(selectedDorm) : undefined

    // 거주기간 추출 및 enum 매핑
    const residencePeriodItem = checklistSections[0].items.find(item => item.label === '거주기간')
    const selectedResidencePeriod = residencePeriodItem?.options?.find(opt => opt.selected)?.text
    const residencePeriod = selectedResidencePeriod ? mapResidencePeriodToEnum(selectedResidencePeriod) : null

    // 규칙 데이터 구성
    const categories = checklistSections.map((section) => ({
      category: section.category,
      items: section.items.map((item) => ({
        label: item.label,
        itemType: item.options ? 'OPTION' : 'VALUE',
        value: item.value || null,
        extraValue: item.extraValue || null,
        options: item.options?.map((opt) => ({
          text: opt.text,
          selected: opt.selected || false,
        })) || null,
      })),
    }))

    try {
      const res = await fetch('http://localhost:8080/api/rooms', {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomType,
          capacity,
          residencePeriod,
          title: formData.title.trim(),
          rule: {
            otherNotes: otherNotes.trim() || null,
            categories,
          },
        }),
      })

      if (res.status === 401) {
        toast.error('로그인이 필요합니다.')
        return
      }

      if (!res.ok) {
        throw new Error('방 생성에 실패했습니다.')
      }

      toast.success('방이 생성되었습니다!')
      onCreated?.()
      // 방 생성 후 방 관리 페이지로 이동
      navigate('/rooms/me', { replace: true })
    } catch (error) {
      console.error('[rooms] create error', error)
      toast.error('방 생성에 실패했습니다.')
    }
  }

  const handleOptionToggle = (sectionIndex: number, itemIndex: number, optionIndex: number) => {
    setChecklistSections((prev) => {
      return prev.map((section, sIdx) => {
        if (sIdx !== sectionIndex) return section
        return {
          ...section,
          items: section.items.map((item, iIdx) => {
            if (iIdx !== itemIndex || !item.options) return item
            return {
              ...item,
              options: item.options.map((opt, oIdx) => ({
                ...opt,
                // 같은 항목 내에서는 하나만 선택 가능 (라디오 버튼처럼)
                selected: oIdx === optionIndex ? !opt.selected : false,
              })),
            }
          }),
        }
      })
    })
  }

  const handleValueChange = (sectionIndex: number, itemIndex: number, value: string) => {
    setChecklistSections((prev) => {
      const updated = [...prev]
      updated[sectionIndex].items[itemIndex].value = value
      return updated
    })
  }

  const handleExtraValueChange = (sectionIndex: number, itemIndex: number, extraValue: string) => {
    setChecklistSections((prev) => {
      const updated = [...prev]
      updated[sectionIndex].items[itemIndex].extraValue = extraValue
      return updated
    })
  }

  // 드래그 이벤트 핸들러들
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
    currentY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 100) {
      onClose()
    } else {
      setDragOffset(0)
    }
    
    setIsDragging(false)
  }

  // 마우스 드래그 지원 (데스크톱)
  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY
    currentY.current = e.clientY
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    
    currentY.current = e.clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      setDragOffset(deltaY)
    }
  }

  const handleMouseUp = () => {
    if (!isDragging) return
    
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 100) {
      onClose()
    } else {
      setDragOffset(0)
    }
    
    setIsDragging(false)
  }

  // 마우스 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white w-full max-w-[430px] rounded-t-3xl p-4 sm:p-6 animate-slide-up max-h-[90vh] overflow-y-auto transition-transform duration-200"
        style={{
          transform: `translateY(${dragOffset}px)`,
          opacity: isDragging ? 1 - (dragOffset / 200) : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <h2 className="text-xl font-bold text-black">방 만들기</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 방 이름 */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-black">방 이름</h3>
            <div className={`bg-white rounded-xl p-4 ${
              errorFields.has('title') ? 'border border-red-400 bg-red-50' : 'border border-gray-200'
            }`}>
            <input
              type="text"
              value={formData.title}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                  // 에러 제거
                  if (errorFields.has('title')) {
                    setErrorFields(prev => {
                      const newSet = new Set(prev)
                      newSet.delete('title')
                      return newSet
                    })
                  }
                }}
                className="w-full text-base text-black outline-none bg-transparent"
                placeholder="방 이름을 입력하세요"
            />
          </div>
          </div>

          {/* 규칙 체크리스트 */}
          <div className="space-y-4">
            {checklistSections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-3">
                <h4 className="text-base font-bold text-black">{section.title}</h4>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="space-y-3 text-sm text-gray-700">
                    {section.items.map((item, itemIndex) => {
                      const errorKey = `${sectionIndex}-${itemIndex}`
                      const hasError = errorFields.has(errorKey)
                      
                      return (
                      <div key={item.label} className="flex gap-2">
                        <div className="w-20 text-gray-500 shrink-0">{item.label}</div>
                        <div className="flex flex-wrap gap-2 flex-1">
                          {item.options ? (
                            item.options.map((option, optionIndex) => (
                              <button
                                key={option.text}
                                type="button"
                                onClick={() => {
                                  handleOptionToggle(sectionIndex, itemIndex, optionIndex)
                                  // 에러 제거
                                  if (hasError) {
                                    setErrorFields(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(errorKey)
                                      return newSet
                                    })
                                  }
                                }}
                                className={`${
                                  option.selected
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2 py-1 rounded-md cursor-pointer'
                                    : hasError
                                      ? 'text-gray-500 text-xs px-2 py-1 cursor-pointer border border-red-400 rounded-md bg-red-50'
                                      : 'text-gray-500 text-xs px-2 py-1 cursor-pointer border border-gray-200 rounded-md'
                                }`}
                              >
                                {option.text}
                              </button>
                            ))
                          ) : (
                            <input
                              type="text"
                              value={item.value || ''}
                              onChange={(e) => {
                                handleValueChange(sectionIndex, itemIndex, e.target.value)
                                // 에러 제거
                                if (hasError) {
                                  setErrorFields(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(errorKey)
                                    return newSet
                                  })
                                }
                              }}
                              placeholder={
                                item.label === '취침'
                                  ? '예: 23시-1시'
                                  : item.label === '기상'
                                    ? '예: 7시-9시'
                                    : item.label === '드라이기'
                                      ? '예: 12-7시만 피해 사용'
                                      : `${item.label} 입력`
                              }
                              className={`border rounded px-2 py-1 text-sm text-black flex-1 min-w-0 ${
                                hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                              }`}
                            />
                          )}
                          {/* 귀가 - 고정적 선택 시 시간 입력 */}
                          {item.label === '귀가' &&
                            item.options?.some((opt) => opt.text === '고정적' && opt.selected) && (
                              <select
                                value={item.extraValue ?? ''}
                                onChange={(e) => {
                                  handleExtraValueChange(sectionIndex, itemIndex, e.target.value)
                                  // 에러 제거
                                  if (hasError) {
                                    setErrorFields(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(errorKey)
                                      return newSet
                                    })
                                  }
                                }}
                                className={`border rounded px-2 py-1 text-xs text-black ${
                                  hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                              >
                                <option value="">시간 선택</option>
                                {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                                  <option key={hour} value={`${hour}시`}>
                                    {hour}시
                                  </option>
                                ))}
                              </select>
                            )}
                          {/* 소등 - __시 이후 선택 시 시간 입력 */}
                          {item.label === '소등' &&
                            item.options?.some((opt) => opt.text === '__시 이후' && opt.selected) && (
                              <select
                                value={item.extraValue ?? ''}
                                onChange={(e) => {
                                  handleExtraValueChange(sectionIndex, itemIndex, e.target.value)
                                  // 에러 제거
                                  if (hasError) {
                                    setErrorFields(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(errorKey)
                                      return newSet
                                    })
                                  }
                                }}
                                className={`border rounded px-2 py-1 text-xs text-black ${
                                  hasError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                              >
                                <option value="">시간 선택</option>
                                {Array.from({ length: 25 }, (_, hour) => hour).map((hour) => (
                                  <option key={hour} value={`${hour}시`}>
                                    {hour}시
                                  </option>
                                ))}
                              </select>
                            )}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </div>
          </div>
            ))}

            {/* 기타 사항 */}
            <div className="space-y-3">
              <h4 className="text-base font-bold text-black">기타 사항</h4>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
            <textarea
                  value={otherNotes}
                  onChange={(e) => setOtherNotes(e.target.value)}
                  className="w-full text-sm text-gray-700 outline-none resize-none"
              rows={4}
                  placeholder="추가로 전달하고 싶은 내용을 입력하세요"
            />
          </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-black py-3 rounded-lg font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 bg-black text-white py-3 rounded-lg font-medium"
            >
              방 만들기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomModal
