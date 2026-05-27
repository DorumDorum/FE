import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Avatar, StatusBar, goBack } from '../../../shared/components';

// members.jsx — 룸메이트 멤버 화면 (방장 시점)
// 현재 방의 멤버 목록 + 각자의 개인 체크리스트를 펼쳐서 비교 가능

export const MEMBER_CHECKLISTS = [
  {
    name: '민지', realName: '강민지', studentId: '202234511',
    dept: '경영 22', tone: '', role: '방장', isMe: true,
    checklist: [
      { cat: '생활 패턴', items: [
        { q: '취침', a: '23시 – 01시' },
        { q: '기상', a: '07시 – 08시' },
        { q: '귀가', a: '고정적' },
        { q: '청소', a: '주기적' },
        { q: '방에서 전화', a: '가능' },
        { q: '잠귀', a: '어두움' },
        { q: '잠버릇', a: '약함' },
        { q: '코골이', a: '약함~없음' },
        { q: '샤워시간', a: '아침' },
        { q: '방에서 취식', a: '가능+환기필수' },
        { q: '소등', a: '23시 이후' },
        { q: '본가 주기', a: '매주' },
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
        { q: '추위', a: '적게 탐' },
        { q: '공부', a: '유동적' },
        { q: '쓰레기통', a: '개별' },
      ]},
    ],
  },
  {
    name: '수민', realName: '박수민', studentId: '202336702',
    dept: '디자인 22', tone: 'sage', role: '멤버',
    checklist: [
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
        { q: '공부', a: '기숙사 안' },
        { q: '쓰레기통', a: '개별' },
      ]},
    ],
  },
];

export function MemberCard({ m, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const navigate = useNavigate();

  return (
    <div className="card" style={{ padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar name={m.name} tone={m.tone} size={48} style={{ fontSize: 19 }}/>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.2px' }}>{m.name}</span>
            <span className={"chip " + (m.role === '방장' ? 'brand' : 'line')} style={{ fontSize: 10, padding: '2px 6px' }}>{m.role}</span>
            {m.isMe && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>· 나</span>}
          </div>
          {/* Roommate-only: full name + student id */}
          {m.realName && (
            <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4, fontWeight: 500 }}>
              {m.realName} · {m.studentId}
            </div>
          )}
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{m.dept}</div>
        </div>
        {!m.isMe && (
          <button onClick={() => navigate('/chat/dm')} title="채팅" style={{ width: 36, height: 36, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon.chat size={18}/>
          </button>
        )}
      </div>

      {/* Expandable checklist */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows .32s cubic-bezier(.2,.7,.2,1)',
        marginTop: open ? 12 : 0,
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
            {m.checklist.map((cat, ci) => (
              <React.Fragment key={ci}>
                <div style={{
                  background: 'var(--surface-2)',
                  padding: '8px 14px',
                  fontSize: 12, fontWeight: 700,
                  color: 'var(--ink-2)',
                }}>{cat.cat}</div>
                {cat.items.map((it, ii) => (
                  <div key={ii} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px',
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

      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', marginTop: 10,
          background: 'transparent', border: 0, padding: '6px 0',
          fontSize: 13, fontWeight: 600, color: 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          cursor: 'pointer',
        }}>
        {open ? '체크리스트 접기' : '체크리스트 보기'}
        <span style={{ display: 'inline-flex', transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .25s' }}>
          <Icon.chevron size={14}/>
        </span>
      </button>
    </div>
  );
}

export function MembersScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back/></button>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>룸메이트</div>
        <div style={{ width: 38 }}/>
      </div>

      <div className="scroll" style={{ padding: '0 16px 24px' }}>
        {/* Header */}
        <div style={{ padding: '4px 4px 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>현재 룸메이트 2명</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>같이 사는 멤버들의 체크리스트를 확인해보세요</div>
        </div>

        {/* Privacy notice */}
        <div style={{
          background: 'var(--brand-soft)', borderRadius: 12, padding: '10px 14px',
          fontSize: 12, color: 'var(--brand-deep)', lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}><path d="M12 2l9 4v6c0 5-3.5 9.5-9 10-5.5-.5-9-5-9-10V6l9-4z" stroke="currentColor" strokeWidth="1.8" fill="none"/></svg>
          <span>같은 방에 입주한 사람끼리만 학번과 본명을 볼 수 있어요</span>
        </div>

        {/* Stats strip */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, marginBottom: 16 }}>
          {[
            { l: '인원', v: '2 / 4' },
            { l: '모집 시작일', v: '2026.03.02' },
          ].map((s, i, a) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 0', borderRight: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, letterSpacing: '-0.3px' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Members */}
        {MEMBER_CHECKLISTS.map((m, i) => (
          <MemberCard key={i} m={m} defaultOpen={false}/>
        ))}

        {/* Empty slots */}
        <div style={{ marginTop: 4, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', padding: '0 4px 8px', letterSpacing: '0.3px' }}>모집중 (2자리)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0,1].map(i => (
              <div key={i} className="card" style={{
                flex: 1, padding: '20px 12px', textAlign: 'center',
                background: 'transparent', border: '1.5px dashed var(--line-2)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto', background: 'var(--surface-2)', color: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.plus size={20}/>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8, fontWeight: 600 }}>모집중</div>
              </div>
            ))}
          </div>
        </div>

        {/* Group chat link */}
        <div onClick={() => navigate('/chat/group')} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.chat size={20} solid/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>방 단체 채팅방</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>모든 룸메이트가 함께 있는 곳</div>
          </div>
          <Icon.chevron size={14}/>
        </div>
      </div>
    </div>
  );
}


const ROOMMATE_HISTORY = [
  {
    id: 1,
    name: '박수민',
    nickname: '수민',
    studentId: '202336702',
    dept: '디자인 22',
    period: '2026.03 - 2026.06',
    room: '2생활관 · 4인실',
    relation: '현재 룸메이트',
    tone: 'sage',
  },
  {
    id: 2,
    name: '이하은',
    nickname: '하은',
    studentId: '202214908',
    dept: '컴퓨터공학 22',
    period: '2025.09 - 2025.12',
    room: '1생활관 · 2인실',
    relation: '2025년 2학기',
    tone: 'sky',
  },
  {
    id: 3,
    name: '정예린',
    nickname: '예린',
    studentId: '202118442',
    dept: '간호 21',
    period: '2025.03 - 2025.06',
    room: '메디컬 · 3인실',
    relation: '2025년 1학기',
    tone: 'sand',
  },
  {
    id: 4,
    name: '김나은',
    nickname: '나은',
    studentId: '202231805',
    dept: '미디어 22',
    period: '2024.09 - 2024.12',
    room: '3생활관 · 2인실',
    relation: '2024년 2학기',
    tone: 'plum',
  },
];

export function RoommateHistoryScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={() => goBack(navigate, '/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back/></button>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>룸메이트 기록</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '4px 16px 28px' }}>
        <div style={{ padding: '4px 4px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>함께 지냈던 룸메이트</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.45 }}>이전에 같은 방에 입주했던 룸메이트 목록이에요.</div>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, marginBottom: 16 }}>
          {[
            { label: '누적 룸메이트', value: `${ROOMMATE_HISTORY.length}명` },
            { label: '최근 기록', value: '2026.06' },
          ].map((item, index, arr) => (
            <div key={item.label} style={{ textAlign: 'center', padding: '10px 0', borderRight: index === arr.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, letterSpacing: '-0.3px' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ROOMMATE_HISTORY.map((mate) => (
            <div key={mate.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar name={mate.nickname} tone={mate.tone} size={48} style={{ fontSize: 19 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{mate.nickname}</span>
                    <span className={mate.relation === '현재 룸메이트' ? 'chip brand' : 'chip line'} style={{ fontSize: 10, padding: '2px 6px' }}>{mate.relation}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 5, fontWeight: 600 }}>{mate.name} · {mate.studentId}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{mate.dept}</div>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>같이 지낸 기간</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 800, marginTop: 4 }}>{mate.period}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>방 정보</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 800, marginTop: 4 }}>{mate.room}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14, background: 'var(--brand-soft)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--brand-deep)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
            <path d="M12 2l9 4v6c0 5-3.5 9.5-9 10-5.5-.5-9-5-9-10V6l9-4z" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 700 }}>같은 방에 있었던 룸메이트 기록만 표시돼요.</div>
        </div>
      </div>
    </div>
  );
}
