import { describe, expect, it } from 'vitest';
import {
  checklistFormToRoomRuleRequest,
  checklistFormToUserChecklistRequest,
  createRoomDraftToRequest,
  normalizeRoom,
  roomRuleToChecklist,
  roomRuleToChecklistForm,
} from './roomData';

describe('roomData helpers', () => {
  it('normalizeRoom은 백엔드 방 응답을 화면 모델로 변환한다', () => {
    expect(normalizeRoom({
      roomNo: 'room-1',
      roomType: 'TYPE_2',
      capacity: 4,
      currentMateCount: 2,
      remaining: 2,
      title: '아침형 룸메 구해요',
      notes: '조용히 지내요',
      hostNickname: '민지',
      hostMajor: '컴퓨터공학과',
      hostStudentYear: '22',
      roomStatus: 'CONFIRM_PENDING',
      residencePeriod: 'SEMESTER',
    })).toMatchObject({
      id: 'room-1',
      roomNo: 'room-1',
      dorm: '2생활관',
      size: '4인실',
      members: 2,
      capacity: 4,
      recruiting: true,
      host: { name: '민지', major: '컴퓨터공학과', studentYear: '22' },
    });
  });

  it('roomRuleToChecklist는 enum과 시간 문자열을 표시용 섹션으로 변환한다', () => {
    const sections = roomRuleToChecklist({
      bedtime: '23:00',
      wakeUp: '07:00',
      returnHome: 'FIXED',
      cleaning: 'REGULAR',
      phoneCall: 'ALLOWED',
      sleepLight: 'DARK',
      sleepHabit: 'MILD',
      snoring: 'MILD_OR_NONE',
      showerTime: 'EVENING',
      eating: 'ALLOWED_WITH_VENTILATION',
      lightsOut: 'AFTER_TIME',
      lightsOutTime: '23:00',
      homeVisit: 'BIWEEKLY',
      smoking: 'NON_SMOKER',
      refrigerator: 'DECIDE_AFTER_DISCUSSION',
      alarm: 'VIBRATION',
    });

    expect(sections[0].items[0]).toEqual({ q: '취침', a: '23:00' });
    expect(sections[0].items.find((item) => item.q === '귀가')).toEqual({ q: '귀가', a: '고정적' });
    expect(sections[1].items.find((item) => item.q === '알람')).toEqual({ q: '알람', a: '진동' });
  });

  it('roomRuleToChecklistForm은 백엔드 규칙을 수정 폼 상태로 변환한다', () => {
    expect(roomRuleToChecklistForm({
      bedtime: '23:00',
      wakeUp: '07:00',
      hairDryer: '12:00-19:00',
      returnHome: 'FLEXIBLE',
      cleaning: 'REGULAR',
      phoneCall: 'ALLOWED',
      sleepLight: 'DARK',
      sleepHabit: 'MILD',
      snoring: 'MILD_OR_NONE',
      showerTime: 'EVENING',
      eating: 'ALLOWED_WITH_VENTILATION',
      lightsOut: 'AFTER_TIME',
      lightsOutTime: '23:00',
      homeVisit: 'BIWEEKLY',
      smoking: 'NON_SMOKER',
      refrigerator: 'DECIDE_AFTER_DISCUSSION',
      alarm: 'VIBRATION',
      earphone: 'ALWAYS',
      keyskin: 'FLEXIBLE',
      heat: 'MODERATE',
      cold: 'LESS_SENSITIVE',
      study: 'INSIDE_DORM',
      trashCan: 'INDIVIDUAL',
    })).toMatchObject({
      sleep: { start: 23, end: 0 },
      wake: { start: 7, end: 0 },
      dryer: { start: 12, end: 19 },
      homing: '유동적',
      cleaning: '주기적',
      call: '가능',
      dim: '어두움',
      lightsOut: '시간 지정',
      lightsOutHour: 23,
      trash: '개별',
    });
  });

  it('checklistFormToRoomRuleRequest는 수정 폼과 방 정보를 백엔드 요청으로 변환한다', () => {
    const request = checklistFormToRoomRuleRequest({
      sleep: { start: 23, end: 1 },
      wake: { start: 7, end: 9 },
      dryer: null,
      homing: '고정적',
      cleaning: '주기적',
      call: '가능',
      dim: '어두움',
      sleepHabit: '약함',
      snore: '약함~없음',
      shower: '저녁',
      eating: '가능+환기필수',
      lightsOut: '시간 지정',
      lightsOutHour: 23,
      visitHome: '2주',
      smoke: '비흡연',
      fridge: '협의 후 결정',
      alarm: '진동',
      earphone: '항상',
      skinCare: '유동적',
      hot: '중간',
      cold: '중간',
      study: '기숙사 안',
      trash: '개별',
    }, {
      roomType: 'TYPE_2',
      capacity: 4,
      residencePeriod: 'SEMESTER',
    });

    expect(request).toMatchObject({
      bedtime: '23:00-01:00',
      wakeUp: '07:00-09:00',
      returnHome: 'FIXED',
      returnHomeTime: '23:00',
      cleaning: 'REGULAR',
      phoneCall: 'ALLOWED',
      sleepLight: 'DARK',
      sleepHabit: 'MILD',
      snoring: 'MILD_OR_NONE',
      showerTime: 'EVENING',
      eating: 'ALLOWED_WITH_VENTILATION',
      lightsOut: 'AFTER_TIME',
      lightsOutTime: '23:00',
      homeVisit: 'BIWEEKLY',
      smoking: 'NON_SMOKER',
      refrigerator: 'DECIDE_AFTER_DISCUSSION',
      hairDryer: null,
      alarm: 'VIBRATION',
      earphone: 'ALWAYS',
      keyskin: 'FLEXIBLE',
      heat: 'MODERATE',
      cold: 'MODERATE',
      study: 'INSIDE_DORM',
      trashCan: 'INDIVIDUAL',
      roomType: 'TYPE_2',
      capacity: 4,
      residencePeriod: 'SEMESTER',
    });
  });

  it('createRoomDraftToRequest는 생성 draft와 체크리스트 폼을 POST /api/rooms 요청으로 변환한다', () => {
    const request = createRoomDraftToRequest({
      title: '새 룸메 구해요',
      dorm: '2생활관',
      roomSize: '4인실',
      residencePeriod: 'SEMESTER',
      notes: '조용히 지내요',
    }, {
      sleep: { start: 23, end: 1 },
      wake: { start: 7, end: 9 },
      dryer: null,
      homing: '고정적',
      cleaning: '주기적',
      call: '가능',
      dim: '어두움',
      sleepHabit: '약함',
      snore: '약함~없음',
      shower: '저녁',
      eating: '가능+환기필수',
      lightsOut: '시간 지정',
      lightsOutHour: 23,
      visitHome: '2주',
      smoke: '비흡연',
      fridge: '협의 후 결정',
      alarm: '진동',
      earphone: '항상',
      skinCare: '유동적',
      hot: '중간',
      cold: '중간',
      study: '기숙사 안',
      trash: '개별',
    });

    expect(request).toMatchObject({
      roomType: 'TYPE_2',
      capacity: 4,
      residencePeriod: 'SEMESTER',
      title: '새 룸메 구해요',
      notes: '조용히 지내요',
      rule: {
        bedtime: '23:00-01:00',
        wakeUp: '07:00-09:00',
        returnHome: 'FIXED',
      },
    });
    expect(request.rule).not.toHaveProperty('roomType');
    expect(request.rule).not.toHaveProperty('capacity');
    expect(request.rule).not.toHaveProperty('residencePeriod');
  });

  it('checklistFormToUserChecklistRequest는 방 정보 없이 개인 체크리스트 요청을 만든다', () => {
    const request = checklistFormToUserChecklistRequest({
      sleep: { start: 23, end: 1 },
      wake: { start: 7, end: 9 },
      dryer: null,
      homing: '고정적',
      cleaning: '주기적',
      call: '가능',
      dim: '어두움',
      sleepHabit: '약함',
      snore: '약함~없음',
      shower: '저녁',
      eating: '가능+환기필수',
      lightsOut: '시간 지정',
      lightsOutHour: 23,
      visitHome: '2주',
      smoke: '비흡연',
      fridge: '협의 후 결정',
      alarm: '진동',
      earphone: '항상',
      skinCare: '유동적',
      hot: '중간',
      cold: '중간',
      study: '기숙사 안',
      trash: '개별',
    });

    expect(request).toMatchObject({
      bedtime: '23:00-01:00',
      wakeUp: '07:00-09:00',
      returnHome: 'FIXED',
    });
    expect(request).not.toHaveProperty('roomType');
    expect(request).not.toHaveProperty('capacity');
    expect(request).not.toHaveProperty('residencePeriod');
  });
});
