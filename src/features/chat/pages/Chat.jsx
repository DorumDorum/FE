import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon, TabBar, StatusBar, Avatar, MarqueeText, ClipText, goBack } from '../../../shared/components';
import { loadMyChatRooms, loadChatMessages, markChatRoomRead, leaveChatRoom, getChatRoomMembers } from '../../../shared/api/chat';
import { subscribe, publish } from '../../../shared/api/chatSocket';
import { applyReadReceipt, appendMessage } from '../unreadSync';
import { getCachedUserNo } from '../../../shared/api/auth';

export function formatChatTime(date = new Date()) {
  const hour = date.getHours();
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = String(hour % 12 || 12).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${period} ${displayHour}:${minute}`;
}

export function ChatListScreen({ activeTab='chat' }) {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('전체');
  const [rooms, setRooms] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    loadMyChatRooms()
      .then((data) => { if (alive) setRooms(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setError('채팅방을 불러오지 못했어요.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const visibleRooms = rooms.filter((room) => {
    if (filter === '내 방') return room.chatRoomType === 'GROUP';
    if (filter === '읽지 않음') return room.unreadCount > 0;
    return true;
  });

  const titleOf = (room) =>
    room.chatRoomType === 'GROUP' ? (room.roomName || '채팅방') : (room.partnerNickname || '상대방');

  const openRoom = (room) => {
    const path = room.chatRoomType === 'GROUP' ? '/chat/group/' : '/chat/dm/';
    navigate(path + room.chatRoomNo);
  };

  return (
    <div className="screen">
      <div className="scroll">
        <StatusBar />
        <div className="topbar">
          <div className="brand">채팅</div>
        </div>
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {['전체', '내 방', '읽지 않음'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={"chip " + (filter === f ? 'ink' : 'line')}
              style={{ fontSize: 13, padding: '6px 12px', border: filter === f ? 0 : '1px solid var(--line-2)', fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading && <div style={{ padding: '24px 16px', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중…</div>}
        {error && <div style={{ padding: '24px 16px', color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
        {!loading && !error && visibleRooms.length === 0 && (
          <div style={{ padding: '24px 16px', color: 'var(--ink-3)', fontSize: 13 }}>채팅방이 없어요.</div>
        )}

        {!loading && !error && visibleRooms.length > 0 && (
          <div style={{ background: 'var(--surface)', margin: '4px 16px 0', borderRadius: 18, overflow: 'hidden' }}>
            {visibleRooms.map((room, i, arr) => {
              const isGroup = room.chatRoomType === 'GROUP';
              const title = titleOf(room);
              return (
                <div key={room.chatRoomNo} onClick={() => openRoom(room)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}>
                  <div style={{ position: 'relative' }}>
                    {isGroup ? (
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon.door size={24} weight={2} />
                      </div>
                    ) : (
                      <Avatar name={title.slice(0, 1)} size={48} style={{ fontSize: 20 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, minWidth: 0, flex: '0 1 auto', display: 'block', overflow: 'hidden' }}>
                        <MarqueeText>{title}</MarqueeText>
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                      <ClipText>{room.lastMessageContent || '아직 메시지가 없어요'}</ClipText>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{room.lastMessageAt ? formatChatTime(new Date(room.lastMessageAt)) : ''}</span>
                    {room.unreadCount > 0 && (
                      <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{room.unreadCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      <TabBar active={activeTab} />
    </div>
  );
}

export function ChatBubble({ side='left', name, time, tone='', children, withTail=true, showAvatar=true, showName=true, unread=0 }) {
  const isMe = side === 'right';
  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end', marginBottom: 4 }}>
      {!isMe && (
        <div style={{ width: 36, height: 36, flexShrink: 0 }}>
          {showAvatar && <Avatar name={(name||'?').slice(0,1)} tone={tone} size={36} style={{ fontSize: 15 }}/>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
        {!isMe && showName && <span style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, marginLeft: 4, fontWeight: 600 }}>{name}</span>}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
          <div style={{
            background: isMe ? 'var(--brand)' : 'var(--surface)',
            color: isMe ? 'white' : 'var(--ink)',
            padding: '10px 14px',
            borderRadius: 16,
            borderBottomRightRadius: isMe && withTail ? 4 : 16,
            borderBottomLeftRadius: !isMe && withTail ? 4 : 16,
            fontSize: 14, lineHeight: 1.45,
            wordBreak: 'break-word',
          }}>{children}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 2, minWidth: 34 }}>
            {unread > 0 && <span style={{ fontSize: 10, color: 'var(--brand-deep)', fontWeight: 800, lineHeight: 1 }}>{unread}</span>}
            <span style={{ fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// SYSTEM이면 가운데 회색 텍스트, TEXT이면 ChatBubble.
export function ChatMessageItem({ message, myUserNo }) {
  if (message.messageType === 'SYSTEM') {
    return (
      <div style={{ textAlign: 'center', margin: '12px 0' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{message.content}</span>
      </div>
    );
  }
  const mine = message.senderNo === myUserNo;
  return (
    <ChatBubble
      side={mine ? 'right' : 'left'}
      name={message.senderNickname}
      time={formatChatTime(new Date(message.sentAt))}
      unread={message.unreadCount}
    >
      {message.content}
    </ChatBubble>
  );
}

// 텍스트 전용. 첨부파일은 서버 미지원으로 제거됨.
export function ChatComposer({ onSend, disabled = false }) {
  const [text, setText] = React.useState('');
  const canSend = !disabled && text.trim();

  const send = () => {
    if (!canSend) return;
    onSend?.(text.trim());
    setText('');
  };

  return (
    <div style={{ padding: '8px 12px 14px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              send();
            }
          }}
          placeholder="메시지 보내기"
          disabled={disabled}
          style={{ flex: 1, minWidth: 0, height: 38, border: 0, outline: 'none', background: 'var(--surface-2)', borderRadius: 18, padding: '0 14px', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit' }}
        />
        <button type="button" onClick={send} disabled={!canSend} style={{ width: 36, height: 36, borderRadius: '50%', border: 0, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canSend ? 1 : 0.45, cursor: canSend ? 'pointer' : 'not-allowed' }}>
          <Icon.send size={18} solid />
        </button>
      </div>
    </div>
  );
}

export function ChatDetailScreen() {
  const navigate = useNavigate();
  const { chatRoomNo } = useParams();
  const myUserNo = React.useMemo(() => getCachedUserNo(), []);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [members, setMembers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = React.useRef(null);

  const isHost = members.find((m) => m.userNo === myUserNo)?.isHost ?? false;
  const canLeaveRoom = !isHost || members.length <= 1;

  React.useEffect(() => {
    if (!chatRoomNo) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      getChatRoomMembers(chatRoomNo).catch(() => []),
      loadChatMessages(chatRoomNo).catch(() => ({ items: [] })),
    ]).then(([memberList, page]) => {
      if (!alive) return;
      setMembers(Array.isArray(memberList) ? memberList : []);
      const items = (page?.items || []).slice().reverse();
      setMessages(items);
      setLoading(false);
      markChatRoomRead(chatRoomNo).catch(() => {});
    });
    return () => { alive = false; };
  }, [chatRoomNo]);

  React.useEffect(() => {
    if (!chatRoomNo) return;
    let unsubMsg = () => {};
    let unsubRead = () => {};
    let alive = true;

    subscribe(`/topic/chat-room/${chatRoomNo}`, (incoming) => {
      if (!alive) return;
      setMessages((prev) => appendMessage(prev, incoming));
      if (incoming.senderNo !== myUserNo) {
        markChatRoomRead(chatRoomNo).catch(() => {});
      }
    }).then((fn) => { if (alive) unsubMsg = fn; else fn(); });

    subscribe(`/topic/chat-room/${chatRoomNo}/read`, (receipt) => {
      if (!alive) return;
      if (receipt.readerUserNo === myUserNo) return;
      setMessages((prev) => applyReadReceipt(prev, receipt));
    }).then((fn) => { if (alive) unsubRead = fn; else fn(); });

    return () => { alive = false; unsubMsg(); unsubRead(); };
  }, [chatRoomNo, myUserNo]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendChatMessage = (text) => {
    publish(`/app/chat-room/${chatRoomNo}/send`, { content: text }).catch(() => {});
  };

  const handleLeave = () => {
    if (!canLeaveRoom) return;
    leaveChatRoom(chatRoomNo)
      .then(() => { setMenuOpen(false); navigate('/chat'); })
      .catch((e) => { alert(e?.message || '나갈 수 없어요.'); });
  };

  return (
    <div className="screen" style={{ background: 'var(--bg)' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <StatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 12px' }}>
          <button onClick={() => goBack(navigate, '/chat')} style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back/></button>
          <div style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.door size={20} weight={2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 700, minWidth: 0, flex: '0 1 auto', display: 'block', overflow: 'hidden' }}>
                <MarqueeText>채팅방</MarqueeText>
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>{members.length || ''}</span>
            </div>
          </div>
          <button onClick={() => setMenuOpen(true)} aria-label="채팅방 메뉴" style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      <div className="scroll" ref={scrollRef} style={{ padding: '14px 12px 8px' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: 24 }}>불러오는 중…</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: 24 }}>첫 메시지를 보내보세요.</div>
        )}
        {messages.map((m) => (
          <ChatMessageItem key={m.messageNo} message={m} myUserNo={myUserNo} />
        ))}
      </div>

      <ChatComposer onSend={sendChatMessage} disabled={loading} />

      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(23,24,28,0.28)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 16px 30px', boxShadow: '0 -16px 40px rgba(23,24,28,0.14)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
            <div style={{ padding: '0 2px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>채팅방 메뉴</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>현재 {members.length}명</div>
            </div>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); navigate('/rooms/members'); }}
              style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 14, background: 'var(--surface-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
            >
              <span>방 멤버 보기</span>
              <Icon.chevron size={14} />
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={!canLeaveRoom}
              style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 14, background: canLeaveRoom ? 'rgba(226,69,60,0.08)' : 'var(--surface-2)', color: canLeaveRoom ? 'var(--danger)' : 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: canLeaveRoom ? 'pointer' : 'not-allowed' }}
            >
              <span>방 나가기</span>
              {!canLeaveRoom && <span style={{ fontSize: 11, fontWeight: 700 }}>방장 제한</span>}
            </button>
            {!canLeaveRoom && (
              <div style={{ marginTop: 10, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand-deep)', padding: 12, fontSize: 12, lineHeight: 1.5, fontWeight: 600 }}>
                방장은 모든 룸메이트가 나간 뒤에만 방을 나갈 수 있어요.
              </div>
            )}
            <button type="button" onClick={() => setMenuOpen(false)} className="btn full ghost" style={{ height: 48, marginTop: 12 }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
