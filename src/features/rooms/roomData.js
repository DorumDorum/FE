const ROOM_TYPE_LABELS = {
  TYPE_1: '1생활관',
  TYPE_2: '2생활관',
  TYPE_3: '3생활관',
  TYPE_MEDICAL: '메디컬',
};

const ROOM_TYPE_BY_LABEL = Object.fromEntries(
  Object.entries(ROOM_TYPE_LABELS).map(([key, label]) => [label, key]),
);

export const roomTypeLabel = (roomType) => ROOM_TYPE_LABELS[roomType] || roomType || '';

export const RESIDENCE_PERIOD_LABELS = {
  SEMESTER: '학기(16주)',
  HALF_YEAR: '반기(24주)',
  SEASONAL: '계절학기',
};

export const residencePeriodLabel = (period) => RESIDENCE_PERIOD_LABELS[period] || period || '';

export const CHECKLIST_VALUE_LABELS = {
  FLEXIBLE: '유동적',
  FIXED: '고정적',
  REGULAR: '주기적',
  IRREGULAR: '비주기적',
  ALLOWED: '가능',
  NOT_ALLOWED: '불가능',
  ALLOWED_WITH_VENTILATION: '가능 · 환기 필수',
  BRIGHT: '밝음',
  DARK: '어두움',
  SEVERE: '심함',
  MODERATE: '중간',
  MILD: '약함',
  MILD_OR_NONE: '약함 · 없음',
  MORNING: '아침',
  EVENING: '저녁',
  AFTER_TIME: '시간 지정',
  WHEN_ONE_SLEEPS: '한 명이 잘 때',
  WEEKLY: '매주',
  BIWEEKLY: '2주',
  MONTHLY_OR_MORE: '한 달 이상',
  RARELY: '거의 안 감',
  CIGARETTE: '흡연',
  E_CIGARETTE: '전자담배',
  NON_SMOKER: '비흡연',
  RENT_PURCHASE_OWN: '대여 · 구매 · 보유',
  DECIDE_AFTER_DISCUSSION: '협의 후 결정',
  NOT_NEEDED: '필요 없음',
  VIBRATION: '진동',
  SOUND: '소리',
  ALWAYS: '항상',
  VERY_SENSITIVE: '많이 탐',
  LESS_SENSITIVE: '적게 탐',
  OUTSIDE_DORM: '기숙사 밖',
  INSIDE_DORM: '기숙사 안',
  INDIVIDUAL: '개별',
  SHARED: '공유',
};

export const checklistValueLabel = (value) => CHECKLIST_VALUE_LABELS[value] || value || '-';

export const CHECKLIST_SECTIONS = [
  { cat: '생활 패턴', items: [
    { key: 'bedtime', q: '취침' },
    { key: 'wakeUp', q: '기상' },
    { key: 'returnHome', q: '귀가' },
    { key: 'returnHomeTime', q: '귀가 시간' },
    { key: 'cleaning', q: '청소' },
    { key: 'phoneCall', q: '방에서 전화' },
    { key: 'sleepLight', q: '잠귀' },
    { key: 'sleepHabit', q: '잠버릇' },
    { key: 'snoring', q: '코골이' },
    { key: 'showerTime', q: '샤워 시간' },
    { key: 'eating', q: '방에서 취식' },
    { key: 'lightsOut', q: '소등' },
    { key: 'lightsOutTime', q: '소등 시간' },
    { key: 'homeVisit', q: '본가 주기' },
    { key: 'smoking', q: '흡연' },
    { key: 'refrigerator', q: '냉장고' },
  ] },
  { cat: '추가 규칙', items: [
    { key: 'hairDryer', q: '드라이기 제한' },
    { key: 'alarm', q: '알람' },
    { key: 'earphone', q: '이어폰' },
    { key: 'keyskin', q: '키스킨' },
    { key: 'heat', q: '더위' },
    { key: 'cold', q: '추위' },
    { key: 'study', q: '공부' },
    { key: 'trashCan', q: '쓰레기통' },
  ] },
];

export const normalizeRoom = (room) => ({
  id: room.roomNo,
  roomNo: room.roomNo,
  title: room.title,
  dorm: roomTypeLabel(room.roomType),
  roomType: room.roomType,
  size: `${room.capacity}인실`,
  members: room.currentMateCount,
  capacity: room.capacity,
  remaining: room.remaining,
  recruiting: room.roomStatus !== 'COMPLETED',
  host: {
    name: room.hostNickname,
    major: room.hostMajor,
    studentYear: room.hostStudentYear,
  },
  roomStatus: room.roomStatus,
  residencePeriod: room.residencePeriod,
  notes: room.notes ?? null,
  checklist: [],
});

export const roomRuleToChecklist = (rule = {}) => CHECKLIST_SECTIONS.map((section) => ({
  cat: section.cat,
  items: section.items.map((item) => ({ q: item.q, a: checklistValueLabel(rule[item.key]) })),
}));

export const compareChecklists = (roomRule = {}, myChecklist = {}) => CHECKLIST_SECTIONS.map((section) => ({
  cat: section.cat,
  items: section.items.map((item) => ({
    q: item.q,
    room: checklistValueLabel(roomRule[item.key]),
    mine: checklistValueLabel(myChecklist[item.key]),
    match: roomRule[item.key] === myChecklist[item.key],
  })),
}));

const LABEL_TO_ENUM = {
  '유동적': 'FLEXIBLE',
  '고정적': 'FIXED',
  '주기적': 'REGULAR',
  '비주기적': 'IRREGULAR',
  '가능': 'ALLOWED',
  '불가능': 'NOT_ALLOWED',
  '가능+환기필수': 'ALLOWED_WITH_VENTILATION',
  '가능 · 환기 필수': 'ALLOWED_WITH_VENTILATION',
  '밝음': 'BRIGHT',
  '어두움': 'DARK',
  '심함': 'SEVERE',
  '중간': 'MODERATE',
  '약함': 'MILD',
  '약함~없음': 'MILD_OR_NONE',
  '약함 · 없음': 'MILD_OR_NONE',
  '아침': 'MORNING',
  '저녁': 'EVENING',
  '시간 지정': 'AFTER_TIME',
  '한명 잘 때 알아서': 'WHEN_ONE_SLEEPS',
  '한 명이 잘 때': 'WHEN_ONE_SLEEPS',
  '매주': 'WEEKLY',
  '2주': 'BIWEEKLY',
  '한달이상': 'MONTHLY_OR_MORE',
  '한 달 이상': 'MONTHLY_OR_MORE',
  '거의 안 감': 'RARELY',
  '연초': 'CIGARETTE',
  '흡연': 'CIGARETTE',
  '전자담배': 'E_CIGARETTE',
  '비흡연': 'NON_SMOKER',
  '대여·구매·보유': 'RENT_PURCHASE_OWN',
  '대여 · 구매 · 보유': 'RENT_PURCHASE_OWN',
  '협의 후 결정': 'DECIDE_AFTER_DISCUSSION',
  '필요 없음': 'NOT_NEEDED',
  '진동': 'VIBRATION',
  '소리': 'SOUND',
  '항상': 'ALWAYS',
  '많이 탐': 'VERY_SENSITIVE',
  '적게 탐': 'LESS_SENSITIVE',
  '기숙사 밖': 'OUTSIDE_DORM',
  '기숙사 안': 'INSIDE_DORM',
  '개별': 'INDIVIDUAL',
  '공유': 'SHARED',
};

const enumToLabel = (value) => CHECKLIST_VALUE_LABELS[value] || value || null;
const labelToEnum = (value) => LABEL_TO_ENUM[value] || value || null;

const parseHour = (value, fallback) => {
  const match = String(value || '').match(/\d{1,2}/);
  if (!match) return fallback;
  return Math.max(0, Math.min(23, Number(match[0])));
};

const parseRange = (value, fallback) => {
  const timeMatches = String(value || '').match(/\d{1,2}:\d{2}/g);
  if (timeMatches && timeMatches.length >= 2) {
    return {
      start: parseHour(timeMatches[0], fallback.start),
      end: parseHour(timeMatches[1], fallback.end),
    };
  }
  const matches = String(value || '').match(/\d{1,2}/g);
  if (!matches || matches.length < 2) return fallback;
  return {
    start: Math.max(0, Math.min(23, Number(matches[0]))),
    end: Math.max(0, Math.min(23, Number(matches[1]))),
  };
};

const fmtHour = (hour) => `${String(hour).padStart(2, '0')}:00`;
const fmtRange = (range) => `${fmtHour(range.start)}-${fmtHour(range.end)}`;

export const defaultRoomChecklistForm = {
  sleep: { start: 23, end: 1 },
  wake: { start: 7, end: 9 },
  dryer: null,
  homing: '유동적',
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
  silentMouse: '사용',
  hot: '중간',
  cold: '중간',
  study: '유동적',
  trash: '개별',
};

export function roomRuleToChecklistForm(rule = {}) {
  return {
    ...defaultRoomChecklistForm,
    sleep: parseRange(rule.bedtime, defaultRoomChecklistForm.sleep),
    wake: parseRange(rule.wakeUp, defaultRoomChecklistForm.wake),
    dryer: rule.hairDryer ? parseRange(rule.hairDryer, { start: 12, end: 19 }) : null,
    homing: enumToLabel(rule.returnHome) || defaultRoomChecklistForm.homing,
    cleaning: enumToLabel(rule.cleaning) || defaultRoomChecklistForm.cleaning,
    call: enumToLabel(rule.phoneCall) || defaultRoomChecklistForm.call,
    dim: enumToLabel(rule.sleepLight) || defaultRoomChecklistForm.dim,
    sleepHabit: enumToLabel(rule.sleepHabit) || defaultRoomChecklistForm.sleepHabit,
    snore: enumToLabel(rule.snoring) || defaultRoomChecklistForm.snore,
    shower: enumToLabel(rule.showerTime) || defaultRoomChecklistForm.shower,
    eating: enumToLabel(rule.eating)?.replaceAll(' · ', '+') || defaultRoomChecklistForm.eating,
    lightsOut: enumToLabel(rule.lightsOut) || defaultRoomChecklistForm.lightsOut,
    lightsOutHour: parseHour(rule.lightsOutTime, defaultRoomChecklistForm.lightsOutHour),
    visitHome: enumToLabel(rule.homeVisit) || defaultRoomChecklistForm.visitHome,
    smoke: enumToLabel(rule.smoking) || defaultRoomChecklistForm.smoke,
    fridge: enumToLabel(rule.refrigerator)?.replaceAll(' · ', '·') || defaultRoomChecklistForm.fridge,
    alarm: enumToLabel(rule.alarm) || defaultRoomChecklistForm.alarm,
    earphone: enumToLabel(rule.earphone) || defaultRoomChecklistForm.earphone,
    skinCare: enumToLabel(rule.keyskin) || defaultRoomChecklistForm.skinCare,
    hot: enumToLabel(rule.heat) || defaultRoomChecklistForm.hot,
    cold: enumToLabel(rule.cold) || defaultRoomChecklistForm.cold,
    study: enumToLabel(rule.study) || defaultRoomChecklistForm.study,
    trash: enumToLabel(rule.trashCan) || defaultRoomChecklistForm.trash,
  };
}

export function checklistFormToRoomRuleRequest(form, room) {
  return {
    bedtime: fmtRange(form.sleep),
    wakeUp: fmtRange(form.wake),
    returnHome: labelToEnum(form.homing),
    returnHomeTime: fmtHour(23),
    cleaning: labelToEnum(form.cleaning),
    phoneCall: labelToEnum(form.call),
    sleepLight: labelToEnum(form.dim),
    sleepHabit: labelToEnum(form.sleepHabit),
    snoring: labelToEnum(form.snore),
    showerTime: labelToEnum(form.shower),
    eating: labelToEnum(form.eating),
    lightsOut: labelToEnum(form.lightsOut),
    lightsOutTime: fmtHour(form.lightsOutHour),
    homeVisit: labelToEnum(form.visitHome),
    smoking: labelToEnum(form.smoke),
    refrigerator: labelToEnum(form.fridge),
    hairDryer: form.dryer ? fmtRange(form.dryer) : null,
    alarm: labelToEnum(form.alarm),
    earphone: labelToEnum(form.earphone),
    keyskin: labelToEnum(form.skinCare),
    heat: labelToEnum(form.hot),
    cold: labelToEnum(form.cold),
    study: labelToEnum(form.study),
    trashCan: labelToEnum(form.trash),
    otherNotes: null,
    roomType: room.roomType,
    capacity: room.capacity,
    residencePeriod: room.residencePeriod,
  };
}

export function createRoomDraftToRequest(draft, checklistForm = defaultRoomChecklistForm) {
  const roomType = ROOM_TYPE_BY_LABEL[draft.dorm] || draft.roomType || 'TYPE_2';
  const capacity = Number.parseInt(draft.roomSize || draft.capacity, 10) || 4;
  const rule = checklistFormToRoomRuleRequest(checklistForm, {
    roomType,
    capacity,
    residencePeriod: draft.residencePeriod || 'SEMESTER',
  });
  const { roomType: _roomType, capacity: _capacity, residencePeriod: _residencePeriod, ...ruleOnly } = rule;

  return {
    roomType,
    capacity,
    residencePeriod: draft.residencePeriod || 'SEMESTER',
    title: draft.title,
    notes: draft.notes || '',
    rule: ruleOnly,
  };
}

export const roommateToMember = (roommate) => ({
  id: roommate.roommateNo || roommate.userNo,
  userNo: roommate.userNo,
  name: roommate.nickname || roommate.name,
  realName: roommate.name,
  studentId: roommate.studentNo,
  dept: [roommate.major, roommate.grade ? `${roommate.grade}학년` : null].filter(Boolean).join(' '),
  role: roommate.roomRole === 'HOST' ? '방장' : '멤버',
  isMe: Boolean(roommate.isMe),
  confirmStatus: roommate.confirmStatus,
  checklist: [],
});
