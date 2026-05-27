import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, TabBar, StatusBar, Avatar, MarqueeText, ClipText, goBack } from '../../../shared/components';

// chat.jsx — ChatList + ChatDetail (KakaoTalk bubble style)

const CHATS = [
  { id: 1, name: '아침형 룸메 구해요 🌅 2생활관 4인실', last: '수민: 내일 7시에 같이 모닝커피 어때요?', time: '오후 05:42', unread: 3, group: true, tone: '' },
  { id: 2, name: '지원', last: '안녕하세요! 입주 신청 드렸습니다 :)', time: '오후 04:18', unread: 1, tone: 'sky' },
  { id: 3, name: '서연', last: '체크리스트 확인하고 답장드릴게요', time: '오후 02:30', unread: 0, tone: 'plum' },
  { id: 4, name: '학생생활관 사감팀', last: '5월 입사식 안내드립니다.', time: '오전 11:02', unread: 0, official: true, tone: 'sage' },
  { id: 5, name: '지호', last: '네 좋습니다 그럼 그렇게 진행해요', time: '어제', unread: 0, tone: 'sand' },
];

export function formatChatTime(date = new Date()) {
  const hour = date.getHours();
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = String(hour % 12 || 12).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${period} ${displayHour}:${minute}`;
}

function formatFileSize(size = 0) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  if (size >= 1024) return `${Math.round(size / 1024)}KB`;
  return `${size}B`;
}

export function ChatListScreen({ activeTab='chat' }) {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('전체');
  const visibleChats = CHATS.filter((chat) => {
    if (filter === '내 방') return chat.group;
    if (filter === '읽지 않음') return chat.unread > 0;
    return true;
  });

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

        <div style={{ background: 'var(--surface)', margin: '4px 16px 0', borderRadius: 18, overflow: 'hidden' }}>
          {visibleChats.map((c, i, arr) => (
            <div key={c.id} onClick={() => navigate(c.group ? '/chat/group' : '/chat/dm')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px', borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}>
              <div style={{ position: 'relative' }}>
                {c.group ? (
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.door size={24} weight={2} />
                  </div>
                ) : (
                  <Avatar name={c.name.slice(0,1)} tone={c.tone} size={48} style={{ fontSize: 20 }}/>
                )}
                {c.official && <span style={{ position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface)' }}><Icon.check size={10} weight={3}/></span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, minWidth: 0, flex: '0 1 auto', display: 'block', overflow: 'hidden' }}>
                    <MarqueeText>{c.name}</MarqueeText>
                  </span>
                  {c.group && <span style={{ fontSize: 12, color: 'var(--ink-3)', flexShrink: 0 }}>4</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
                  <ClipText>{c.last}</ClipText>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{c.time}</span>
                {c.unread > 0 && (
                  <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.unread}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <TabBar active={activeTab}/>
    </div>
  );
}

// ── Chat detail (KakaoTalk-style bubbles) ───────────────────
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

export function ChatAttachmentCard({ attachment, mine=false }) {
  if (!attachment) return null;
  const isImage = attachment.kind === 'image';
  return (
    <div style={{ minWidth: 180, maxWidth: 220 }}>
      {isImage && attachment.previewUrl && (
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 12, display: 'block', marginBottom: 8 }}
        />
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: isImage ? 0 : 10,
        borderRadius: 12,
        background: isImage ? 'transparent' : mine ? 'rgba(255,255,255,0.16)' : 'var(--surface-2)',
        color: mine ? 'white' : 'var(--ink)',
      }}>
        {!isImage && (
          <div style={{ width: 34, height: 34, borderRadius: 10, background: mine ? 'rgba(255,255,255,0.18)' : 'var(--brand-soft)', color: mine ? 'white' : 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon.file size={18} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</div>
          <div style={{ fontSize: 11, opacity: 0.72, marginTop: 2 }}>{isImage ? '사진' : '파일'} · {formatFileSize(attachment.size)}</div>
        </div>
      </div>
    </div>
  );
}

export function ChatComposer({ onSend }) {
  const [text, setText] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [attachment, setAttachment] = React.useState(null);
  const imageInputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const canSend = text.trim() || attachment;

  const selectAttachment = (kind) => (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const next = {
      id: `${Date.now()}-${file.name}`,
      kind,
      name: file.name,
      size: file.size,
    };

    if (kind === 'image') {
      const reader = new FileReader();
      reader.onload = () => setAttachment({ ...next, previewUrl: reader.result });
      reader.readAsDataURL(file);
    } else {
      setAttachment(next);
    }

    setMenuOpen(false);
  };

  const send = () => {
    if (!canSend) return;
    onSend?.({
      id: Date.now(),
      text: text.trim(),
      attachment,
      time: formatChatTime(),
    });
    setText('');
    setAttachment(null);
    setMenuOpen(false);
  };

  return (
    <div style={{ padding: '8px 12px 14px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
      <input ref={imageInputRef} type="file" accept="image/*" onChange={selectAttachment('image')} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" onChange={selectAttachment('file')} style={{ display: 'none' }} />

      {menuOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <button type="button" onClick={() => imageInputRef.current?.click()} style={{ minHeight: 54, border: 0, borderRadius: 14, background: 'var(--surface-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Icon.image size={19} /> 사진
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} style={{ minHeight: 54, border: 0, borderRadius: 14, background: 'var(--surface-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Icon.file size={19} /> 파일
          </button>
        </div>
      )}

      {attachment && (
        <div style={{ marginBottom: 8, borderRadius: 14, background: 'var(--surface-2)', padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: attachment.kind === 'image' ? 'var(--brand-soft)' : 'var(--surface)', color: attachment.kind === 'image' ? 'var(--brand-deep)' : 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {attachment.kind === 'image' ? <Icon.image size={18} /> : <Icon.file size={18} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{attachment.kind === 'image' ? '사진' : '파일'} · {formatFileSize(attachment.size)}</div>
          </div>
          <button type="button" onClick={() => setAttachment(null)} aria-label="첨부 취소" style={{ width: 30, height: 30, borderRadius: '50%', border: 0, background: 'var(--surface)', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" onClick={() => setMenuOpen((v) => !v)} aria-label="첨부 메뉴" style={{ width: 36, height: 36, borderRadius: '50%', border: 0, background: menuOpen ? 'var(--brand-soft)' : 'var(--surface-2)', color: menuOpen ? 'var(--brand-deep)' : 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon.plus size={20} />
        </button>
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [sentMessages, setSentMessages] = React.useState([]);
  const isHost = true;
  const currentMembers = 4;
  const canLeaveRoom = !isHost || currentMembers <= 1;
  const sendChatMessage = (message) => {
    setSentMessages((items) => [...items, { ...message, unread: Math.max(0, currentMembers - 1) }]);
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
                <MarqueeText>아침형 룸메 구해요 · 2생활관 4인실</MarqueeText>
              </span>
              <span style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>4</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>2생활관 · 4인실</div>
          </div>
	          <button onClick={() => setMenuOpen(true)} aria-label="채팅방 메뉴" style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Pinned notice */}
      <div onClick={() => navigate('/notice/1')} style={{ margin: '8px 12px 0', background: 'var(--brand-soft)', border: '1px solid var(--brand-soft)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--brand-deep)', cursor: 'pointer' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2l2 6h6l-5 4 2 7-7-4-7 4 2-7L0 8h6l6-6z" fill="currentColor"/></svg>
        <span style={{ flex: 1, fontWeight: 600 }}>일요일 저녁 7시 — 5월 청소 당번 정하기</span>
        <Icon.chevron size={12}/>
      </div>

      <div className="scroll" style={{ padding: '14px 12px 8px' }}>
        {/* Date divider */}
        <div style={{ textAlign: 'center', margin: '4px 0 14px' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', background: 'rgba(0,0,0,0.05)', padding: '4px 12px', borderRadius: 99 }}>2026년 5월 21일 목요일</span>
        </div>

        <ChatBubble side="left" name="강민지" tone="" time="오후 05:30">안녕하세요~ 새로 입주하실 분들 반가워요 :)</ChatBubble>
        <ChatBubble side="left" name="강민지" tone="" time="오후 05:31" showAvatar={false} showName={false}>저는 보통 7시쯤 일어나서 같이 모닝커피 하실 분 환영이에요 ☕️</ChatBubble>

        <div style={{ height: 8 }}/>
        <ChatBubble side="right" time="오후 05:35" unread={2}>와 저도 아침형이에요!</ChatBubble>
        <ChatBubble side="right" time="오후 05:35" withTail={false} unread={1}>매칭 추천에 떠서 신청드렸어요 ㅎㅎ</ChatBubble>

        <div style={{ height: 8 }}/>
        <ChatBubble side="left" name="수민" tone="sage" time="오후 05:40">저도요!! 청소 당번은 어떻게 정해요?</ChatBubble>

        <div style={{ height: 8 }}/>
        <ChatBubble side="left" name="수민" tone="sage" time="오후 05:42" showAvatar={false} showName={false}>
          내일 7시에 같이 모닝커피 어때요? <br/>저 카페 마실래요 ☺️
        </ChatBubble>

        <div style={{ textAlign: 'center', margin: '12px 0' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>지호님이 입장했어요</span>
        </div>

        <ChatBubble side="left" name="지호" tone="sand" time="오후 05:43">반가워요! 잘 부탁드려요 🙌</ChatBubble>
        {sentMessages.map((message) => (
          <ChatBubble key={message.id} side="right" time={message.time} unread={message.unread}>
            {message.attachment && <ChatAttachmentCard attachment={message.attachment} mine />}
            {message.text && <div style={{ marginTop: message.attachment ? 8 : 0 }}>{message.text}</div>}
          </ChatBubble>
        ))}
      </div>

      {/* Composer */}
      <ChatComposer onSend={sendChatMessage} />
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(23,24,28,0.28)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 16px 30px', boxShadow: '0 -16px 40px rgba(23,24,28,0.14)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
            <div style={{ padding: '0 2px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>채팅방 메뉴</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>아침형 룸메 구해요 · 현재 {currentMembers}명</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate('/rooms/members');
              }}
              style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 14, background: 'var(--surface-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
            >
              <span>방 멤버 보기</span>
              <Icon.chevron size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (!canLeaveRoom) return;
                setMenuOpen(false);
                navigate('/chat');
              }}
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
