import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Avatar, StatusBar, goBack } from '../../../shared/components';
import { loadUserProfile } from '../../../shared/api/auth';
import { loadMyRoom, loadUserChecklist } from '../../../shared/api/home';
import { getOrCreateDirectChatRoom, loadMyChatRooms } from '../../../shared/api/chat';
import { loadMyRoommates, loadRoommateHistory, kickRoommate } from '../../../shared/api/room';
import { normalizeRoom, roommateToMember, roomRuleToChecklist } from '../../rooms/roomData';

// members.jsx — 룸메이트 멤버 화면 (방장 시점)
// 현재 방의 멤버 목록 + 각자의 개인 체크리스트를 펼쳐서 비교 가능

export const MEMBER_CHECKLISTS = [];

async function enrichMember(member) {
  if (!member.userNo) return member;
  const [profileResult, checklistResult] = await Promise.allSettled([
    loadUserProfile(member.userNo),
    loadUserChecklist(member.userNo),
  ]);
  const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
  const checklist = checklistResult.status === 'fulfilled' ? roomRuleToChecklist(checklistResult.value) : [];
  return {
    ...member,
    name: profile?.nickname || member.name,
    realName: profile?.name || member.realName,
    studentId: profile?.studentNo || member.studentId,
    dept: [profile?.major, profile?.grade ? `${profile.grade}학년` : null].filter(Boolean).join(' ') || member.dept,
    checklist,
  };
}

const historyToMember = (history) => ({
  id: history.historyNo || `${history.roomNo}-${history.roommateUserNo}`,
  userNo: history.roommateUserNo,
  name: history.nickname || history.name,
  realName: history.name,
  studentId: history.studentNo,
  dept: [history.major, history.studentYear ? `${history.studentYear}학번` : null].filter(Boolean).join(' '),
  role: history.relation === 'CURRENT' ? '현재' : '과거',
  confirmStatus: history.relation === 'CURRENT' ? '입주 중' : '함께 지냄',
  roomTitle: history.roomTitle,
  roomType: history.roomType,
  capacity: history.capacity,
  startedAt: history.startedAt,
  endedAt: history.endedAt,
  checklist: [],
});

export function MemberCard({ m, defaultOpen = false, onOpenChat, onKick }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const navigate = useNavigate();
  const hasChecklist = (m.checklist || []).length > 0;

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
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={() => onOpenChat ? onOpenChat(m) : navigate('/chat')} title="채팅" style={{ width: 36, height: 36, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon.chat size={18}/>
            </button>
            {onKick && (
              <button onClick={() => onKick(m)} title="내보내기" style={{ width: 36, height: 36, borderRadius: 10, border: 0, background: 'var(--surface-2)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>
        )}
      </div>

      {hasChecklist && (
      <>
      {/* Expandable checklist */}
      <div style={{
        display: 'grid',
        gridTemplateRows: open ? '1fr' : '0fr',
        transition: 'grid-template-rows .32s cubic-bezier(.2,.7,.2,1)',
        marginTop: open ? 12 : 0,
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
            {(m.checklist || []).map((cat, ci) => (
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
      </>
      )}
    </div>
  );
}

export function MembersScreen() {
  const navigate = useNavigate();
  const [room, setRoom] = React.useState(null);
  const [members, setMembers] = React.useState([]);
  const [groupChatRoomNo, setGroupChatRoomNo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [kickTarget, setKickTarget] = React.useState(null);
  const [kicking, setKicking] = React.useState(false);

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
        const normalized = normalizeRoom(roomData);
        setRoom(normalized);
        const baseMembers = Array.isArray(roommateList) ? roommateList.map(roommateToMember) : [];
        Promise.all(baseMembers.map(enrichMember))
          .then((nextMembers) => { if (mounted) setMembers(nextMembers); });
        setMembers(baseMembers);
        const chatList = Array.isArray(chatRooms) ? chatRooms : chatRooms?.items || [];
        const found = chatList.find((chatRoom) => chatRoom.chatRoomType === 'GROUP' && String(chatRoom.roomNo) === String(roomData.roomNo));
        setGroupChatRoomNo(found?.chatRoomNo || null);
      })
      .catch(() => { if (mounted) setError('룸메이트 정보를 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const openDirectChat = (member) => {
    if (!room?.roomNo || !member.userNo) return;
    getOrCreateDirectChatRoom(room.roomNo, member.userNo)
      .then((chatRoomNo) => navigate('/chat/dm/' + chatRoomNo))
      .catch((e) => alert(e?.message || '채팅방을 열 수 없어요.'));
  };

  const isHost = members.find((member) => member.isMe)?.role === '방장';

  const handleKick = () => {
    if (!room?.roomNo || !kickTarget || kicking) return;
    setKicking(true);
    kickRoommate(room.roomNo, kickTarget.userNo)
      .then(() => {
        setMembers((prev) => prev.filter((m) => m.userNo !== kickTarget.userNo));
        setKickTarget(null);
      })
      .catch((e) => alert(e?.message || '내보내기에 실패했어요.'))
      .finally(() => setKicking(false));
  };

  const currentMembers = room?.members ?? members.length;
  const roomCapacity = room?.capacity ?? currentMembers;
  const openSeats = Math.max(0, roomCapacity - currentMembers);

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
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>현재 룸메이트 {currentMembers}명</div>
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
            { l: '인원', v: `${currentMembers} / ${roomCapacity}` },
            { l: '남은 자리', v: `${openSeats}자리` },
          ].map((s, i, a) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 0', borderRight: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2, letterSpacing: '-0.3px' }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Members */}
        {loading && <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>}
        {error && <div style={{ padding: 24, textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        {!loading && !error && members.map((m) => (
          <MemberCard key={m.id} m={m} defaultOpen={false} onOpenChat={openDirectChat} onKick={isHost ? setKickTarget : undefined}/>
        ))}

        {/* Empty slots */}
        {openSeats > 0 && (
          <div style={{ marginTop: 4, marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', padding: '0 4px 8px', letterSpacing: '0.3px' }}>모집중 ({openSeats}자리)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: openSeats }).map((_, i) => (
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
        )}

        {/* Group chat link */}
        <div onClick={() => navigate(groupChatRoomNo ? '/chat/group/' + groupChatRoomNo : '/chat')} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, cursor: 'pointer' }}>
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

      {kickTarget && (
        <>
          <div
            onClick={() => setKickTarget(null)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 36px',
            zIndex: 41,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{kickTarget.name}님을 내보낼까요?</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 12 }}>
              내보내면 되돌릴 수 없어요.
            </div>
            <button
              onClick={handleKick}
              disabled={kicking}
              className="btn full"
              style={{ height: 52, background: 'var(--danger)', opacity: kicking ? 0.6 : 1 }}
            >{kicking ? '내보내는 중...' : '내보내기'}</button>
            <button
              onClick={() => setKickTarget(null)}
              className="btn full ghost"
              style={{ height: 52 }}
            >돌아가기</button>
          </div>
        </>
      )}
    </div>
  );
}


export function RoommateHistoryScreen() {
  const navigate = useNavigate();
  const [room, setRoom] = React.useState(null);
  const [roommates, setRoommates] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    Promise.all([
      loadMyRoom().catch(() => null),
      loadRoommateHistory(),
    ])
      .then(([roomData, roommateList]) => {
        if (!mounted) return;
        setRoom(roomData?.roomNo ? normalizeRoom(roomData) : null);
        const baseMembers = Array.isArray(roommateList) ? roommateList.map(historyToMember) : [];
        setRoommates(baseMembers);
        Promise.all(baseMembers.map(enrichMember))
          .then((nextMembers) => { if (mounted) setRoommates(nextMembers); });
      })
      .catch(() => { if (mounted) setError('룸메이트 정보를 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const roomLabel = room ? [room.dorm, room.size].filter(Boolean).join(' · ') : '방 정보';

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
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.4px' }}>룸메이트 기록</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 5, lineHeight: 1.45 }}>현재와 과거에 함께 지낸 룸메이트를 확인해요.</div>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 4, marginBottom: 16 }}>
          {[
            { label: '현재 룸메이트', value: `${roommates.length}명` },
            { label: '방 정보', value: room?.size || '-' },
          ].map((item, index, arr) => (
            <div key={item.label} style={{ textAlign: 'center', padding: '10px 0', borderRight: index === arr.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2, letterSpacing: '-0.3px' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>}
          {!loading && error && <div style={{ padding: 32, textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          {!loading && !error && roommates.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>현재 룸메이트 기록이 없어요.</div>
          )}
          {!loading && !error && roommates.map((mate) => (
            <div key={mate.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Avatar name={mate.name} tone={mate.tone} size={48} style={{ fontSize: 19 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>{mate.name}</span>
                    <span className={mate.role === '방장' ? 'chip brand' : 'chip line'} style={{ fontSize: 10, padding: '2px 6px' }}>{mate.role}</span>
                    {mate.isMe && <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>· 나</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 5, fontWeight: 600 }}>{[mate.realName, mate.studentId].filter(Boolean).join(' · ') || '-'}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{mate.dept}</div>
                  {mate.roomTitle && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{mate.roomTitle}</div>}
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>상태</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 800, marginTop: 4 }}>{mate.confirmStatus || '입주 중'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 700 }}>방 정보</div>
                  <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 800, marginTop: 4 }}>{mate.roomTitle || roomLabel}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
