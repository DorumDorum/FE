import { describe, expect, test } from 'bun:test'

import {
  buildRoomRuleFetchPath,
  normalizeRoomRuleTimeValue,
  selectSingleOption,
} from './myRoomRuleUtils'

describe('selectSingleOption', () => {
  test('새 옵션을 선택하면 이전 선택은 해제한다', () => {
    const options = [
      { text: '진동', selected: true },
      { text: '소리', selected: false },
    ]

    expect(selectSingleOption(options, 1)).toEqual([
      { text: '진동', selected: false },
      { text: '소리', selected: true },
    ])
  })

  test('이미 선택된 옵션을 다시 누르면 선택 해제한다', () => {
    const options = [
      { text: '항상', selected: true },
      { text: '유동적', selected: false },
    ]

    expect(selectSingleOption(options, 0)).toEqual([
      { text: '항상', selected: false },
      { text: '유동적', selected: false },
    ])
  })
})

describe('buildRoomRuleFetchPath', () => {
  test('방 규칙 재조회는 roomNo path param 경로를 사용한다', () => {
    expect(buildRoomRuleFetchPath('123')).toBe('/api/rooms/123/rule')
  })
})

describe('normalizeRoomRuleTimeValue', () => {
  test('빈 시간값은 BE 검증을 통과하도록 기본값으로 보정한다', () => {
    expect(normalizeRoomRuleTimeValue('')).toBe('00:00')
    expect(normalizeRoomRuleTimeValue('   ')).toBe('00:00')
  })

  test('실제 선택된 시간값은 유지한다', () => {
    expect(normalizeRoomRuleTimeValue('23시')).toBe('23시')
  })
})
