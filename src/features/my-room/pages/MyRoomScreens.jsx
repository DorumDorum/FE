import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StatusBar, Avatar, ClipText, goBack } from '../../../shared/components';
import { loadMyRoom } from '../../../shared/api/home';
import { loadApplications, approveApplication, rejectApplication, loadMyRoomRule, updateRoomTitle } from '../../../shared/api/room';
import { getOrCreateDirectChatRoom } from '../../../shared/api/chat';
import { normalizeRoom, roomRuleToChecklist } from '../../rooms/roomData';

// myroom-screens.jsx — destination screens from My Room quick actions
// 신청자 관리 (applicants list), 방 체크리스트 보기 (read-only), 모집글 수정

// ─── 신청자 관리 (full list) ─────────────────────────────────
export function ApplicantsListScreen() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = React.useState([]);
  const [roomNo, setRoomNo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [confirmAction, setConfirmAction] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    loadMyRoom()
      .then((room) => {
        if (!mounted) return;
        if (!room?.roomNo) {
          setRoomNo(null);
          return [];
        }
        setRoomNo(room.roomNo);
        return loadApplications(room.roomNo);
      })
      .then((list) => {
        if (!mounted) return;
        const rows = Array.isArray(list) ? list : [];
        setApplicants(rows);
      })
      .catch(() => { if (mounted) setError('신청자 목록을 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const applicantList = Array.isArray(applicants) ? applicants : [];

  const requestDecision = (applicant, action) => setConfirmAction({ applicant, action });

  const completeDecision = () => {
    if (!confirmAction) return;
    const { applicant, action } = confirmAction;
    if (action === 'accept' && !roomNo) {
      alert('방 정보를 찾을 수 없어요.');
      return;
    }
    const call = action === 'accept'
      ? approveApplication(roomNo, applicant.requestNo)
      : rejectApplication(applicant.requestNo);
    call
      .then(() => {
        setApplicants((prev) => prev.filter((a) => a.requestNo !== applicant.requestNo));
        setConfirmAction(null);
        if (action === 'accept') navigate('/rooms/members');
      })
      .catch((e) => alert(e?.message || '처리 중 오류가 발생했어요.'));
  };

  const openDM = (applicant) => {
    if (!roomNo || !applicant?.userNo) {
      alert('채팅을 시작할 정보를 찾을 수 없어요.');
      return;
    }
    getOrCreateDirectChatRoom(roomNo, applicant.userNo)
      .then((chatRoomNo) => navigate('/chat/dm/' + chatRoomNo))
      .catch((e) => alert(e?.message || '채팅방을 열 수 없어요.'));
  };

  if (loading) {
    return (
      <div className="screen">
        <StatusBar />
        <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
          <div style={{ fontSize: 15, fontWeight: 600 }}>신청자 관리</div>
          <div style={{ width: 38 }} />
        </div>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>신청자 관리</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '0 16px 24px' }}>
        <div style={{ padding: '4px 4px 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>
            신청자 <span style={{ color: 'var(--brand)' }}>{applicantList.length}</span>명
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>신청 순서로 정렬했어요</div>
        </div>

        {error && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>{error}</div>
        )}

        {!error && applicantList.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>아직 신청자가 없어요</div>
        )}

        {applicantList.map((a) => (
          <div
            key={a.requestNo}
            onClick={() => navigate(`/rooms/applicants/${a.requestNo}`, { state: { applicant: a, roomNo } })}
            className="card"
            style={{ padding: 14, marginBottom: 8, cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <Avatar name={a.nickname || a.name} size={44} style={{ fontSize: 17 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>{a.nickname || a.name}</span>
                    {a.major && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {a.major}</span>}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : ''}</span>
                </div>
                {a.additionalMessage && (
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, marginTop: 8 }}>
                    <ClipText>"{a.additionalMessage}"</ClipText>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <button
                onClick={(e) => { e.stopPropagation(); requestDecision(a, 'reject'); }}
                style={{ flex: 1, height: 38, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                거절
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openDM(a); }}
                style={{ flex: 1, height: 38, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
              >
                <Icon.chat size={14} /> 채팅
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); requestDecision(a, 'accept'); }}
                style={{ flex: 1.4, height: 38, borderRadius: 10, border: 0, background: 'var(--brand)', color: 'white', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer' }}
              >
                <Icon.check size={14} weight={2.8} /> 수락
              </button>
            </div>
          </div>
        ))}
      </div>

      {confirmAction && (
        <div onClick={() => setConfirmAction(null)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(23,24,28,0.28)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 16px 30px', boxShadow: '0 -16px 40px rgba(23,24,28,0.14)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 2px 18px' }}>
              <Avatar name={confirmAction.applicant.nickname || confirmAction.applicant.name} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
                  {confirmAction.action === 'accept' ? '신청을 수락할까요?' : '신청을 거절할까요?'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                  {confirmAction.applicant.nickname || confirmAction.applicant.name}{confirmAction.applicant.major ? ' · ' + confirmAction.applicant.major : ''}
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
    </div>
  );
}

export function RoomChecklistScreen() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    loadMyRoom()
      .then((room) => loadMyRoomRule(room.roomNo))
      .then((rule) => { if (mounted) setChecklist(roomRuleToChecklist(rule)); })
      .catch(() => { if (mounted) setError('방 체크리스트를 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

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

        <div className="card" style={{ display: 'flex', gap: 4, padding: 4, marginBottom: 16 }}>
          {checklist.map((section, index) => ({ l: section.cat, v: `${section.items.filter((item) => item.a !== '-').length} / ${section.items.length}`, sub: index === 0 ? '필수' : '선택' })).
          map((s, i, a) =>
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRight: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.l} <span style={{ color: s.sub === '필수' ? 'var(--brand)' : 'var(--ink-4)' }}>· {s.sub}</span></div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2, letterSpacing: '-0.3px' }}>{s.v}</div>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>
        )}
        {error && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && checklist.map((cat, ci) =>
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
  const [room, setRoom] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    loadMyRoom()
      .then((data) => {
        if (!mounted) return;
        const normalized = normalizeRoom(data);
        setRoom({ ...normalized, raw: data });
        setTitle(data.title || '');
        setNotes(data.notes || '');
      })
      .catch(() => alert('모집글 정보를 불러오지 못했어요.'));
    return () => { mounted = false; };
  }, []);

  const save = () => {
    if (!room || saving) return;
    setSaving(true);
    updateRoomTitle(room.roomNo, { title, notes })
      .then(() => navigate('/rooms/me'))
      .catch((e) => alert(e?.message || '저장하지 못했어요.'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => goBack(navigate, '/rooms/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ fontSize: 15, fontWeight: 600 }}>모집글 수정</div>
        <button onClick={save} disabled={!room || saving || !title.trim()} style={{ background: 'transparent', border: 0, padding: '6px 10px', color: 'var(--brand)', fontSize: 13, fontWeight: 700, cursor: !room || saving || !title.trim() ? 'not-allowed' : 'pointer', opacity: !room || saving || !title.trim() ? 0.45 : 1 }}>{saving ? '저장 중' : '저장'}</button>
      </div>

      <div className="scroll" style={{ padding: '8px 20px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>모집글 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={30} style={{ width: '100%', background: 'var(--surface)', border: '1.5px solid var(--brand)', borderRadius: 14, padding: '14px 16px', fontSize: 15, outline: 0, fontFamily: 'inherit', color: 'var(--ink)', fontWeight: 500, boxSizing: 'border-box' }} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>{title.length} / 30</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>기숙사</label>
            <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{room ? [room.dorm, room.size].filter(Boolean).join(' · ') : '불러오는 중'}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>변경 불가</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>기숙사·인실은 모집방 생성 이후 변경할 수 없어요</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>방장의 한마디</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: 14, fontSize: 14, color: 'var(--ink-2)', minHeight: 100, lineHeight: 1.55, border: 0, outline: 0, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, textAlign: 'right' }}>{notes.length} / 200</div>
          </div>

	        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>);

}
