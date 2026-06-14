import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Icon, TabBar, StatusBar, Avatar, MarqueeText, ClipText, goBack } from '../../../shared/components';
import { MemberCard } from '../../members';
import { CREATE_ROOM_DORMS, ROOM_SIZE_OPTIONS } from '../../checklist';
import { findRooms, likeRoom, unlikeRoom, loadLikedRooms, loadMyChecklist, loadRoomRule, loadRecommendedRooms, loadMyRoom } from '../../../shared/api/home';
import { getOrCreateDirectChatRoom, loadMyChatRooms } from '../../../shared/api/chat';
import { getCachedUserNo } from '../../../shared/api/auth';
import { loadApplications, loadMyRoommates } from '../../../shared/api/room';
import { normalizeRoom as normalizeBackendRoom, roommateToMember } from '../roomData';

// rooms.jsx — 방 찾기 (list), 방 상세 (detail w/ checklist), 내 방 (my room)

const ROOM_BOOKMARKS_KEY = 'dorumdorum:room-bookmarks';
const ROOM_DETAIL_CACHE_KEY = 'dorumdorum:room-detail';

function readRoomBookmarks() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(ROOM_BOOKMARKS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readCachedRoom(roomNo) {
  if (typeof window === 'undefined') return null;
  try {
    const room = JSON.parse(window.sessionStorage.getItem(ROOM_DETAIL_CACHE_KEY) || 'null');
    return String(room?.roomNo || room?.id) === String(roomNo) ? room : null;
  } catch {
    return null;
  }
}

// Shared full checklist for each room. Same field set the user fills in
// on the checklist edit screen, so the data shape is consistent everywhere.
export const ROOM_CHECKLIST_1 = [
  { cat: '생활 패턴', items: [
    { q: '취침', a: '23시 – 01시' },
    { q: '기상', a: '07시 – 09시' },
    { q: '귀가', a: '고정적' },
    { q: '청소', a: '주기적' },
    { q: '방에서 전화', a: '가능' },
    { q: '잠귀', a: '어두움' },
    { q: '잠버릇', a: '약함' },
    { q: '코골이', a: '약함~없음' },
    { q: '샤워시간', a: '저녁' },
    { q: '방에서 취식', a: '가능+환기필수' },
    { q: '소등', a: '23시 이후' },
    { q: '본가 주기', a: '2주' },
    { q: '흡연', a: '비흡연' },
    { q: '냉장고', a: '협의 후 결정' },
  ]},
  { cat: '추가 규칙', items: [
    { q: '드라이기 제한', a: '12–19시 사용 제한' },
    { q: '알람', a: '진동' },
    { q: '이어폰', a: '항상' },
    { q: '키스킨', a: '유동적' },
    { q: '무소음 마우스', a: '사용' },
    { q: '더위', a: '중간' },
    { q: '추위', a: '중간' },
    { q: '공부', a: '유동적' },
    { q: '쓰레기통', a: '개별' },
  ]},
];

export const ROOM_CHECKLIST_2 = [
  { cat: '생활 패턴', items: [
    { q: '취침', a: '24시 – 02시' },
    { q: '기상', a: '08시 – 10시' },
    { q: '귀가', a: '고정적' },
    { q: '청소', a: '주기적' },
    { q: '방에서 전화', a: '불가능' },
    { q: '잠귀', a: '어두움' },
    { q: '잠버릇', a: '약함' },
    { q: '코골이', a: '약함~없음' },
    { q: '샤워시간', a: '저녁' },
    { q: '방에서 취식', a: '불가능' },
    { q: '소등', a: '24시 이후' },
    { q: '본가 주기', a: '한달이상' },
    { q: '흡연', a: '비흡연' },
    { q: '냉장고', a: '대여·구매·보유' },
  ]},
  { cat: '추가 규칙', items: [
    { q: '드라이기 제한', a: '23–02시 사용 제한' },
    { q: '알람', a: '진동' },
    { q: '이어폰', a: '항상' },
    { q: '키스킨', a: '항상' },
    { q: '무소음 마우스', a: '사용' },
    { q: '더위', a: '적게 탐' },
    { q: '추위', a: '많이 탐' },
    { q: '공부', a: '기숙사 안' },
    { q: '쓰레기통', a: '개별' },
  ]},
];

export const ROOM_CHECKLIST_3 = [
  { cat: '생활 패턴', items: [
    { q: '취침', a: '23시 – 24시' },
    { q: '기상', a: '06시 – 07시' },
    { q: '귀가', a: '유동적' },
    { q: '청소', a: '주기적' },
    { q: '방에서 전화', a: '가능' },
    { q: '잠귀', a: '밝음' },
    { q: '잠버릇', a: '중간' },
    { q: '코골이', a: '약함~없음' },
    { q: '샤워시간', a: '아침' },
    { q: '방에서 취식', a: '가능+환기필수' },
    { q: '소등', a: '한명 잘 때 알아서' },
    { q: '본가 주기', a: '매주' },
    { q: '흡연', a: '비흡연' },
    { q: '냉장고', a: '필요 없음' },
  ]},
  { cat: '추가 규칙', items: [
    { q: '드라이기 제한', a: '00–06시 사용 제한' },
    { q: '알람', a: '소리' },
    { q: '이어폰', a: '유동적' },
    { q: '키스킨', a: '유동적' },
    { q: '무소음 마우스', a: '사용' },
    { q: '더위', a: '많이 탐' },
    { q: '추위', a: '적게 탐' },
    { q: '공부', a: '기숙사 밖' },
    { q: '쓰레기통', a: '공유' },
  ]},
];

export const ROOM_CHECKLIST_4 = [
  { cat: '생활 패턴', items: [
    { q: '취침', a: '01시 – 03시' },
    { q: '기상', a: '09시 – 11시' },
    { q: '귀가', a: '유동적' },
    { q: '청소', a: '비주기적' },
    { q: '방에서 전화', a: '가능' },
    { q: '잠귀', a: '어두움' },
    { q: '잠버릇', a: '약함' },
    { q: '코골이', a: '중간' },
    { q: '샤워시간', a: '저녁' },
    { q: '방에서 취식', a: '가능' },
    { q: '소등', a: '한명 잘 때 알아서' },
    { q: '본가 주기', a: '거의 안 감' },
    { q: '흡연', a: '전자담배' },
    { q: '냉장고', a: '대여·구매·보유' },
  ]},
  { cat: '추가 규칙', items: [
    { q: '드라이기 제한', a: '제한 없음' },
    { q: '알람', a: '소리' },
    { q: '이어폰', a: '유동적' },
    { q: '키스킨', a: '유동적' },
    { q: '무소음 마우스', a: '사용' },
    { q: '더위', a: '중간' },
    { q: '추위', a: '중간' },
    { q: '공부', a: '기숙사 안' },
    { q: '쓰레기통', a: '공유' },
  ]},
];

const RESIDENCE_PERIOD_OPTIONS = [
  { key: '전체', label: '전체' },
  { key: 'SEMESTER', label: '학기(16주)' },
  { key: 'HALF_YEAR', label: '반기(24주)' },
  { key: 'SEASONAL', label: '계절학기' },
];

export const residencePeriodLabel = (period) => {
  const found = RESIDENCE_PERIOD_OPTIONS.find(o => o.key === period);
  return found ? found.label : period || '';
};

const roomTypeLabel = (roomType) => {
  const found = ROOM_TYPE_OPTIONS.find(o => o.key === roomType);
  return found ? found.label : roomType || '';
};

export const ROOMS = [
  {
    id: 1, title: '아침형 룸메 구해요', dorm: '2생활관', size: '4인실',
    members: 2, capacity: 4, recruiting: true, host: { name: '민지' },
    matchLabel: '잘 맞아요', recommended: true, residencePeriod: 'SEMESTER',
    checklist: ROOM_CHECKLIST_1,
  },
  {
    id: 2, title: '조용히 공부할 사람만! 시험기간 새벽까지 집중하시는 분', dorm: '3생활관', size: '2인실',
    members: 1, capacity: 2, recruiting: true, host: { name: '수민' },
    matchLabel: '잘 맞아요', residencePeriod: 'HALF_YEAR',
    checklist: ROOM_CHECKLIST_2,
  },
  {
    id: 3, title: '같이 운동하실 분', dorm: '1생활관', size: '2인실',
    members: 1, capacity: 2, recruiting: true, host: { name: '진우' },
    matchLabel: '괜찮아요', residencePeriod: 'SEMESTER',
    checklist: ROOM_CHECKLIST_3,
  },
  {
    id: 4, title: '느긋한 생활 좋아요', dorm: '메디컬', size: '3인실',
    members: 3, capacity: 3, recruiting: false, host: { name: '예린' },
    matchLabel: '괜찮아요', residencePeriod: 'SEASONAL',
    checklist: ROOM_CHECKLIST_4,
  },
];

const CHECKLIST_VALUE_LABELS = {
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

const checklistValueLabel = (value) => CHECKLIST_VALUE_LABELS[value] || value || '-';

const CHECKLIST_SECTIONS = [
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
  ]},
  { cat: '추가 규칙', items: [
    { key: 'hairDryer', q: '드라이기 제한' },
    { key: 'alarm', q: '알람' },
    { key: 'earphone', q: '이어폰' },
    { key: 'keyskin', q: '키스킨' },
    { key: 'heat', q: '더위' },
    { key: 'cold', q: '추위' },
    { key: 'study', q: '공부' },
    { key: 'trashCan', q: '쓰레기통' },
  ]},
];

const roomRuleToChecklist = (rule) => CHECKLIST_SECTIONS.map((section) => ({
  cat: section.cat,
  items: section.items.map((item) => ({ q: item.q, a: checklistValueLabel(rule[item.key]) })),
}));

const compareChecklists = (roomRule, myChecklist) => CHECKLIST_SECTIONS.map((section) => ({
  cat: section.cat,
  items: section.items.map((item) => ({
    q: item.q,
    room: checklistValueLabel(roomRule[item.key]),
    mine: checklistValueLabel(myChecklist[item.key]),
    match: roomRule[item.key] === myChecklist[item.key],
  })),
}));

export function RoomCard({ room, bookmarked = false, onToggleBookmark }) {
  const [open, setOpen] = React.useState(false);
  const [checklist, setChecklist] = React.useState(room.checklist || []);
  const [checklistLoading, setChecklistLoading] = React.useState(false);
  const [checklistError, setChecklistError] = React.useState(false);
  const navigate = useNavigate();
  const roomMeta = [room.dorm, room.size, residencePeriodLabel(room.residencePeriod)].filter(Boolean).join(' · ');

  const toggleChecklist = () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (checklist.length > 0 || checklistLoading) return;

    setChecklistLoading(true);
    setChecklistError(false);
    loadRoomRule(room.roomNo || room.id)
      .then((rule) => setChecklist(roomRuleToChecklist(rule)))
      .catch(() => setChecklistError(true))
      .finally(() => setChecklistLoading(false));
  };

  const openRoomDetail = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ROOM_DETAIL_CACHE_KEY, JSON.stringify(room));
    }
    navigate(`/rooms/${room.roomNo || room.id}`, { state: { closed: room.recruiting === false, room } });
  };

  return (
    <div
      className="card"
      onClick={openRoomDetail}
      style={{ padding: 16, marginBottom: 10, transition: 'box-shadow .2s', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4, minWidth: 0 }}>
            <MarqueeText>{room.title}</MarqueeText>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{roomMeta}</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: room.recruiting === false ? 'var(--ink-3)' : 'var(--brand-deep)', background: room.recruiting === false ? 'var(--surface-2)' : 'var(--brand-soft)', borderRadius: 999, padding: '3px 7px' }}>
              {room.recruiting === false ? '마감됨' : '모집중'}
            </span>
          </div>
        </div>
        <button
          type="button"
          aria-label={bookmarked ? '북마크 해제' : '북마크 추가'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark?.(room.id);
          }}
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            border: 0,
            background: bookmarked ? 'var(--brand-soft)' : 'var(--surface-2)',
            color: bookmarked ? 'var(--brand)' : 'var(--ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'}>
            <path d="M19 7v14l-7-4-7 4V7a3 3 0 013-3h8a3 3 0 013 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={room.host.name} size={28}/>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>방장 · <b>{room.host.name}</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: room.capacity }).map((_, i) => (
              <div key={i} style={{
                width: 9, height: 9, borderRadius: 3,
                background: i < room.members ? 'var(--brand)' : 'var(--line-2)',
              }}/>
            ))}
          </div>
          <span style={{ color: 'var(--ink-2)' }}>{room.members}<span style={{ color: 'var(--ink-3)' }}>/{room.capacity}명</span></span>
        </div>
      </div>

      {/* Expandable checklist — grid-rows trick for smooth slide */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows .32s cubic-bezier(.2,.7,.2,1)',
        marginTop: open ? 12 : 0,
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {checklistLoading && (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>체크리스트를 불러오는 중...</div>
            )}
            {checklistError && (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>체크리스트를 불러오지 못했어요.</div>
            )}
            {!checklistLoading && !checklistError && checklist.map((cat, ci) => (
              <React.Fragment key={ci}>
                {/* Category header bar */}
                <div style={{
                  background: 'var(--surface-2)',
                  padding: '8px 14px',
                  fontSize: 12, fontWeight: 700,
                  color: 'var(--ink-2)',
                  letterSpacing: '-0.1px',
                }}>{cat.cat}</div>
                {/* Item rows */}
                {cat.items.map((it, ii) => (
                  <div key={ii} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderBottom: ii === cat.items.length - 1 ? 'none' : '1px solid var(--line)',
                    fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--ink-2)' }}>{it.q}</span>
                    <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{it.a}</span>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleChecklist();
        }}
        style={{
          width: '100%', marginTop: 10,
          background: 'transparent', border: 0, padding: '6px 0',
          fontSize: 13, fontWeight: 600, color: 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          cursor: 'pointer',
        }}>
        {open ? '접기' : '자세히 보기'}
        <span style={{ display: 'inline-flex', transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .25s' }}>
          <Icon.chevron size={14}/>
        </span>
      </button>
    </div>
  );
}

function FilterDropdown({ label, value, setValue, options, display }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const isAll = value === '전체';

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        width: '100%', height: 40, padding: '0 12px', borderRadius: 10,
        border: isAll ? '1px solid var(--line-2)' : '1.5px solid var(--brand)',
        background: isAll ? 'var(--surface)' : 'var(--brand-soft)',
        color: isAll ? 'var(--ink-2)' : 'var(--brand-deep)',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        <span>{isAll ? label : display(value)}</span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: 'var(--surface)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid var(--line)', zIndex: 100, minWidth: '100%', overflow: 'hidden' }}>
          {options.map(opt => {
          const val = typeof opt === 'object' && opt !== null ? opt.key : opt;
            const lbl = display(val);
            const active = value === val;
            return (
              <div key={val} onClick={() => { setValue(val); setOpen(false); }} style={{
                padding: '10px 14px', fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? 'var(--brand)' : 'var(--ink)', cursor: 'pointer',
                background: active ? 'var(--brand-soft)' : 'transparent',
              }}>{lbl}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ROOM_TYPE_OPTIONS = [
  { key: '전체', label: '생활관' },
  { key: 'TYPE_1', label: '1생활관' },
  { key: 'TYPE_2', label: '2생활관' },
  { key: 'TYPE_3', label: '3생활관' },
  { key: 'TYPE_MEDICAL', label: '메디컬' },
];

const ROOM_TYPE_CAPACITIES = {
  TYPE_1: [1, 2, 3],
  TYPE_2: [1, 2, 4],
  TYPE_3: [2, 4],
  TYPE_MEDICAL: [1, 2, 3, 4],
};

const ALL_CAPACITIES = [1, 2, 3, 4];

const CHECKLIST_FILTER_LABELS = {
  returnHome: '귀가', cleaning: '청소', phoneCall: '방에서 전화',
  sleepLight: '잠귀', sleepHabit: '잠버릇', snoring: '코골이',
  showerTime: '샤워시간', eating: '방에서 취식', lightsOut: '소등',
  homeVisit: '본가 주기', smoking: '흡연', refrigerator: '냉장고',
  alarm: '알람', earphone: '이어폰', keyskin: '키스킨',
  heat: '더위', cold: '추위', study: '공부', trashCan: '쓰레기통',
  bedtime: '취침', wakeUp: '기상', hairDryer: '드라이기',
};

const ENUM_LABELS = {
  FLEXIBLE: '유동적', FIXED: '고정적', REGULAR: '주기적', IRREGULAR: '비주기적',
  ALLOWED: '가능', NOT_ALLOWED: '불가능', ALLOWED_WITH_VENTILATION: '환기필수',
  BRIGHT: '밝음', DARK: '어두움', SEVERE: '심함', MODERATE: '중간',
  MILD: '약함', MILD_OR_NONE: '약함~없음', MORNING: '아침', EVENING: '저녁',
  AFTER_TIME: '시간 지정', WHEN_ONE_SLEEPS: '한명 잘 때',
  WEEKLY: '매주', BIWEEKLY: '2주', MONTHLY_OR_MORE: '한달이상',
  NON_SMOKER: '비흡연만', RENT_PURCHASE_OWN: '대여·구매·보유',
  DECIDE_AFTER_DISCUSSION: '협의 후 결정', NOT_NEEDED: '필요 없음',
  VIBRATION: '진동', SOUND: '소리', ALWAYS: '항상',
  VERY_SENSITIVE: '많이 탐', LESS_SENSITIVE: '적게 탐',
  OUTSIDE_DORM: '기숙사 밖', INSIDE_DORM: '기숙사 안',
  INDIVIDUAL: '개별', SHARED: '공유',
};

const toSortType = (sortBy) => sortBy === 'openSeats' ? 'REMAINING' : 'LATEST';

const appendUniqueRooms = (currentRooms, nextRooms) => {
  const roomsByNo = new Map(currentRooms.map((room) => [room.roomNo, room]));
  nextRooms.forEach((room) => roomsByNo.set(room.roomNo, room));
  return Array.from(roomsByNo.values());
};

const normalizeRoom = (r) => ({
  id: r.roomNo,
  roomNo: r.roomNo,
  title: r.title,
  dorm: roomTypeLabel(r.roomType),
  size: `${r.capacity}인실`,
  members: r.currentMateCount,
  capacity: r.capacity,
  remaining: r.remaining,
  recruiting: r.roomStatus !== 'COMPLETED',
  host: { name: r.hostNickname, major: r.hostMajor, studentYear: r.hostStudentYear },
  residencePeriod: r.residencePeriod,
  notes: r.notes ?? null,
  checklist: [],
});

export function FindRoomScreen({ activeTab='find' }) {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [checklistFilter] = React.useState(() => state?.checklistFilter || {});
  const [sortBy, setSortBy] = React.useState('latest');
  const [roomTypeFilter, setRoomTypeFilter] = React.useState('전체');
  const [capacityFilter, setCapacityFilter] = React.useState('전체');
  const [periodFilter, setPeriodFilter] = React.useState('전체');
  const [rooms, setRooms] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState(null);
  const [hasNext, setHasNext] = React.useState(false);
  const [totalCount, setTotalCount] = React.useState(null);
  const [bookmarkedIds, setBookmarkedIds] = React.useState(new Set());
  const [recommendedCount, setRecommendedCount] = React.useState(null);
  const loadMoreRef = React.useRef(null);
  const searchVersionRef = React.useRef(0);

  const sortOptions = [
    { key: 'latest', label: '최신순' },
    { key: 'openSeats', label: '남은 자리순' },
  ];

  const capacityOptions = ['전체', ...(ROOM_TYPE_CAPACITIES[roomTypeFilter] || ALL_CAPACITIES)];

  React.useEffect(() => {
    if (!capacityOptions.includes(capacityFilter)) {
      setCapacityFilter('전체');
    }
  }, [capacityFilter, roomTypeFilter]);

  React.useEffect(() => {
    loadLikedRooms()
      .then((response) => {
        const list = Array.isArray(response) ? response : response?.items;
        if (Array.isArray(list)) {
          setBookmarkedIds(new Set(list.map((r) => r.roomNo)));
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    loadRecommendedRooms()
      .then((res) => setRecommendedCount(res.hasChecklist ? res.items.length : -1))
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    let mounted = true;
    searchVersionRef.current += 1;
    setLoading(true);
    setLoadingMore(false);
    setRooms([]);
    setNextCursor(null);
    setHasNext(false);
    setTotalCount(null);
    findRooms({
      ...checklistFilter,
      sortType: toSortType(sortBy),
      roomType: roomTypeFilter === '전체' ? null : roomTypeFilter,
      capacity: capacityFilter === '전체' ? null : capacityFilter,
      residencePeriod: periodFilter === '전체' ? null : periodFilter,
    })
      .then((res) => {
        if (!mounted) return;
        if (!Array.isArray(res?.items)) {
          throw new TypeError('Room search response must contain an items array');
        }
        setRooms(res.items.map(normalizeRoom));
        setNextCursor(res.nextCursor || null);
        setHasNext(Boolean(res.hasNext && res.nextCursor));
        setTotalCount(Number.isInteger(res.totalCount) ? res.totalCount : null);
      })
      .catch((error) => {
        console.error('Failed to load rooms', error);
        if (mounted) setRooms([]);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [capacityFilter, sortBy, roomTypeFilter, periodFilter]);

  React.useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || loading || loadingMore || !hasNext || !nextCursor) return undefined;

    let requested = false;
    const searchVersion = searchVersionRef.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || requested) return;
      requested = true;
      setLoadingMore(true);
      findRooms({
        ...checklistFilter,
        sortType: toSortType(sortBy),
        roomType: roomTypeFilter === '전체' ? null : roomTypeFilter,
        capacity: capacityFilter === '전체' ? null : capacityFilter,
        residencePeriod: periodFilter === '전체' ? null : periodFilter,
        cursor: nextCursor,
      })
        .then((res) => {
          if (searchVersionRef.current !== searchVersion) return;
          if (!Array.isArray(res?.items)) {
            throw new TypeError('Room search response must contain an items array');
          }
          setRooms((currentRooms) => appendUniqueRooms(currentRooms, res.items.map(normalizeRoom)));
          setNextCursor(res.nextCursor || null);
          setHasNext(Boolean(res.hasNext && res.nextCursor));
        })
        .catch((error) => {
          console.error('Failed to load more rooms', error);
        })
        .finally(() => {
          setLoadingMore(false);
        });
    }, { rootMargin: '160px 0px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [capacityFilter, hasNext, loading, loadingMore, nextCursor, periodFilter, roomTypeFilter, sortBy]);

  const toggleRoomBookmark = (roomNo) => {
    const isBookmarked = bookmarkedIds.has(roomNo);
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      isBookmarked ? next.delete(roomNo) : next.add(roomNo);
      return next;
    });
    (isBookmarked ? unlikeRoom(roomNo) : likeRoom(roomNo)).catch(() => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        isBookmarked ? next.add(roomNo) : next.delete(roomNo);
        return next;
      });
    });
  };

  return (
    <div className="screen">
      <div className="scroll">
        <StatusBar />
        <div className="topbar">
          <div className="brand">방 찾기</div>
          <button onClick={() => navigate('/notifications')} aria-label="알림" style={{ background: 'transparent', border: 0, color: 'var(--ink)', padding: 6, display: 'flex', cursor: 'pointer' }}>
            <Icon.bell size={22}/>
          </button>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', borderRadius: 14, padding: '12px 14px' }}>
            <Icon.search size={20} weight={1.8}/>
            <input type="text" placeholder="방 제목, 방장 닉네임으로 검색" style={{ flex: 1, border: 0, outline: 0, background: 'transparent', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', minWidth: 0 }} />
            <button onClick={() => navigate('/rooms/find/filter', { state: { checklistFilter } })} aria-label="체크리스트로 찾기" style={{ background: 'transparent', border: 0, color: 'var(--ink-2)', padding: 0, display: 'flex', cursor: 'pointer' }}><Icon.filter/></button>
          </div>
        </div>

        <div style={{ padding: '0 16px 6px', display: 'flex', gap: 8 }}>
          {[
            { label: '생활관', value: roomTypeFilter, setValue: setRoomTypeFilter, options: ROOM_TYPE_OPTIONS.map(o => o.key), display: v => ROOM_TYPE_OPTIONS.find(o => o.key === v)?.label || v },
            { label: '수용인원', value: capacityFilter, setValue: setCapacityFilter, options: capacityOptions, display: v => v === '전체' ? '수용인원' : `${v}명` },
            { label: '거주기간', value: periodFilter, setValue: setPeriodFilter, options: RESIDENCE_PERIOD_OPTIONS.map(o => o.key), display: v => v === '전체' ? '거주기간' : residencePeriodLabel(v) },
          ].map(group => (
            <FilterDropdown key={group.label} {...group} />
          ))}
        </div>

        {Object.keys(checklistFilter).length > 0 && (
          <div style={{ padding: '0 16px 8px', display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <button onClick={() => navigate('/rooms/find/filter', { state: { checklistFilter } })} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 999, border: '1.5px solid var(--brand)', background: 'var(--brand-soft)', color: 'var(--brand-deep)', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
              <Icon.filter size={12}/> 필터 수정
            </button>
            {Object.entries(checklistFilter).map(([key, value]) => (
              <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '5px 10px', borderRadius: 999, background: 'var(--ink)', color: 'white', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span style={{ opacity: 0.6 }}>{CHECKLIST_FILTER_LABELS[key]}</span>
                <span>{ENUM_LABELS[value] || value}</span>
              </span>
            ))}
          </div>
        )}

        <div style={{ padding: '8px 16px 16px' }}>
          {/* Match summary banner */}
          <div onClick={() => navigate('/rooms/find/recommended')} style={{ background: 'var(--brand-soft)', borderRadius: 14, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.check size={18} weight={2.6}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand-deep)' }}>
                {recommendedCount === null ? '나와 잘 맞는 방 확인하기' : recommendedCount === -1 ? '체크리스트를 작성하면 추천해드려요' : `나와 잘 맞는 방 ${recommendedCount}곳`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--brand-deep)', opacity: 0.75, marginTop: 2 }}>내 체크리스트 기반으로 추천했어요</div>
            </div>
            <Icon.chevron size={16}/>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '4px 4px 10px' }}>
            <span style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>
              {loading
                ? '불러오는 중...'
                : `모집중 ${totalCount ?? rooms.length}개${totalCount == null && hasNext ? ' 이상' : ''}`}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {sortOptions.map(option => {
                const active = sortBy === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key)}
                    style={{ border: 0, borderRadius: 999, padding: '7px 10px', background: active ? 'var(--ink)' : 'var(--surface)', color: active ? 'white' : 'var(--ink-2)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {rooms.length > 0 ? rooms.map(r => (
            <RoomCard key={r.roomNo} room={r} bookmarked={bookmarkedIds.has(r.roomNo)} onToggleBookmark={toggleRoomBookmark} />
          )) : (!loading && (
            <div className="card" style={{ padding: 22, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14, fontWeight: 600 }}>
              선택한 조건에 맞는 모집중 방이 없어요.
            </div>
          ))}
          <div ref={loadMoreRef} style={{ minHeight: 24, padding: loadingMore ? '8px 0' : 0, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12, fontWeight: 600 }}>
            {loadingMore ? '더 불러오는 중...' : ''}
          </div>
          <div style={{ height: 12 }}/>
        </div>
      </div>

      {/* FAB */}
      <button onClick={() => navigate('/rooms/create/1')} style={{
        position: 'absolute', bottom: 96, right: 18, zIndex: 5,
        height: 52, padding: '0 18px', borderRadius: 26, border: 0,
        background: 'var(--ink)', color: 'white', fontWeight: 600, fontSize: 14,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        cursor: 'pointer',
      }}>
        <Icon.plus size={18}/> 모집방 만들기
      </button>

      <TabBar active={activeTab} />
    </div>
  );
}

// ── Room detail with checklist comparison ───────────────────
// Compares room's representative checklist (방) vs my checklist (나).
export const CHECKLIST = [
  { cat: '생활 패턴', items: [
    { q: '취침', room: '23시 – 01시', mine: '23시 – 01시', match: true },
    { q: '기상', room: '07시 – 09시', mine: '07시 – 08시', match: true },
    { q: '귀가', room: '고정적', mine: '고정적', match: true },
    { q: '청소', room: '주기적', mine: '주기적', match: true },
    { q: '방에서 전화', room: '가능', mine: '가능', match: true },
    { q: '잠귀', room: '어두움', mine: '어두움', match: true },
    { q: '잠버릇', room: '약함', mine: '약함', match: true },
    { q: '코골이', room: '약함~없음', mine: '약함~없음', match: true },
    { q: '샤워시간', room: '저녁', mine: '아침', match: false },
    { q: '방에서 취식', room: '가능+환기필수', mine: '가능+환기필수', match: true },
    { q: '소등', room: '23시 이후', mine: '23시 이후', match: true },
    { q: '본가 주기', room: '2주', mine: '매주', match: false },
    { q: '흡연', room: '비흡연', mine: '비흡연', match: true },
    { q: '냉장고', room: '협의 후 결정', mine: '협의 후 결정', match: true },
  ]},
  { cat: '추가 규칙', items: [
    { q: '드라이기 제한', room: '12–19시 사용 제한', mine: '12–19시 사용 제한', match: true },
    { q: '알람', room: '진동', mine: '진동', match: true },
    { q: '이어폰', room: '항상', mine: '항상', match: true },
    { q: '키스킨', room: '유동적', mine: '유동적', match: true },
    { q: '무소음 마우스', room: '사용', mine: '사용', match: true },
    { q: '더위', room: '중간', mine: '중간', match: true },
    { q: '추위', room: '중간', mine: '적게 탐', match: false },
    { q: '공부', room: '유동적', mine: '유동적', match: true },
    { q: '쓰레기통', room: '개별', mine: '개별', match: true },
  ]},
];

export function RoomDetailScreen() {
  const navigate = useNavigate();
  const { id = '1' } = useParams();
  const { state } = useLocation();
  const room = state?.room || readCachedRoom(id) || ROOMS.find((item) => String(item.id) === String(id));
  const isClosed = state?.closed ?? room?.recruiting === false;
  const isApplied = state?.appliedStatus === 'waiting';
  const isAccepted = state?.appliedStatus === 'accepted';

  const [bookmarked, setBookmarked] = React.useState(false);
  const [checklist, setChecklist] = React.useState([]);
  const [checklistLoading, setChecklistLoading] = React.useState(true);
  const [checklistError, setChecklistError] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setChecklistLoading(true);
    setChecklistError(false);
    Promise.all([loadRoomRule(id), loadMyChecklist()])
      .then(([roomRule, myChecklist]) => {
        if (mounted) setChecklist(compareChecklists(roomRule, myChecklist));
      })
      .catch(() => {
        if (mounted) setChecklistError(true);
      })
      .finally(() => {
        if (mounted) setChecklistLoading(false);
      });
    return () => { mounted = false; };
  }, [id]);

  const hostName = room?.host?.name || '방장';
  const hostMajor = room?.host?.major?.replace(/학과$/, '');
  const hostProfile = [hostMajor, room?.host?.studentYear].filter(Boolean).join(' ');
  const roomMeta = room
    ? [room.dorm, room.size, residencePeriodLabel(room.residencePeriod)].filter(Boolean).join(' · ')
    : '';
  const currentMateCount = room?.members || 0;
  const roomCapacity = room?.capacity || 0;
  const members = Array.from({ length: roomCapacity }, (_, index) => {
    if (index === 0 && currentMateCount > 0) {
      return { name: hostName, label: '방장' };
    }
    if (index < currentMateCount) {
      return { name: '멤버', label: '멤버' };
    }
    return { name: '?', label: '모집중', empty: true };
  });

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/find')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back/></button>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>모집방 상세</div>
        <button onClick={() => setBookmarked(b => !b)} style={{ background: 'transparent', border: 0, padding: 8, color: bookmarked ? 'var(--brand)' : 'var(--ink)', cursor: 'pointer' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={bookmarked ? 'currentColor' : 'none'}>
            <path d="M19 7v14l-7-4-7 4V7a3 3 0 013-3h8a3 3 0 013 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="scroll">
        {/* Header */}
        <div style={{ padding: '8px 20px 16px' }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.3, fontFamily: 'var(--font-sans)' }}>{room?.title || '모집방 상세'}</h1>
          {roomMeta && <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>{roomMeta}</div>}
        </div>

        {/* Match summary — derived from checklist comparison */}
        {(() => {
          if (checklistLoading || checklistError || checklist.length === 0) return null;
          const allItems = checklist.flatMap(cat => cat.items);
          const filledItems = allItems.filter(it => it.mine !== '-');

          if (filledItems.length === 0) {
            return (
              <div style={{ margin: '0 16px 16px' }}>
                <div className="card" onClick={() => navigate('/checklist')} style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, background: 'var(--brand-soft)', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon.clipboard size={20}/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand-deep)' }}>내 체크리스트를 작성해보세요</div>
                    <div style={{ fontSize: 12, color: 'var(--brand-deep)', opacity: 0.75, marginTop: 3 }}>작성하면 이 방과 얼마나 맞는지 알 수 있어요</div>
                  </div>
                  <Icon.chevron size={14} style={{ color: 'var(--brand-deep)' }}/>
                </div>
              </div>
            );
          }

          const matchedCount = filledItems.filter(it => it.match).length;
          const totalCount = filledItems.length;
          const matchScore = matchedCount / totalCount;
          const matchLabel = matchScore >= 0.85 ? '잘 맞아요' : matchScore >= 0.65 ? '괜찮아요' : null;
          if (!matchLabel) return null;
          const isStrong = matchLabel === '잘 맞아요';
          const accent = isStrong ? 'var(--brand)' : '#F59E0B';
          const accentSoft = isStrong ? 'var(--brand-soft)' : '#FEF3C7';
          const accentDeep = isStrong ? 'var(--brand-deep)' : '#92400E';
          const highlights = filledItems.filter(it => it.match).slice(0, 3).map(it => `${it.q} ${it.room}`).join(' · ');
          return (
            <div style={{ margin: '0 16px 16px' }}>
              <div className="card" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, background: accentSoft }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: accent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon.check size={22} weight={2.6}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: accentDeep }}>나와 {matchLabel} 방이에요</div>
                  <div style={{ fontSize: 12, color: accentDeep, opacity: 0.75, marginTop: 3 }}>{highlights}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: accentDeep }}>{matchedCount}<span style={{ fontSize: 11, fontWeight: 500 }}>/{totalCount}</span></div>
              </div>
            </div>
          );
        })()}

        {/* Host card */}
        <div style={{ margin: '0 16px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
            <Avatar name={hostName} size={52} style={{ fontSize: 20 }}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{hostName}</span>
                <span className="chip line" style={{ fontSize: 10, padding: '2px 6px' }}>방장</span>
              </div>
              {hostProfile && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{hostProfile}</div>}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="h-section"><h2>현재 멤버 {currentMateCount}/{roomCapacity}</h2></div>
        <div style={{ padding: '0 16px', display: 'flex', gap: 8 }}>
          {members.map((m, i) => (
            <div key={i} className="card" style={{ flex: 1, padding: 12, textAlign: 'center', border: m.empty ? '1px dashed var(--line-2)' : 'none', background: m.empty ? 'transparent' : 'var(--surface)' }}>
              {m.empty ? (
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px dashed var(--line-2)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)' }}><Icon.plus size={18}/></div>
              ) : (
                <Avatar name={m.name} size={40} style={{ fontSize: 16 }}/>
              )}
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6, fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Checklist comparison */}
        <div className="h-section">
          <h2>체크리스트 비교</h2>
        </div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 84px 84px 24px', alignItems: 'center', padding: '12px 14px', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.3px' }}>
            <span/>
            <span style={{ textAlign: 'center' }}>방 체크리스트</span>
            <span style={{ textAlign: 'center' }}>내 체크리스트</span>
            <span/>
          </div>
          {checklistLoading && (
            <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>체크리스트를 비교하는 중...</div>
          )}
          {checklistError && (
            <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>체크리스트를 불러오지 못했어요.</div>
          )}
          {!checklistLoading && !checklistError && checklist.map((cat) => (
            <div key={cat.cat}>
              <div style={{ padding: '8px 14px 6px', fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', letterSpacing: '0.2px', background: 'var(--surface-2)' }}>{cat.cat}</div>
              {cat.items.map((it, ii) => (
                <div key={ii} style={{ display: 'grid', gridTemplateColumns: '1fr 84px 84px 24px', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--line)', fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-2)' }}>{it.q}</span>
                  <span style={{ textAlign: 'center', fontWeight: 600 }}>{it.room}</span>
                  <span style={{ textAlign: 'center', fontWeight: 600, color: it.match ? 'var(--ink)' : 'var(--ink-3)' }}>{it.mine}</span>
                  <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {it.match ? (
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon.check size={12} weight={3}/></span>
                    ) : (
                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>−</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* About */}
        {room?.notes && (
          <>
            <div className="h-section"><h2>방장의 한마디</h2></div>
            <div style={{ margin: '0 16px 24px' }}>
              <div className="card" style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                {room.notes}
              </div>
            </div>
          </>
        )}

        <div style={{ height: isAccepted ? 24 : 110 }}/>
      </div>

      {/* Sticky CTA */}
      {!isAccepted && (
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'linear-gradient(180deg, transparent 0%, var(--bg) 30%)', display: 'flex', gap: 8 }}>
        <button
          onClick={() => {
            const myNo = getCachedUserNo();
            if (!myNo) { navigate('/login'); return; }
            getOrCreateDirectChatRoom(id, myNo)
              .then((chatRoomNo) => navigate('/chat/dm/' + chatRoomNo))
              .catch((e) => alert(e?.message || '채팅방을 열 수 없어요.'));
          }}
          className="btn ghost"
          style={{ width: 52, height: 52, borderRadius: 14, padding: 0 }}
        >
          <Icon.chat size={22}/>
        </button>
        {isClosed ? (
          <button disabled className="btn full" style={{ flex: 1, height: 52, background: 'var(--surface-2)', color: 'var(--ink-4)', cursor: 'not-allowed' }}>마감됨</button>
        ) : isApplied ? (
          <button disabled className="btn full" style={{ flex: 1, height: 52, background: 'var(--surface-2)', color: 'var(--ink-4)', cursor: 'not-allowed' }}>대기 중</button>
        ) : (
          <button onClick={() => navigate(`/rooms/${id}/apply`)} className="btn full" style={{ flex: 1, height: 52 }}>입주 신청하기</button>
        )}
      </div>
      )}
    </div>
  );
}

// ── My Room screen ──────────────────────────────────────────
export function MyRoomScreen({ activeTab='myroom' }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [room, setRoom] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [applicantCount, setApplicantCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [groupChatRoomNo, setGroupChatRoomNo] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    Promise.all([
      loadMyRoom(),
      loadMyRoommates().catch(() => []),
      loadMyChatRooms().catch(() => []),
    ])
      .then(([roomData, roommateList, chatRooms]) => {
        if (!mounted) return;
        if (!roomData?.roomNo) {
          setRoom(null);
          setMembers([]);
          setApplicantCount(0);
          setGroupChatRoomNo(null);
          return;
        }
        const normalized = normalizeBackendRoom(roomData);
        const mappedMembers = Array.isArray(roommateList) ? roommateList.map(roommateToMember) : [];
        const myMember = mappedMembers.find((member) => member.isMe);
        setRoom(normalized);
        setMembers(mappedMembers);
        const chatList = Array.isArray(chatRooms) ? chatRooms : chatRooms?.items || [];
        const found = chatList.find(
          (chatRoom) => chatRoom.chatRoomType === 'GROUP' && String(chatRoom.roomNo) === String(roomData.roomNo),
        );
        setGroupChatRoomNo(found?.chatRoomNo || null);
        if (myMember?.role === '방장') {
          return loadApplications(roomData.roomNo)
            .then((applications) => { if (mounted) setApplicantCount(Array.isArray(applications) ? applications.length : 0); })
            .catch(() => { if (mounted) setApplicantCount(0); });
        }
        setApplicantCount(0);
      })
      .catch((e) => {
        if (!mounted) return;
        if (e?.status === 404 || e?.code === 'ROOM003') {
          setRoom(null);
          setMembers([]);
          setApplicantCount(0);
          setGroupChatRoomNo(null);
          return;
        }
        setError('내 방 정보를 불러오지 못했어요.');
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const isHost = members.find((member) => member.isMe)?.role === '방장';
  const currentMembers = room?.members ?? members.length;
  const roomCapacity = room?.capacity ?? 0;
  const isRecruiting = room?.recruiting ?? false;
  const canLeaveRoom = !isHost || currentMembers <= 1;
  const openSeats = Math.max(0, roomCapacity - currentMembers);
  const isRoomFull = currentMembers >= roomCapacity;

  const leaveRoom = () => {
    if (!canLeaveRoom) return;
    setMenuOpen(false);
    navigate('/rooms/find');
  };

	  return (
	    <div className="screen">
	      <div className="scroll">
	        <StatusBar />
	        <div className="topbar">
	          <div className="brand">내 방</div>
	          <button onClick={() => room && setMenuOpen(true)} aria-label="방 관리 메뉴" style={{ background: 'transparent', border: 0, color: room ? 'var(--ink)' : 'var(--ink-4)', padding: 6, display: 'flex', cursor: room ? 'pointer' : 'default' }}>
	            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>
	          </button>
	        </div>
        {loading && (
          <div style={{ padding: '24px 16px', color: 'var(--ink-3)', fontSize: 13 }}>내 방 정보를 불러오는 중...</div>
        )}
        {error && (
          <div className="card" style={{ margin: '4px 16px 16px', padding: 18, color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && !room && (
          <div style={{ minHeight: 360, padding: '72px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: 58, height: 58, borderRadius: 18, background: 'var(--surface-2)', color: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon.door size={28} weight={1.8} />
            </div>
            <div style={{ fontSize: 15, color: 'var(--ink-3)', fontWeight: 700 }}>아직 참여 중인 방이 없어요.</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, marginTop: 6 }}>
              모집방을 만들거나 방 찾기에서 입주 신청을 해보세요.
            </div>
            <button
              onClick={() => navigate('/rooms/create/1')}
              style={{
                marginTop: 20,
                height: 52,
                padding: '0 18px',
                borderRadius: 26,
                border: 0,
                background: 'var(--ink)',
                color: 'white',
                fontWeight: 700,
                fontSize: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon.plus size={18} /> 모집방 만들기
            </button>
          </div>
        )}
        {!loading && !error && room && (
        <>
	        {/* Hero card */}
        <div style={{ padding: '4px 16px 16px' }}>
          <div style={{
            background: 'var(--brand)',
            color: 'white', borderRadius: 22, padding: 22, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }}/>
            <div style={{ position: 'absolute', right: -10, bottom: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px' }}>{room.title}</div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 2 }}>{[room.dorm, room.size].filter(Boolean).join(' · ')}</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginTop: 22, position: 'relative' }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>인원</div>
                <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{currentMembers} <span style={{ fontSize: 12, opacity: 0.7 }}>/ {roomCapacity}명</span></div>
              </div>
              <div>
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>상태</div>
	                <div style={{ fontSize: 19, fontWeight: 700, marginTop: 2 }}>{isRecruiting ? '모집중' : '모집 완료'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions — pill list */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { i: 'chat', l: '방 채팅', sub: `${currentMembers}명 참여`, hasNew: false, to: groupChatRoomNo ? '/chat/group/' + groupChatRoomNo : '/chat' },
            { i: 'user', l: '신청자 관리', sub: `${applicantCount}명 대기 중`, hasNew: applicantCount > 0, to: '/rooms/applicants' },
            { i: 'clipboard', l: '방 체크리스트', sub: '방 기준 보기', to: '/rooms/checklist' },
            { i: 'edit', l: '모집글 수정', sub: '제목·소개 변경', to: '/rooms/edit' },
          ].map((a, i) => {
            const I = Icon[a.i];
            return (
              <div key={i} onClick={() => navigate(a.to)} className="card" style={{
                padding: 14,
                display: 'flex', alignItems: 'center', gap: 12,
                background: a.primary ? 'var(--ink)' : 'var(--surface)',
                color: a.primary ? 'white' : 'var(--ink)',
                position: 'relative',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: a.primary ? 'var(--brand)' : 'var(--brand-soft)',
                  color: a.primary ? 'white' : 'var(--brand-deep)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}><I size={18}/></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.2px' }}>{a.l}</div>
                  <div style={{ fontSize: 11, color: a.primary ? 'rgba(255,255,255,0.6)' : 'var(--ink-3)', marginTop: 2, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.sub}</div>
                </div>
                {a.hasNew && (
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--brand)',
                    position: 'absolute', top: 12, right: 12,
                  }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Members (현재 룸메이트) */}
	        <div className="h-section">
	          <h2>현재 룸메이트 <span style={{ color: 'var(--brand)' }}>2</span></h2>
	          <span className="more" onClick={() => navigate('/rooms/members')} style={{ cursor: 'pointer' }}>
		            {isRecruiting ? `${openSeats}자리 모집중` : '모집 완료'}
	          </span>
	        </div>
        <div style={{ margin: '0 16px' }}>
          {members.length > 0 ? members.map((m) => (
            <MemberCard key={m.id} m={m} defaultOpen={false}/>
          )) : (
            <div className="card" style={{ padding: 18, color: 'var(--ink-3)', fontSize: 13 }}>룸메이트 정보를 불러올 수 없어요.</div>
          )}
        </div>

        {/* Room notes */}
        <div className="h-section">
          <h2>방장의 한마디</h2>
          <span className="more" onClick={() => navigate('/rooms/edit')} style={{ cursor: 'pointer' }}>수정</span>
        </div>
        <div style={{ margin: '0 16px 24px' }} className="card">
          <div style={{ fontSize: 14, color: room.notes ? 'var(--ink)' : 'var(--ink-3)', lineHeight: 1.6 }}>
            {room.notes || '아직 작성된 한마디가 없어요.'}
          </div>
        </div>

        <div style={{ height: 24 }}/>
        </>
        )}
      </div>

      <TabBar active={activeTab}/>

      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            background: 'rgba(23,24,28,0.28)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'var(--surface)',
              borderRadius: '22px 22px 0 0',
              padding: '10px 16px 30px',
              boxShadow: '0 -16px 40px rgba(23,24,28,0.14)',
            }}
          >
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
            <div style={{ padding: '0 2px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>방 관리</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>방장 · 현재 {currentMembers}명 참여 중</div>
            </div>

	            <button
	              type="button"
	              onClick={() => {
	                setMenuOpen(false);
	                navigate('/rooms/edit');
              }}
              style={{
                width: '100%',
                minHeight: 52,
                border: 0,
                borderRadius: 14,
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              <span>모집글 수정</span>
	              <Icon.chevron size={14} />
	            </button>

		            <button
		              type="button"
		              disabled
		              style={{
		                width: '100%',
		                minHeight: 52,
		                border: 0,
		                borderRadius: 14,
		                background: 'var(--surface-2)',
		                color: 'var(--ink-4)',
		                display: 'flex',
		                alignItems: 'center',
		                justifyContent: 'space-between',
	                padding: '0 14px',
		                fontFamily: 'inherit',
		                fontSize: 15,
		                fontWeight: 700,
		                cursor: 'not-allowed',
		                marginBottom: 8,
		              }}
		            >
		              <span>모집 상태</span>
		              <span style={{ fontSize: 11, fontWeight: 700 }}>{isRecruiting ? (isRoomFull ? '정원 완료' : `${openSeats}자리 남음`) : '모집 완료'}</span>
		            </button>

	            <button
	              type="button"
	              onClick={leaveRoom}
              disabled={!canLeaveRoom}
              style={{
                width: '100%',
                minHeight: 52,
                border: 0,
                borderRadius: 14,
                background: canLeaveRoom ? 'rgba(226,69,60,0.08)' : 'var(--surface-2)',
                color: canLeaveRoom ? 'var(--danger)' : 'var(--ink-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                fontFamily: 'inherit',
                fontSize: 15,
                fontWeight: 700,
                cursor: canLeaveRoom ? 'pointer' : 'not-allowed',
              }}
            >
              <span>방 나가기</span>
              {!canLeaveRoom && <span style={{ fontSize: 11, fontWeight: 700 }}>방장 제한</span>}
            </button>

            {!canLeaveRoom && (
              <div style={{ marginTop: 10, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand-deep)', padding: 12, fontSize: 12, lineHeight: 1.5, fontWeight: 600 }}>
                방장은 모든 룸메이트가 나간 뒤에만 방을 나갈 수 있어요.
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="btn full ghost"
              style={{ height: 48, marginTop: 12 }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
