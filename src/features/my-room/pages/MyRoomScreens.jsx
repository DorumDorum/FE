import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StatusBar, Avatar, ClipText, goBack } from '../../../shared/components';

// myroom-screens.jsx — destination screens from My Room quick actions
// 신청자 관리 (applicants list), 방 체크리스트 보기 (read-only), 모집글 수정

// ─── 신청자 관리 (full list) ─────────────────────────────────
export const APPLICANTS = [
{ id: 1, name: '지원', dept: '컴공 22', tone: 'sky', match: '잘 맞아요', time: '10분 전', message: '안녕하세요! 7시 전에 일어나는 편이고 조용히 지내요.' },
{ id: 2, name: '서연', dept: '심리 21', tone: 'plum', match: '잘 맞아요', time: '2시간 전', message: '체크리스트 확인했어요. 잘 맞을 것 같아요!' },
{ id: 3, name: '지호', dept: '경제 23', tone: 'sand', match: '괜찮아요', time: '어제', message: '운동 좋아하지만 새벽까지 시끄럽게는 안 해요.' },
{ id: 4, name: '지훈', dept: '국문 22', tone: 'sage', match: '괜찮아요', time: '어제', message: '평일은 거의 도서관에 있어요. 부탁드려요.' },
{ id: 5, name: '민서', dept: '경영 24', tone: '', match: '맞춰볼 만해요', time: '2일 전', message: '신청 드립니다. 잘 부탁드려요.' }];


export function ApplicantsListScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('전체');
  const [applicants, setApplicants] = React.useState(APPLICANTS);
  const [confirmAction, setConfirmAction] = React.useState(null);
  const filterOptions = ['전체', '잘 맞아요', '괜찮아요', '맞춰볼 만해요'];
  const filteredApplicants = filter === '전체'
    ? applicants
    : applicants.filter((a) => a.match === filter);

  const requestDecision = (applicant, action) => {
    setConfirmAction({ applicant, action });
  };

  const completeDecision = () => {
    if (!confirmAction) return;
    const { applicant, action } = confirmAction;
    setApplicants((prev) => prev.filter((a) => a.id !== applicant.id));
    setConfirmAction(null);
    if (action === 'accept') {
      navigate('/rooms/members');
    }
  };

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>신청자 관리</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '0 16px 24px' }}>
        {/* Header */}
        <div style={{ padding: '4px 4px 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>
            신청자 <span style={{ color: 'var(--brand)' }}>{filteredApplicants.length}</span>명
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
            {filter === '전체' ? '매칭이 잘 맞는 순서로 정렬했어요' : `${filter} 신청자만 보고 있어요`}
          </div>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto' }}>
	          {filterOptions.map((f) => {
	            const active = filter === f;
	            const count = f === '전체' ? applicants.length : applicants.filter((a) => a.match === f).length;
	            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={"chip " + (active ? 'ink' : 'line')}
                style={{
                  fontSize: 13,
                  padding: '7px 12px',
                  whiteSpace: 'nowrap',
                  border: active ? 0 : '1px solid var(--line-2)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {f} {count}
              </button>
            );
          })}
        </div>

        {/* List */}
        {filteredApplicants.map((a) =>
        <div key={a.id} onClick={() => navigate(`/room/applicants/${a.id}`)} className="card" style={{ padding: 14, marginBottom: 8, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar name={a.name} tone={a.tone} size={44} style={{ fontSize: 17 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{a.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {a.dept}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.time}</span>
                </div>
                <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: a.match === '잘 맞아요' ? 'var(--brand-deep)' : 'var(--ink-3)'
                }}>{a.match === '잘 맞아요' ? '✓ ' : ''}{a.match}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginTop: 8 }}>
                  <ClipText>"{a.message}"</ClipText>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
	              <button onClick={(e) => { e.stopPropagation(); requestDecision(a, 'reject'); }} style={{ flex: 1, height: 38, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                거절
              </button>
              <button onClick={(e) => { e.stopPropagation(); navigate('/chat/dm'); }} style={{ flex: 1, height: 38, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                <Icon.chat size={14} /> 채팅
              </button>
	              <button onClick={(e) => { e.stopPropagation(); requestDecision(a, 'accept'); }} style={{ flex: 1.4, height: 38, borderRadius: 10, border: 0, background: 'var(--brand)', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}>
                <Icon.check size={14} weight={2.8} /> 수락
              </button>
            </div>
          </div>
	        )}
	      </div>
	      {confirmAction && (
	        <div onClick={() => setConfirmAction(null)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(23,24,28,0.28)', display: 'flex', alignItems: 'flex-end' }}>
	          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 16px 30px', boxShadow: '0 -16px 40px rgba(23,24,28,0.14)' }}>
	            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
	            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 2px 18px' }}>
	              <Avatar name={confirmAction.applicant.name} tone={confirmAction.applicant.tone} size={44} />
	              <div style={{ flex: 1, minWidth: 0 }}>
	                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
	                  {confirmAction.action === 'accept' ? '신청을 수락할까요?' : '신청을 거절할까요?'}
	                </div>
	                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
	                  {confirmAction.applicant.name} · {confirmAction.applicant.dept}
	                </div>
	              </div>
	            </div>
	            <div style={{ borderRadius: 14, background: 'var(--surface-2)', padding: 14, fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)', marginBottom: 12 }}>
	              {confirmAction.action === 'accept'
	                ? '수락하면 신청자는 방 멤버로 이동하고, 신청자 목록에서는 사라져요.'
	                : '거절하면 신청자 목록에서 사라져요. 다시 되돌릴 수 없어요.'}
	            </div>
	            <div style={{ display: 'flex', gap: 8 }}>
	              <button type="button" onClick={() => setConfirmAction(null)} className="btn ghost" style={{ width: 92, height: 52 }}>취소</button>
	              <button
	                type="button"
	                onClick={completeDecision}
	                className="btn full"
	                style={{ flex: 1, height: 52, background: confirmAction.action === 'accept' ? 'var(--brand)' : 'var(--danger)' }}
	              >
	                {confirmAction.action === 'accept' ? '수락하기' : '거절하기'}
	              </button>
	            </div>
	          </div>
	        </div>
	      )}
	    </div>);

}

// ─── 방 체크리스트 보기 (read-only) ──────────────────────────
export const ROOM_VIEW_CHECKLIST = [
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
  { q: '냉장고', a: '협의 후 결정' }]
},
{ cat: '추가 규칙', items: [
  { q: '드라이기 제한', a: '12–19시 사용 제한' },
  { q: '알람', a: '진동' },
  { q: '이어폰', a: '항상' },
  { q: '키스킨', a: '유동적' },
  { q: '무소음 마우스', a: '사용' },
  { q: '더위', a: '중간' },
  { q: '추위', a: '중간' },
  { q: '공부', a: '유동적' },
  { q: '쓰레기통', a: '개별' }]
}];


export function RoomChecklistScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>방 체크리스트</div>
        <button onClick={() => navigate('/rooms/checklist/edit')} style={{ background: 'transparent', border: 0, padding: '6px 10px', color: 'var(--brand)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>수정</button>
      </div>

      <div className="scroll" style={{ padding: '0 20px 24px' }}>
        {/* Header */}
        <div style={{ padding: '4px 0 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>방 체크리스트</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5 }}>
            신청자의 체크리스트와 비교될 기준이에요. 언제든 수정할 수 있어요.
          </div>
        </div>

        {/* Stats */}
        <div className="card" style={{ display: 'flex', gap: 4, padding: 4, marginBottom: 16 }}>
          {[
          { l: '생활 패턴', v: '14 / 14', sub: '필수' },
          { l: '추가 규칙', v: '9 / 9', sub: '선택' }].
          map((s, i, a) =>
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRight: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.l} <span style={{ color: s.sub === '필수' ? 'var(--brand)' : 'var(--ink-4)' }}>· {s.sub}</span></div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, letterSpacing: '-0.3px' }}>{s.v}</div>
            </div>
          )}
        </div>

        {/* Checklist sections */}
        {ROOM_VIEW_CHECKLIST.map((cat, ci) =>
        <div key={ci} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 10px' }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>{cat.cat}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{cat.items.length}개 항목</span>
            </div>
            <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden' }}>
              {cat.items.map((it, ii) =>
            <div key={ii} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 14px',
              borderBottom: ii === cat.items.length - 1 ? 'none' : '1px solid var(--line)',
              fontSize: 13
            }}>
                  <span style={{ color: 'var(--ink-2)' }}>{it.q}</span>
                  <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{it.a}</span>
                </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>);

}

// ─── 모집글 수정 ────────────────────────────────────────────
// Same form as CreateRoomScreen step 1 but without step indicator + with "저장" CTA
export function EditPostScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>모집글 수정</div>
        <button onClick={() => navigate('/rooms/me')} style={{ background: 'transparent', border: 0, padding: '6px 10px', color: 'var(--brand)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>저장</button>
      </div>

      <div className="scroll" style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>모집글 제목</label>
            <input type="text" defaultValue="아침형 룸메 구해요" maxLength={30} style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--brand)', borderRadius: 14, padding: '14px 16px', fontSize: 15, outline: 0, fontFamily: 'inherit', color: 'var(--ink)', fontWeight: 500, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>12 / 30</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>기숙사</label>
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>2생활관 · 4인실</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>변경 불가</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>기숙사·인실은 모집방 생성 이후 변경할 수 없어요</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>방장의 한마디</label>
            <textarea defaultValue="아침 7시쯤 일어나는 사람이면 정말 좋아요. 청소는 일주일에 두 번 같이 하면 좋겠고, 평일 저녁엔 각자 시간 갖는 편이에요." maxLength={200} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: 14, fontSize: 14, color: 'var(--ink-2)', minHeight: 100, lineHeight: 1.55, border: 0, outline: 0, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>82 / 200</div>
          </div>

	        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>);

}
