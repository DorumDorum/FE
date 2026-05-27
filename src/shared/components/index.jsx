import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoUrl from '../../assets/logo.png';
export { goBack } from '../utils/navigation.js';

// shared.jsx — icons + UI primitives shared across screens

export function LogoMark({ size = 32, radius = 10, style = {} }) {
  return (
    <img
      src={logoUrl}
      alt="도룸도룸"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ─── MarqueeText: ellipsis by default, marquee if overflowing ──
// Measures content vs container; if overflow, runs a slow left↔right
// auto-scroll. No JS animation libs — pure CSS animation, paused when fit.
export function MarqueeText({ children, style = {}, gap = 32, speed = 10 }) {
  const wrapRef = React.useRef(null);
  const innerRef = React.useRef(null);
  const [overflow, setOverflow] = React.useState(false);
  const [shift, setShift] = React.useState(0);

  React.useLayoutEffect(() => {
    const measure = () => {
      const w = wrapRef.current, n = innerRef.current;
      if (!w || !n) return;
      const o = n.scrollWidth - w.clientWidth;
      setOverflow(o > 1);
      setShift(o + gap);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => ro.disconnect();
  }, [children, gap]);

  const dur = Math.max(4, shift / speed);

  return (
    <span ref={wrapRef} style={{
      display: 'block',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      maskImage: 'none',
      WebkitMaskImage: 'none',
      ...style,
    }}>
      <span
        ref={innerRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          textOverflow: overflow ? 'clip' : 'ellipsis',
          overflow: overflow ? 'visible' : 'hidden',
          maxWidth: overflow ? 'none' : '100%',
          animation: overflow ? `mq-${Math.round(shift)} ${dur}s cubic-bezier(.4,0,.6,1) infinite` : 'none',
        }}
      >{children}</span>
      {overflow && (
        <style>{`
          @keyframes mq-${Math.round(shift)} {
            0%, 12% { transform: translateX(0); }
            45%, 55% { transform: translateX(-${shift}px); }
            88%, 100% { transform: translateX(0); }
          }
        `}</style>
      )}
    </span>
  );
}

// Single-line ellipsis text — drop-in replacement when overflow isn't worth animating
export function ClipText({ children, style = {}, ...rest }) {
  return (
    <span {...rest} style={{
      display: 'block',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      minWidth: 0,
      ...style,
    }}>{children}</span>
  );
}

// ─── Icons ─────────────────────────────────────────────────
export const Icon = {
  home: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M4 11l8-7 8 7v8a2 2 0 01-2 2h-3v-6h-6v6H6a2 2 0 01-2-2v-8z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round" fill={p.solid?'currentColor':'none'}/>
    </svg>
  ),
  search: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  door: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M5 21V4a1 1 0 011-1h12a1 1 0 011 1v17" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round"/>
      <path d="M3 21h18" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
      <circle cx="15" cy="12" r="1" fill="currentColor"/>
    </svg>
  ),
  chat: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-4 3v-3H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round" fill={p.solid?'currentColor':'none'}/>
    </svg>
  ),
  user: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  bell: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M6 17V11a6 6 0 1112 0v6l1.5 2h-15L6 17z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round"/>
      <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  chevron: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={p.weight||2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  back: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={p.weight||2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={p.weight||2} strokeLinecap="round"/>
    </svg>
  ),
  image: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <circle cx="9" cy="10" r="1.6" fill="currentColor"/>
      <path d="M6.5 17l4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  file: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M7 3h7l4 4v14H7V3z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round"/>
      <path d="M14 3v5h4M9 13h6M9 17h4" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  check: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth={p.weight||2.4} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  filter: (p={}) => (
    <svg width={p.size||20} height={p.size||20} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  edit: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M16 4l4 4-11 11H5v-4L16 4z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round" strokeLinecap="round"/>
      <path d="M13.5 6.5l4 4" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  people: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <path d="M15 14c4 0 6 2 6 5" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  send: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <path d="M4 12l16-8-6 16-2-6-8-2z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round" fill={p.solid?'currentColor':'none'}/>
    </svg>
  ),
  moon: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none">
      <path d="M21 13A8 8 0 1111 3a7 7 0 0010 10z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round"/>
    </svg>
  ),
  broom: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none">
      <path d="M14 4l6 6-8 8H4v-2l8-8 2-4z" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinejoin="round"/>
      <path d="M9 14l1 1" stroke="currentColor" strokeWidth={p.weight||1.8} strokeLinecap="round"/>
    </svg>
  ),
  clipboard: (p={}) => (
    <svg width={p.size||18} height={p.size||18} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="4" width="12" height="17" rx="2" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <path d="M9 4h6v2H9z" fill="currentColor"/>
      <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth={p.weight||1.6} strokeLinecap="round"/>
    </svg>
  ),
  settings: (p={}) => (
    <svg width={p.size||22} height={p.size||22} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={p.weight||1.8}/>
      <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 010-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3h0a1.6 1.6 0 001-1.5V3a2 2 0 014 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8v0a1.6 1.6 0 001.5 1H21a2 2 0 010 4h-.1a1.6 1.6 0 00-1.5 1z" stroke="currentColor" strokeWidth={p.weight||1.6}/>
    </svg>
  ),
};

// ─── Bottom tab bar ─────────────────────────────────────────
// Router-aware: clicking a tab navigates to that path. The `active` prop
// is optional — when omitted, current tab is inferred from the URL.
const TAB_PATHS = {
  home: '/home',
  find: '/rooms/find',
  myroom: '/rooms/me',
  chat: '/chat',
  me: '/me',
};

export function TabBar({ active, onChange, paths = TAB_PATHS }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inferred = Object.keys(paths).find(id => paths[id] === location.pathname) || 'home';
  const current = active ?? inferred;
  const tabs = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'find', label: '방 찾기', icon: 'search' },
    { id: 'myroom', label: '내 방', icon: 'door' },
    { id: 'chat', label: '채팅', icon: 'chat' },
    { id: 'me', label: '마이페이지', icon: 'user' },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => {
        const isActive = t.id === current;
        const I = Icon[t.icon];
        const handleClick = () => {
          if (onChange) onChange(t.id);
          else navigate(paths[t.id]);
        };
        return (
          <div key={t.id} className={"tab" + (isActive ? ' active' : '')} onClick={handleClick}>
            <I size={24} weight={isActive ? 2.2 : 1.7} solid={isActive && (t.icon==='home' || t.icon==='chat')} />
            <span>{t.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StatusBar() {
  return <div className="status-spacer" />;
}

// ─── Helper: avatar with initial ─────────────────────────────
export function Avatar({ name='?', tone='', size=36, style={} }) {
  const initial = (name || '?').slice(0, 1);
  return (
    <span className={`avatar ${tone}`} style={{ width: size, height: size, fontSize: size*0.42, ...style }}>
      {initial}
    </span>
  );
}
