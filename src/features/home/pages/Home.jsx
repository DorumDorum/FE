import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, LogoMark, TabBar, StatusBar, Avatar, MarqueeText } from '../../../shared/components';
import { MY_ROOM_RECRUITING_KEY } from '../../rooms';

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
const formatRemainingTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
};

export function MiniCalendar() {
  const [view, setView] = React.useState({ year: 2026, month: 4 });
  const [selectedDay, setSelectedDay] = React.useState(21);
  const isCurrentMonth = view.year === 2026 && view.month === 4;
  const cells = buildMonth(view.year, view.month, isCurrentMonth ? 21 : null);
  const weekdays = ['일','월','화','수','목','금','토'];
  const scheduleForMonth = SCHEDULE[monthKey(view.year, view.month)] || {};
  const selectedItems = scheduleForMonth[selectedDay] || [];
  const changeMonth = (direction) => {
    setView((prev) => {
      const nextDate = new Date(prev.year, prev.month + direction, 1);
      const nextYear = nextDate.getFullYear();
      const nextMonth = nextDate.getMonth();
      const nextSchedule = SCHEDULE[monthKey(nextYear, nextMonth)] || {};
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
            <button onClick={() => { setView({ year: 2026, month: 4 }); setSelectedDay(21); }} style={{ height: 28, padding: '0 10px', borderRadius: 8, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>오늘</button>
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
              <button key={`${item.label}-${index}`} type="button" style={{ border: 0, borderRadius: 12, background: 'var(--surface-2)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <span style={{ fontSize: 12, color: 'var(--brand-deep)', fontWeight: 700 }}>{item.time}</span>
              </button>
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
  const [isRecruiting] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem(MY_ROOM_RECRUITING_KEY) !== 'false';
  });
  const roomStatus = isRecruiting ? '모집중' : '모집 완료';
  const todaySummary = React.useMemo(() => getTodaySummary(), []);

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
		              <span style={{ position: 'absolute', top: 5, right: 5, width: 9, height: 9, borderRadius: '50%', background: 'var(--brand)', border: '2px solid var(--bg)', pointerEvents: 'none' }}/>
		            </button>
		          </div>
	        </div>
	        {/* Greeting */}
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.3 }}>
            안녕하세요, <span style={{ color: 'var(--brand)' }}>민지</span>님
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{todaySummary}</div>
        </div>

        {/* My recruitment room shortcut */}
        <div style={{ margin: '0 16px 8px' }}>
          <div onClick={() => navigate('/rooms/me')} style={{
            background: 'var(--ink)',
            color: 'white', borderRadius: 18, padding: 18, position: 'relative', overflow: 'hidden',
            cursor: 'pointer',
          }}>
	            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: isRecruiting ? 'var(--brand)' : 'rgba(255,255,255,0.62)', fontWeight: 700, letterSpacing: '0.4px', marginBottom: 6 }}>
	              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isRecruiting ? 'var(--brand)' : 'rgba(255,255,255,0.38)' }}/>
	              {roomStatus}
	            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4 }}>아침형 룸메 구해요</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>2생활관 · 4인실</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex' }}>
                  <Avatar name="민지" size={28} style={{ border: '2px solid var(--ink)' }}/>
                  <Avatar name="수민" size={28} style={{ marginLeft: -8, border: '2px solid var(--ink)' }}/>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid var(--ink)', marginLeft: -8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>+2</div>
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}><b>2</b>/4명</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
                관리하기 <Icon.chevron size={14}/>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ marginTop: 8 }}>
          <MiniCalendar />
        </div>

	        {/* Upcoming today */}
	        <div className="h-section">
	          <h2>오늘 일정</h2>
	        </div>
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.moon size={22}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>점호 시간</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>22:30 · 사감실 라운드</div>
            </div>
            <span className="chip line">5시간 후</span>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.moon size={22} solid/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>통금</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>01:00~05:00 · 출입 제한</div>
            </div>
            <span className="chip line">7시간 후</span>
          </div>
        </div>

	        {/* Notices */}
	        <div className="h-section">
	          <h2>공지사항</h2>
	          <span className="more" onClick={() => navigate('/notices')} style={{ cursor: 'pointer' }}>더보기</span>
	        </div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {[
            { tag: '필독', tagBrand: true, title: '6월 입사식 일정 안내 — 5월 28일 18:00 다목적실(B동 1F) 집합', date: '05.21' },
            { tag: '안전', title: '소화기 점검으로 인한 알람 테스트 안내', date: '05.20' },
            { tag: '시설', title: 'B동 세탁실 4번 기기 교체 완료', date: '05.18' },
            { tag: '행사', title: '룸메이트 매칭 데이 — 5월 25일 오후 7시', date: '05.17' },
          ].map((n, i, arr) => (
            <div key={i} onClick={() => navigate('/notice/1')} style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--line)',
              cursor: 'pointer',
            }}>
              <span className={"chip" + (n.tagBrand ? ' brand' : '')} style={{ fontSize: 11, padding: '3px 8px' }}>{n.tag}</span>
              <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--ink)' }}>
              <MarqueeText>{n.title}</MarqueeText>
            </div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{n.date}</span>
            </div>
          ))}
        </div>

        {/* Dorm info shortcuts */}
        <div style={{ margin: '16px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
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
