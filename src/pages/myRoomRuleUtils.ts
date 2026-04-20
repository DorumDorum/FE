export type ChecklistOption = {
  text: string
  selected?: boolean
}

export const selectSingleOption = (
  options: ChecklistOption[],
  optionIndex: number
): ChecklistOption[] => {
  const isCurrentlySelected = options[optionIndex]?.selected ?? false

  if (isCurrentlySelected) {
    return options.map((option) => ({
      ...option,
      selected: false,
    }))
  }

  return options.map((option, index) => ({
    ...option,
    selected: index === optionIndex,
  }))
}

export const buildRoomRuleFetchPath = (roomNo: string) => `/api/rooms/${roomNo}/rule`

export const normalizeRoomRuleTimeValue = (value: string) =>
  value && value.trim() !== '' ? value : '00:00'
