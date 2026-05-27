import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, LogoMark, TabBar, StatusBar, Avatar } from '../../../shared/components';
import { ROOMS, RoomCard } from '../../rooms';
import { MiniCalendar } from '../../home';

// loggedout.jsx — Logged-out states for main tabs
// User can peek inside without logging in; certain actions prompt login.

const GUEST_TAB_PATHS = {
  home: '/guest',
  find: '/guest/rooms/find',
  myroom: '/guest/myroom',
  chat: '/guest/chat',
  me: '/guest/me',
};

export function GuestBanner({ subtitle = '로그인하면 더 많은 기능을 쓸 수 있어요' }) {
  const navigate = useNavigate();

  return (
    <div style={{
      margin: '0 16px 12px',
      background: 'var(--ink)', color: 'white',
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 11, background: 'rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)',
      }}>
        <Icon.user size={20}/>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>로그인이 필요해요</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{subtitle}</div>
      </div>
      <button onClick={() => navigate('/login')} style={{
        background: 'var(--brand)', color: 'white', border: 0,
        padding: '8px 14px', borderRadius: 10,
        fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
      }}>로그인</button>
    </div>
  );
}

// ─── Locked overlay (covers a card or screen section) ───────
export function LockedBox({ children, message = '로그인 후 확인할 수 있어요' }) {
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', margin: '0 16px' }}>
      <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none' }}>
        {children}
      </div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(245,246,248,0.4) 0%, rgba(245,246,248,0.92) 60%, var(--bg) 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, borderRadius: 18,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--surface)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="9" rx="2" stroke="var(--ink-2)" strokeWidth="1.8"/>
            <path d="M8 11V8a4 4 0 018 0v3" stroke="var(--ink-2)" strokeWidth="1.8"/>
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>{message}</div>
        <button onClick={() => navigate('/login')} style={{
          background: 'var(--brand)', color: 'white', border: 0,
          padding: '8px 18px', borderRadius: 10,
          fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
        }}>로그인하기</button>
      </div>
    </div>
  );
}

// ─── HOME (guest) ───────────────────────────────────────────
export function HomeGuestScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={28} radius={8} />
          <div className="brand">도룸<span className="accent">도룸</span></div>
        </div>
        <button onClick={() => navigate('/login')} style={{
          background: 'transparent', border: '1px solid var(--line-2)',
          padding: '6px 12px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'inherit', cursor: 'pointer',
        }}>로그인</button>
      </div>

      <div className="scroll">
        {/* Hero - public welcome */}
        <div style={{ padding: '8px 20px 16px' }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.6px', lineHeight: 1.3 }}>
            안녕하세요 👋<br/>도룸도룸을 둘러보세요
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
            기숙사 일정과 공지는 누구나 볼 수 있어요
          </div>
        </div>

        {/* Login CTA — clear, friendly */}
        <GuestBanner subtitle="내 모집방을 만들고 룸메이트를 찾아보세요"/>

        {/* Calendar (public) */}
        <MiniCalendar/>

        {/* Today (public) */}
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
        </div>

        {/* Notices (public) */}
        <div className="h-section">
          <h2>공지사항</h2>
          <span className="more">더보기</span>
        </div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {[
            { tag: '필독', brand: true, title: '6월 입사식 일정 안내 (5/28 18:00)', date: '05.21' },
            { tag: '안전', title: '소화기 점검으로 인한 알람 테스트 안내', date: '05.20' },
            { tag: '시설', title: 'B동 세탁실 4번 기기 교체 완료', date: '05.18' },
          ].map((n, i, arr) => (
            <div key={i} onClick={() => navigate('/notice/1')} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}>
              <span className={"chip" + (n.brand ? ' brand' : '')} style={{ fontSize: 11, padding: '3px 8px' }}>{n.tag}</span>
              <div style={{ flex: 1, fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{n.date}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <TabBar active="home" paths={GUEST_TAB_PATHS}/>
    </div>
  );
}

// ─── FIND ROOM (guest) — list visible, actions locked ───────
export function FindRoomGuestScreen() {
  const navigate = useNavigate();
  const previewRoom = ROOMS[0];
  return (
    <div className="screen">
      <StatusBar />
      <div className="topbar">
        <div className="brand">방 찾기</div>
        <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: '1px solid var(--line-2)', padding: '6px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: 'var(--ink)', fontFamily: 'inherit', cursor: 'pointer' }}>로그인</button>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', borderRadius: 14, padding: '12px 14px' }}>
          <Icon.search size={20} weight={1.8}/>
          <span style={{ fontSize: 14, color: 'var(--ink-3)', flex: 1 }}>생활관, 인실 검색</span>
        </div>
      </div>

      <div className="scroll" style={{ padding: '8px 16px 16px' }}>
        {/* Login prompt (replaces match recommendation banner) */}
        <div style={{
          background: 'var(--brand-soft)', borderRadius: 14, padding: '12px 14px',
          marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.check size={16} weight={2.8}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-deep)' }}>로그인하면 매칭 추천이 나타나요</div>
            <div style={{ fontSize: 11, color: 'var(--brand-deep)', opacity: 0.75, marginTop: 2 }}>체크리스트 기반 자동 추천</div>
          </div>
          <button onClick={() => navigate('/login')} style={{ background: 'var(--brand)', color: 'white', border: 0, padding: '8px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>로그인</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 10px' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>전체 24개 · 최신순</span>
        </div>

        {/* First room — fully visible */}
        <RoomCard room={previewRoom}/>

        {/* Second room — visible */}
        <RoomCard room={ROOMS[1]}/>

        {/* Bottom: blurred + login overlay */}
        <div style={{ position: 'relative', marginTop: 4 }}>
          <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }}>
            <RoomCard room={ROOMS[2]}/>
            <RoomCard room={ROOMS[3]}/>
          </div>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(245,246,248,0.2) 0%, rgba(245,246,248,0.95) 35%, var(--bg) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
            gap: 10, padding: '0 20px 30px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>모집방 더 보기</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
              로그인하면 전체 모집방을 보고<br/>신청 · 채팅까지 할 수 있어요
            </div>
            <button onClick={() => navigate('/login')} className="btn full" style={{ marginTop: 6, height: 48 }}>로그인하고 더 보기</button>
          </div>
        </div>
      </div>

      <TabBar active="find" paths={GUEST_TAB_PATHS}/>
    </div>
  );
}

// ─── MY ROOM (guest) — empty state ─────────────────────────
export function MyRoomGuestScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div className="topbar">
        <div className="brand">내 방</div>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center', gap: 18, minHeight: 480 }}>
          {/* Door illustration */}
          <div style={{ position: 'relative', width: 96, height: 124 }}>
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '24px 24px 8px 8px',
              border: '2px solid var(--ink-3)',
              background: 'var(--surface)',
            }}/>
            <div style={{
              position: 'absolute', right: 14, top: 60,
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--brand)',
            }}/>
            <div style={{
              position: 'absolute', right: -10, top: -8,
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--brand-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand-deep)', fontSize: 16, fontWeight: 700,
            }}>?</div>
          </div>

          <div>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>아직 들어간 방이 없어요</div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6 }}>
              로그인하고 체크리스트를 작성하면<br/>나와 잘 맞는 룸메이트를 찾을 수 있어요
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 280, marginTop: 8 }}>
            <button onClick={() => navigate('/login')} className="btn full" style={{ height: 48 }}>로그인하기</button>
            <button onClick={() => navigate('/guest/rooms/find')} className="btn full ghost" style={{ height: 48 }}>모집방 둘러보기</button>
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: '0 20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.4px', padding: '0 4px 10px' }}>HOW IT WORKS</div>
          <div className="card" style={{ padding: 4 }}>
            {[
              { n: '1', t: '체크리스트 작성', d: '생활 패턴, 청결도, 예민도 등' },
              { n: '2', t: '모집방 찾기 또는 만들기', d: '매칭 추천을 받아 신청해요' },
              { n: '3', t: '채팅으로 이야기하고 결정', d: '방장과 직접 대화 후 입주' },
            ].map((s, i, a) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.n}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{s.t}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TabBar active="myroom" paths={GUEST_TAB_PATHS}/>
    </div>
  );
}

// ─── CHAT (guest) — locked ─────────────────────────────────
export function ChatGuestScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div className="topbar">
        <div className="brand">채팅</div>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', textAlign: 'center', gap: 18 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--brand-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-deep)' }}>
          <Icon.chat size={32}/>
        </div>
        <div>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>로그인하면 채팅을 시작해요</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.6 }}>
            방장과 직접 대화하고,<br/>같이 살 사람과 단톡방을 만들 수 있어요
          </div>
        </div>

        {/* Sample chat preview */}
        <div style={{ width: '100%', maxWidth: 300, marginTop: 12, position: 'relative' }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="박" size={36} style={{ fontSize: 14 }}/>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-4)' }}>● ● ●</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>● ● ● ● ● ● ●</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14, opacity: 0.4, marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="?" size={36} style={{ fontSize: 14 }}/>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-4)' }}>● ● ●</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>● ● ● ● ●</div>
            </div>
          </div>
        </div>

        <button onClick={() => navigate('/login')} className="btn full" style={{ width: '100%', maxWidth: 280, height: 48, marginTop: 8 }}>로그인하기</button>
      </div>

      <TabBar active="chat" paths={GUEST_TAB_PATHS}/>
    </div>
  );
}

// ─── MY PAGE (guest) — sign in card + settings ─────────────
export function MyPageGuestScreen() {
  const navigate = useNavigate();

  return (
    <div className="screen">
      <StatusBar />
      <div className="topbar">
        <div className="brand">마이페이지</div>
      </div>

      <div className="scroll">
        {/* Sign in card */}
        <div style={{ padding: '4px 16px 16px' }}>
          <div style={{
            background: 'var(--ink)', color: 'white',
            borderRadius: 22, padding: 22, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(49,113,225,0.18)' }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)',
              }}>
                <Icon.user size={28}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>로그인이 필요해요</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>학교 이메일로 시작하기</div>
              </div>
            </div>
            <button onClick={() => navigate('/login')} style={{
              width: '100%', marginTop: 16,
              background: 'var(--brand)', color: 'white', border: 0,
              padding: '12px', borderRadius: 12,
              fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
            }}>로그인 / 회원가입</button>
          </div>
        </div>

        {/* Settings (universal) */}
        <div className="h-section"><h2>설정</h2></div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {[
            { l: '알림 설정' },
            { l: '언어', r: '한국어' },
            { l: '도움말' },
            { l: '이용약관' },
            { l: '개인정보 처리방침' },
            { l: '버전', r: 'v1.2.0' },
          ].map((m, i, a) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
              <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{m.l}</span>
              {m.r && <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{m.r}</span>}
              {!m.r && <Icon.chevron size={14}/>}
            </div>
          ))}
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <TabBar active="me" paths={GUEST_TAB_PATHS}/>
    </div>
  );
}
