import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, LogoMark, TabBar, StatusBar, Avatar, MarqueeText } from '../../../shared/components';
import { getMe } from '../../../shared/api/auth';
import { loadCalendarEvents, loadMyRoom, loadNotices, loadNotifications } from '../../../shared/api/home';
import { openNotificationStream } from '../../../shared/api/notificationStream';
import { residencePeriodLabel } from '../../rooms';
import { roomStatusLabel } from '../../rooms/roomData';

// home.jsx — Home tab (calendar + notices + my room shortcut)

// ── Calendar helper: build a 6-row month grid for May 2026 ──
export function buildMonth(year, month, today) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ d: prevDays - startWeekday + 1 + i, out: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, out: false, today: d === today });
  while (cells.length < 35) cells.push({ d: cells.length - startWeekday - daysInMonth + 1, out: true });
  return cells;
}

// schedule data — use a single brand color, vary only by intensity
export const SCHEDULE = {
  '2026-04': {
    7: [{ type: 'clean', label: '대청소', time: '19:00', desc: '공용 공간과 방 청소' }],
    14: [{ type: 'check', label: '점호', time: '22:30', desc: '사감실 라운드 점검' }],
    26: [{ type: 'event', label: '생활관 간담회', time: '18:30', desc: '라운지에서 건의사항 공유' }],
  },
  '2026-05': {
    4: [{ type: 'check', label: '점호', time: '22:30', desc: '사감실 라운드 점검' }],
    9: [{ type: 'clean', label: '대청소', time: '19:00', desc: '공용 공간과 방 청소' }],
    15: [{ type: 'check', label: '점호', time: '22:30', desc: '사감실 라운드 점검' }],
    21: [
      { type: 'event', label: '입사식', time: '18:00', desc: '다목적실 B동 1층 집합' },
      { type: 'check', label: '점호', time: '22:30', desc: '사감실 라운드 점검' },
    ],
    23: [{ type: 'clean', label: '대청소', time: '19:00', desc: '세탁실과 공용 냉장고 정리' }],
    28: [{ type: 'check', label: '점호', time: '22:30', desc: '사감실 라운드 점검' }],
  },
  '2026-06': {
    3: [{ type: 'check', label: '점호', time: '22:30', desc: '사감실 라운드 점검' }],
    12: [{ type: 'clean', label: '대청소', time: '19:00', desc: '공용 공간과 방 청소' }],
    24: [{ type: 'event', label: '방학 잔류 신청', time: '10:00', desc: '학생생활관 포털에서 신청' }],
  },
};

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const monthKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;
const FALLBACK_NOTICES = [
  { tag: '필독', tagBrand: true, title: '6월 입사식 일정 안내 — 5월 28일 18:00 다목적실(B동 1F) 집합', date: '05.21' },
  { tag: '안전', title: '소화기 점검으로 인한 알람 테스트 안내', date: '05.20' },
  { tag: '시설', title: 'B동 세탁실 4번 기기 교체 완료', date: '05.18' },
  { tag: '행사', title: '룸메이트 매칭 데이 — 5월 25일 오후 7시', date: '05.17' },
];

const formatDateParam = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (dateText) => {
  if (!dateText) return '';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

const monthRange = (year, month) => ({
  startDate: formatDateParam(new Date(year, month, 1)),
  endDate: formatDateParam(new Date(year, month + 1, 0)),
});

const normalizeCalendarEvents = (events) => events.reduce((acc, event) => {
  const date = new Date(event.date);
  if (Number.isNaN(date.getTime())) return acc;
  const day = date.getDate();
  if (!acc[day]) acc[day] = [];
  acc[day].push({
    label: event.title,
    desc: event.content || '',
    time: event.time ? event.time.slice(0, 5) : '',
    type: event.type || '',
  });
  return acc;
}, {});

const normalizeNotices = (notices) => notices.slice(0, 4).map((notice) => ({
  id: notice.noticeNo,
  tag: '공지',
  title: notice.title,
  date: formatShortDate(notice.writtenDate),
  originalLink: notice.originalLink,
}));

const roomTypeLabel = (roomType) => {
  if (roomType === 'TYPE_1') return '1생활관';
  if (roomType === 'TYPE_2') return '2생활관';
  if (roomType === 'TYPE_3') return '3생활관';
  if (roomType === 'TYPE_MEDICAL') return '메디컬';
  return '방 정보';
};


const formatRemainingTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

export function MiniCalendar() {
  const today = React.useMemo(() => new Date(), []);
  const [view, setView] = React.useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDay, setSelectedDay] = React.useState(today.getDate());
  const [calendarEvents, setCalendarEvents] = React.useState({});
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const cells = buildMonth(view.year, view.month, isCurrentMonth ? today.getDate() : null);
  const weekdays = ['일','월','화','수','목','금','토'];
  const fallbackScheduleForMonth = SCHEDULE[monthKey(view.year, view.month)] || {};
  const scheduleForMonth = calendarEvents[monthKey(view.year, view.month)] || fallbackScheduleForMonth;
  const selectedItems = scheduleForMonth[selectedDay] || [];

  React.useEffect(() => {
    let mounted = true;
    const key = monthKey(view.year, view.month);
    const { startDate, endDate } = monthRange(view.year, view.month);

    loadCalendarEvents(startDate, endDate)
      .then((events) => {
        if (!mounted) return;
        setCalendarEvents((prev) => ({ ...prev, [key]: normalizeCalendarEvents(Array.isArray(events) ? events : []) }));
      })
      .catch(() => {
        if (!mounted) return;
        setCalendarEvents((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      });

    return () => {
      mounted = false;
    };
  }, [view.year, view.month]);

  const changeMonth = (direction) => {
    setView((prev) => {
      const nextDate = new Date(prev.year, prev.month + direction, 1);
      const nextYear = nextDate.getFullYear();
      const nextMonth = nextDate.getMonth();
      const nextSchedule = calendarEvents[monthKey(nextYear, nextMonth)] || SCHEDULE[monthKey(nextYear, nextMonth)] || {};
      const scheduledDays = Object.keys(nextSchedule).map(Number).sort((a, b) => a - b);
      setSelectedDay(scheduledDays[0] || 1);
      return { year: nextYear, month: nextMonth };
    });
  };

  return (
    <div className="card" style={{ padding: 18, margin: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
	        <div>
	          <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.4px' }}>{MONTH_LABELS[view.month]} · {view.year}</div>
	          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginTop: 2 }}>{view.month + 1}월 일정</div>
	        </div>
	        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
	          <button onClick={() => changeMonth(-1)} style={{ width: 28, height: 28, borderRadius: 8, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon.back size={14} weight={2.4}/></button>
            <button onClick={() => { setView({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDay(today.getDate()); }} style={{ height: 28, padding: '0 10px', borderRadius: 8, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>오늘</button>
	          <button onClick={() => changeMonth(1)} style={{ width: 28, height: 28, borderRadius: 8, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon.chevron size={14} weight={2.4}/></button>
	        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', textAlign: 'center', marginBottom: 6 }}>
        {weekdays.map((w, i) => (
          <div key={w} style={{ color: i === 0 ? 'var(--danger)' : 'var(--ink-3)', padding: '4px 0' }}>{w}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, rowGap: 4 }}>
        {cells.map((c, i) => {
	          const sched = !c.out && scheduleForMonth[c.d];
          const selected = !c.out && c.d === selectedDay;
          return (
            <button key={i} type="button" onClick={() => !c.out && setSelectedDay(c.d)} style={{
              aspectRatio: '1/1.05',
              borderRadius: 10,
              border: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              paddingTop: 6,
              position: 'relative',
              background: selected ? 'var(--brand)' : c.today ? 'var(--brand-soft)' : 'transparent',
              color: c.out ? 'var(--ink-4)' : selected ? 'white' : c.today ? 'var(--brand-deep)' : (i % 7 === 0 ? 'var(--danger)' : 'var(--ink)'),
              fontSize: 13, fontWeight: c.today ? 700 : 500,
              fontFamily: 'inherit',
              cursor: c.out ? 'default' : 'pointer',
            }}>
              {c.d}
	              {sched && (
	                <div style={{
	                  width: 4,
	                  height: 4,
	                  borderRadius: '50%',
	                  background: selected ? 'white' : 'var(--brand)',
	                  marginTop: 3,
	                }} />
              )}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedDay}일 일정</div>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{selectedItems.length}개</span>
        </div>
        {selectedItems.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedItems.map((item, index) => (
              <div key={`${item.label}-${index}`} style={{ borderRadius: 12, background: 'var(--surface-2)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{item.desc}</div>
                </div>
                {item.time && <span style={{ fontSize: 12, color: 'var(--brand-deep)', fontWeight: 700 }}>{item.time}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ borderRadius: 12, background: 'var(--surface-2)', padding: '12px', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>
            등록된 일정이 없어요.
          </div>
        )}
      </div>
    </div>
  );
}

export function getTodaySubtitle(now = new Date()) {
  const cur = now.getHours() * 60 + now.getMinutes();
  const todayItems = (SCHEDULE[monthKey(now.getFullYear(), now.getMonth())]?.[now.getDate()] || [])
    .map(item => {
      const [h, m] = item.time.split(':').map(Number);
      return { ...item, total: h * 60 + m };
    })
    .filter(item => item.total > cur)
    .sort((a, b) => a.total - b.total);

  if (!todayItems.length) return '오늘 모든 일정이 끝났어요';

  const next = todayItems[0];
  const diff = next.total - cur;
  return `${next.label}까지 ${formatRemainingTime(diff)} 남았어요`;
}

export function getTodaySummary(now = new Date()) {
  const subtitle = getTodaySubtitle(now);
  return subtitle.startsWith('오늘') ? subtitle : `오늘은 ${subtitle}`;
}

export function HomeScreen({ activeTab='home' }) {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(null);
  const [myRoom, setMyRoom] = React.useState(null);
  const [notices, setNotices] = React.useState(FALLBACK_NOTICES);
  const [hasUnreadNotification, setHasUnreadNotification] = React.useState(false);
  const [todayEventCount, setTodayEventCount] = React.useState(null);
  const todaySummary = todayEventCount === null
    ? getTodaySummary()
    : todayEventCount > 0
      ? `오늘은 ${todayEventCount}개의 일정이 있어요`
      : '오늘 모든 일정이 끝났어요';
  const displayName = profile?.nickname || profile?.name || '민지';
  const roomStatus = roomStatusLabel(myRoom?.roomStatus);
  const isRecruiting = myRoom ? myRoom.roomStatus !== 'COMPLETED' : false;
  const currentMateCount = myRoom?.currentMateCount ?? 0;
  const roomCapacity = myRoom?.capacity ?? 0;

  React.useEffect(() => {
    let mounted = true;

    const today = new Date();
    const todayParam = formatDateParam(today);

    Promise.allSettled([
      getMe(),
      loadMyRoom(),
      loadNotices(),
      loadNotifications(),
      loadCalendarEvents(todayParam, todayParam),
    ]).then(([profileResult, roomResult, noticeResult, notificationResult, calendarResult]) => {
      if (!mounted) return;

      if (profileResult.status === 'fulfilled') setProfile(profileResult.value);
      if (roomResult.status === 'fulfilled') setMyRoom(roomResult.value);
      if (noticeResult.status === 'fulfilled' && Array.isArray(noticeResult.value)) {
        setNotices(normalizeNotices(noticeResult.value));
      }
      if (notificationResult.status === 'fulfilled') {
        const items = notificationResult.value?.items || [];
        setHasUnreadNotification(items.some((item) => !item.isRead));
      }
      if (calendarResult.status === 'fulfilled' && Array.isArray(calendarResult.value)) {
        const events = normalizeCalendarEvents(calendarResult.value);
        setTodayEventCount((events[today.getDate()] || []).length);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const closeStream = openNotificationStream(() => {
      setHasUnreadNotification(true);
    });
    return closeStream;
  }, []);

	  return (
	    <div className="screen">
	      <div className="scroll">
	        <StatusBar />
	        {/* Top bar */}
	        <div className="topbar">
	          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
	            <LogoMark size={28} radius={8} />
	            <div className="brand">도룸<span className="accent">도룸</span></div>
	          </div>
		          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
		            <button onClick={() => navigate('/notifications')} aria-label="알림" style={{ position: 'relative', background: 'transparent', border: 0, color: 'var(--ink)', padding: 6, display: 'flex', cursor: 'pointer' }}>
		              <Icon.bell size={22}/>
		              {hasUnreadNotification && <span style={{ position: 'absolute', top: 5, right: 5, width: 9, height: 9, borderRadius: '50%', background: 'var(--brand)', border: '2px solid var(--bg)', pointerEvents: 'none' }}/>}
		            </button>
		          </div>
	        </div>
	        {/* Greeting */}
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
            안녕하세요, <span style={{ color: 'var(--brand)' }}>{displayName}</span>님
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{todaySummary}</div>
        </div>

        {/* My recruitment room shortcut */}
        <div style={{ margin: '0 16px 8px' }}>
          {myRoom ? (
            <div onClick={() => navigate('/rooms/me')} style={{ background: 'var(--ink)', color: 'white', borderRadius: 18, padding: 18, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: isRecruiting ? 'var(--brand)' : 'rgba(255,255,255,0.62)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isRecruiting ? 'var(--brand)' : 'rgba(255,255,255,0.38)' }}/>
                {roomStatus}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4 }}>{myRoom.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{roomTypeLabel(myRoom.roomType)} · {myRoom.capacity}인실 · {residencePeriodLabel(myRoom.residencePeriod)}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex' }}>
                    <Avatar name={myRoom.hostNickname} size={28} style={{ border: '2px solid var(--ink)' }}/>
                    {currentMateCount > 1 && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid var(--ink)', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>+{currentMateCount - 1}</div>}
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}><b>{currentMateCount}</b>/{roomCapacity}명</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
                  관리하기 <Icon.chevron size={14}/>
                </div>
              </div>
            </div>
          ) : (
            <div onClick={() => navigate('/rooms/find')} style={{ background: 'var(--ink)', color: 'white', borderRadius: 18, padding: 18, cursor: 'pointer' }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 6 }}>아직 방이 없어요</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>마음에 드는 방을 찾아보세요</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
                  방 찾기 <Icon.chevron size={14}/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div style={{ marginTop: 8 }}>
          <MiniCalendar />
        </div>

	        {/* Notices */}
	        <div className="h-section">
	          <h2>공지사항</h2>
	          <span className="more" onClick={() => navigate('/notices')} style={{ cursor: 'pointer' }}>더보기</span>
	        </div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {notices.map((n, i, arr) => (
            <div key={n.id || i} onClick={() => n.originalLink ? window.open(n.originalLink, '_blank', 'noopener,noreferrer') : navigate('/notices')} style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--line)',
              cursor: 'pointer',
            }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--ink)', paddingLeft: 4 }}>
                <MarqueeText>{n.title}</MarqueeText>
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{n.date}</span>
            </div>
          ))}
        </div>

        {/* Dorm info shortcuts */}
        <div className="h-section"><h2>기숙사 안내사항</h2></div>
        <div style={{ margin: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: '사감실\n운영 안내', sub: '운영 시간·외출', to: '/dorm-info', icon: 'bell' },
            { label: '점호 및\n청소 점검', sub: '점검 일정·항목', to: '/dorm-rules/rollcall', icon: 'moon' },
            { label: '기숙사\n규칙', sub: '생활관 규정', to: '/dorm-rules/general', icon: 'clipboard' },
          ].map(({ label, sub, to, icon }) => (
            <div key={to} onClick={() => navigate(to)} style={{ background: 'var(--surface)', borderRadius: 16, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', border: '1px solid var(--line)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {Icon[icon]({ size: 18 })}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <TabBar active={activeTab} />
    </div>
  );
}
