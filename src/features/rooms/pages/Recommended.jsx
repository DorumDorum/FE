import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StatusBar, Avatar, MarqueeText, goBack } from '../../../shared/components';

// recommended.jsx — 매칭 추천 방 목록 화면 (banner tap target)

export const RECOMMENDED_ROOMS = [
  {
    id: 1,
    title: '아침형 룸메 구해요', dorm: '2생활관', size: '4인실',
    members: 2, capacity: 4, host: { name: '민지' },
    matchLabel: '잘 맞아요', matched: 20, total: 22,
    highlights: ['취침 23시', '청소 주기적', '비흡연'],
  },
  {
    id: 2,
    title: '조용히 공부할 사람만!', dorm: '3생활관', size: '2인실',
    members: 1, capacity: 2, host: { name: '수민' },
    matchLabel: '잘 맞아요', matched: 19, total: 22,
    highlights: ['소등 23시 이후', '잠귀 어두움', '방에서 취식 불가능'],
  },
  {
    id: 3,
    title: '평일은 도서관에서 살아요', dorm: '1생활관', size: '3인실',
    members: 2, capacity: 3, host: { name: '서연' },
    matchLabel: '잘 맞아요', matched: 18, total: 22,
    highlights: ['귀가 고정적', '본가 주기 2주', '키스킨 유동적'],
  },
  {
    id: 4,
    title: '청소는 같이 깔끔하게', dorm: '메디컬', size: '4인실',
    members: 1, capacity: 4, host: { name: '예린' },
    matchLabel: '괜찮아요', matched: 15, total: 22,
    highlights: ['청소 주기적', '비흡연'],
  },
  {
    id: 5,
    title: '같이 운동하실 분', dorm: '1생활관', size: '2인실',
    members: 1, capacity: 2, host: { name: '진우' },
    matchLabel: '괜찮아요', matched: 14, total: 22,
    highlights: ['아침형', '비흡연'],
  },
];

export function RecommendedRoomCard({ room }) {
  const navigate = useNavigate();
  const isStrong = room.matchLabel === '잘 맞아요';
  const matchPct = Math.round((room.matched / room.total) * 100);
  const accent = isStrong ? 'var(--brand)' : '#F59E0B';
  const accentSoft = isStrong ? 'var(--brand-soft)' : '#FEF3C7';
  const accentDeep = isStrong ? 'var(--brand-deep)' : '#92400E';
  return (
    <div className="card" onClick={() => navigate(`/rooms/${room.id}`)} style={{ padding: 16, marginBottom: 10, cursor: 'pointer' }}>
      {/* Match strip on top */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        paddingBottom: 12, borderBottom: '1px solid var(--line)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: accentSoft,
          color: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon.check size={18} weight={2.8}/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: accentDeep }}>{room.matchLabel}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, fontWeight: 500 }}>
            체크리스트 <b style={{ color: 'var(--ink-2)' }}>{room.matched}</b>/{room.total}개 항목 일치
          </div>
        </div>
        {/* progress bar */}
        <div style={{ width: 56, height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ width: `${matchPct}%`, height: '100%', background: accent }}/>
        </div>
      </div>

      {/* Title + meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
            <MarqueeText>{room.title}</MarqueeText>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{room.dorm} · {room.size}</div>
        </div>
      </div>

      {/* Matching highlights */}
      <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 10 }}>
        <div style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 6, letterSpacing: '0.3px' }}>일치하는 항목</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {room.highlights.map((h, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '4px 9px',
              borderRadius: 99,
              background: 'var(--brand-soft)',
              color: 'var(--brand-deep)',
              fontSize: 11, fontWeight: 600,
            }}>
              <Icon.check size={10} weight={3}/> {h}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={room.host.name} size={28}/>
          <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>방장 · <b>{room.host.name}</b></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
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
    </div>
  );
}

export function RecommendedRoomsScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('all');

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/find')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back/></button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>맞춤 추천</div>
        <button onClick={() => navigate('/rooms/find/filter')} style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}><Icon.search size={20}/></button>
      </div>

      <div className="scroll" style={{ padding: '0 16px 24px' }}>
        {/* Hero */}
        <div style={{ padding: '4px 4px 14px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.5px' }}>FOR YOU</div>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', marginTop: 4, lineHeight: 1.25 }}>
            당신과 잘 맞는 방<br/><span style={{ color: 'var(--brand)' }}>12곳</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
            내 체크리스트 22개 항목을 기준으로 추천했어요
          </div>
        </div>

        {/* My checklist reference card */}
        <div onClick={() => navigate('/checklist')} style={{ background: 'var(--ink)', color: 'white', borderRadius: 14, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.clipboard size={16}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>내 체크리스트 기준</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>생활 패턴 14 · 추가 규칙 9</div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--brand)', fontWeight: 700 }}>수정</span>
        </div>

        {/* Sort row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px' }}>
          <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 10, padding: 3, gap: 2 }}>
            {[{ v: 'all', l: '전체' }, { v: 'strong', l: '잘 맞아요' }, { v: 'ok', l: '괜찮아요' }].map(({ v, l }) => (
              <span key={v} onClick={() => setFilter(v)} style={{
                fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                background: filter === v ? 'var(--surface)' : 'transparent',
                color: filter === v ? 'var(--ink)' : 'var(--ink-3)',
                boxShadow: filter === v ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .15s',
              }}>{l}</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
            매칭순 <Icon.chevron size={12}/>
          </span>
        </div>

        {RECOMMENDED_ROOMS.filter(r =>
          filter === 'all' ||
          (filter === 'strong' && r.matchLabel === '잘 맞아요') ||
          (filter === 'ok' && r.matchLabel === '괜찮아요')
        ).map((r, i) => <RecommendedRoomCard key={i} room={r} />)}
      </div>
    </div>
  );
}
