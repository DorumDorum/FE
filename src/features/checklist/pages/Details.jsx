import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Icon, StatusBar, Avatar, goBack } from '../../../shared/components';
import { logout as logoutUser, getCachedUserNo, getMe } from '../../../shared/api/auth';
import {
  loadMyRoom, loadNotices, loadNotifications, markAllNotificationsRead, markNotificationRead, registerNotificationDevice,
  loadMyChecklist, createUserChecklist, updateUserChecklist,
  loadMyAppliedRooms, loadLikedRooms, unlikeRoom,
} from '../../../shared/api/home';
import { submitRoomApplication, approveApplication, rejectApplication, loadMyRoomRule, updateMyRoomRule, createRoom, cancelRoomApplication } from '../../../shared/api/room';
import { ChatMessageItem, ChatComposer } from '../../chat';
import { getOrCreateDirectChatRoom, loadChatMessages, markChatRoomRead, leaveChatRoom } from '../../../shared/api/chat';
import { subscribe, publish } from '../../../shared/api/chatSocket';
import { applyReadReceipt, appendMessage } from '../../chat/unreadSync';
import { getNotificationDeviceId, openNotificationStream } from '../../../shared/api/notificationStream';
import {
  checklistFormToRoomRuleRequest,
  checklistFormToUserChecklistRequest,
  createRoomDraftToRequest,
  defaultRoomChecklistForm,
  normalizeRoom,
  residencePeriodLabel,
  roomRuleToChecklistForm,
  roomStatusLabel,
} from '../../rooms/roomData';

// details.jsx — Detail screens for each tab

// ─── Common: simple top nav with back arrow ─────────────────
export function TopNav({ title, right, backTo, collapsible = true }) {
  const navigate = useNavigate();
  const navRef = React.useRef(null);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!collapsible) {
      setCollapsed(false);
      return undefined;
    }

    const parent = navRef.current?.parentElement;
    const scroller = parent?.querySelector(':scope > .scroll') || parent?.querySelector('.scroll');
    if (!scroller) return undefined;

    let lastTop = scroller.scrollTop;
    let ticking = false;

    const update = () => {
      const currentTop = scroller.scrollTop;
      const scrollingDown = currentTop > lastTop + 2;
      const scrollingUp = currentTop < lastTop - 2;

      if (currentTop < 12 || scrollingUp) {
        setCollapsed(false);
      } else if (scrollingDown && currentTop > 32) {
        setCollapsed(true);
      }

      lastTop = Math.max(0, currentTop);
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, [collapsible]);

  return (
    <div ref={navRef} style={{
      padding: collapsed ? '0 12px' : '6px 12px 8px',
      display: 'grid',
      gridTemplateColumns: '72px 1fr 72px',
      alignItems: 'center',
      minHeight: collapsed ? 0 : 48,
      height: collapsed ? 0 : 48,
      opacity: collapsed ? 0 : 1,
      overflow: 'hidden',
      transform: collapsed ? 'translateY(-8px)' : 'translateY(0)',
      transition: 'height 160ms ease, min-height 160ms ease, padding 160ms ease, opacity 120ms ease, transform 160ms ease',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={() => goBack(navigate, backTo)} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', minWidth: 0 }}>{title}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>{right || null}</div>
    </div>);

}

// ─── Time range slider (drag both ends) ─────────────────────
export function TimeRangeSlider({ value, onChange }) {
  const trackRef = React.useRef(null);
  const [drag, setDrag] = React.useState(null);

  const fmt = (h) => `${h}시`;
  const span = value.end >= value.start ? value.end - value.start : 24 - value.start + value.end;

  React.useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const h = Math.round(ratio * 24);
      const next = h === 24 ? 0 : h;
      onChange(drag === 'start' ? { ...value, start: next } : { ...value, end: next });
    };
    const up = () => setDrag(null);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag, value]);

  const sPct = value.start / 24 * 100;
  const ePct = value.end / 24 * 100;
  const wraps = value.end < value.start;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
        {fmt(value.start)} <span style={{ color: 'var(--ink-3)' }}>—</span> {fmt(value.end)}
        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500, marginLeft: 8 }}>({span}시간)</span>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative', height: 6, background: 'var(--surface-2)', borderRadius: 99,
          margin: '14px 12px',
          touchAction: 'none'
        }}>
        
        {/* selected range */}
        {wraps ?
        <>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ePct}%`, background: 'var(--brand)', borderRadius: 99 }} />
            <div style={{ position: 'absolute', left: `${sPct}%`, top: 0, bottom: 0, right: 0, background: 'var(--brand)', borderRadius: 99 }} />
          </> :

        <div style={{ position: 'absolute', left: `${sPct}%`, top: 0, bottom: 0, width: `${ePct - sPct}%`, background: 'var(--brand)' }} />
        }
        {/* thumbs */}
        {[
        { id: 'start', pct: sPct },
        { id: 'end', pct: ePct }].
        map((t) =>
        <div
          key={t.id}
          onMouseDown={(e) => {e.preventDefault();setDrag(t.id);}}
          onTouchStart={(e) => {e.preventDefault();setDrag(t.id);}}
          style={{
            position: 'absolute',
            left: `calc(${t.pct}% - 12px)`, top: -9,
            width: 24, height: 24, borderRadius: '50%',
            background: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)',
            border: '3px solid var(--brand)',
            cursor: drag === t.id ? 'grabbing' : 'grab',
            touchAction: 'none'
          }} />

        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: 10, color: 'var(--ink-4)', fontWeight: 500 }}>
        <span>0</span><span>6</span><span>12</span><span>18</span><span>24</span>
      </div>
    </div>);

}

export function TimeRangeSelect({ value, onChange }) {
  const [activeKey, setActiveKey] = React.useState('start');
  const hours = Array.from({ length: 24 }, (_, hour) => hour);
  const fmt = (hour) => String(hour).padStart(2, '0') + ':00';
  const shortFmt = (hour) => String(hour).padStart(2, '0') + '시';
  const setHour = (hour) => onChange({ ...value, [activeKey]: hour });

  const RangeButton = ({ id, label }) => {
    const active = activeKey === id;
    return (
      <button
        type="button"
        onClick={() => setActiveKey(id)}
        style={{
          flex: 1,
          minWidth: 0,
          border: active ? '1.5px solid var(--brand)' : '1px solid var(--line)',
          borderRadius: 14,
          background: active ? 'var(--brand-soft)' : 'var(--surface)',
          padding: '10px 12px',
          textAlign: 'left',
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'border-color .15s ease, background .15s ease',
        }}
      >
        <span style={{ display: 'block', fontSize: 11, color: active ? 'var(--brand-deep)' : 'var(--ink-3)', fontWeight: 800, marginBottom: 3 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 16, color: active ? 'var(--brand-deep)' : 'var(--ink)', fontWeight: 900, letterSpacing: '-0.2px' }}>{fmt(value[id])}</span>
      </button>
    );
  };

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <RangeButton id="start" label="시작" />
        <RangeButton id="end" label="끝" />
      </div>

      <div style={{ marginTop: 9, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
        {hours.map((hour) => {
          const selected = value[activeKey] === hour;
          const otherSelected = value[activeKey === 'start' ? 'end' : 'start'] === hour;
          return (
            <button
              key={hour}
              type="button"
              onClick={() => setHour(hour)}
              style={{
                minWidth: 48,
                height: 34,
                borderRadius: 999,
                border: selected ? 0 : otherSelected ? '1px solid var(--brand-soft)' : '1px solid var(--line-2)',
                background: selected ? 'var(--brand)' : otherSelected ? 'var(--brand-soft)' : 'var(--surface)',
                color: selected ? 'white' : otherSelected ? 'var(--brand-deep)' : 'var(--ink-2)',
                fontSize: 12,
                fontWeight: selected || otherSelected ? 800 : 700,
                fontFamily: 'inherit',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {shortFmt(hour)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chip picker (single-select) ────────────────────────────
export function ChipPick({ value, options, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
      {options.map((o) => {
        const sel = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              padding: '7px 12px',
              borderRadius: 999,
              border: sel ? 'none' : '1px solid var(--line-2)',
              background: sel ? 'var(--ink)' : 'transparent',
              color: sel ? 'white' : 'var(--ink-2)',
              fontSize: 13, fontWeight: sel ? 700 : 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}>
            {o}</button>);

      })}
    </div>);

}

// ─── Row layout (label left, control right) ─────────────────
export function ChecklistRow({ label, children, align = 'center', required = false }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: align === 'top' ? 'flex-start' : 'center',
      gap: 14,
      padding: '12px 0',
      borderBottom: '1px solid var(--line)'
    }}>
      <div style={{ width: 76, flexShrink: 0, fontSize: 14, color: 'var(--ink-2)', fontWeight: 500, paddingTop: align === 'top' ? 6 : 0 }}>
        {label}
        {required && <span style={{ color: 'var(--brand)', marginLeft: 3, fontWeight: 700 }}>*</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>);

}

// ─── Checklist edit (full form) ─────────────────────────────
// mode: 'personal' (내 체크리스트) | 'room' (모집방 생성 2단계) | 'roomEdit' (방 체크리스트 수정)
export function ChecklistEditScreen({ mode = 'personal' }) {
  const navigate = useNavigate();
  const isRoomCreate = mode === 'room';
  const isRoomEdit = mode === 'roomEdit';
  const isRoom = isRoomCreate || isRoomEdit;
  const isPersonal = !isRoom;
  const [v, setV] = React.useState(isRoomCreate ? {
    sleep: { start: 23, end: 1 },
    wake: { start: 7, end: 9 },
    dryer: null,
    homing: null, cleaning: null, call: null, dim: null,
    sleepHabit: null, snore: null, shower: null, eating: null,
    lightsOut: null, lightsOutHour: 23, visitHome: null, smoke: null, fridge: null,
    alarm: null, earphone: null, skinCare: null, silentMouse: null, hot: null, cold: null, study: null, trash: null,
  } : defaultRoomChecklistForm);
  const upd = (k, val) => setV({ ...v, [k]: val });
  const [headerCollapsed, setHeaderCollapsed] = React.useState(false);
  const [roomContext, setRoomContext] = React.useState(null);
  const [roomRuleLoading, setRoomRuleLoading] = React.useState(isRoomEdit);
  const [roomRuleSaving, setRoomRuleSaving] = React.useState(false);
  const [personalChecklistExists, setPersonalChecklistExists] = React.useState(false);
  const [personalLoading, setPersonalLoading] = React.useState(isPersonal);
  const [personalSaving, setPersonalSaving] = React.useState(false);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (!isRoomEdit) return undefined;
    let mounted = true;
    setRoomRuleLoading(true);
    loadMyRoom()
      .then((room) => {
        setRoomContext(room);
        return loadMyRoomRule(room.roomNo);
      })
      .then((rule) => { if (mounted) setV(roomRuleToChecklistForm(rule)); })
      .catch(() => { if (mounted) alert('방 체크리스트를 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setRoomRuleLoading(false); });
    return () => { mounted = false; };
  }, [isRoomEdit]);

  React.useEffect(() => {
    if (!isPersonal) return undefined;
    let mounted = true;
    setPersonalLoading(true);
    loadMyChecklist()
      .then((checklist) => {
        if (!mounted) return;
        setV(roomRuleToChecklistForm(checklist));
        setPersonalChecklistExists(true);
      })
      .catch(() => { if (mounted) setPersonalChecklistExists(false); })
      .finally(() => { if (mounted) setPersonalLoading(false); });
    return () => { mounted = false; };
  }, [isPersonal]);

  const saveRoomRule = () => {
    if (!roomContext || roomRuleSaving) return;
    setRoomRuleSaving(true);
    updateMyRoomRule(roomContext.roomNo, checklistFormToRoomRuleRequest(v, roomContext))
      .then(() => navigate('/rooms/checklist'))
      .catch((e) => alert(e?.message || '방 체크리스트를 저장하지 못했어요.'))
      .finally(() => setRoomRuleSaving(false));
  };

  const savePersonalChecklist = () => {
    if (personalSaving) return;
    setPersonalSaving(true);
    const request = checklistFormToUserChecklistRequest(v);
    const call = personalChecklistExists ? updateUserChecklist(request) : createUserChecklist(request);
    call
      .then(() => navigate('/me'))
      .catch((e) => alert(e?.message || '체크리스트를 저장하지 못했어요.'))
      .finally(() => setPersonalSaving(false));
  };

  const handleScroll = () => {
    if (isRoomCreate) return;
    if (scrollRef.current) {
      setHeaderCollapsed(scrollRef.current.scrollTop > 10);
    }
  };

  return (
    <div className="screen">
      <StatusBar />
      {isRoomCreate ?
      <>
          <TopNav title="모집방 만들기" backTo="/rooms/create/1" collapsible={false} />
          <div style={{ padding: '0 20px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
              <span>2 / 3 단계</span>
              <span>방 체크리스트</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{ width: '66%', height: '100%', background: 'var(--brand)' }} />
            </div>
          </div>
          <div style={{
            overflow: 'hidden',
            maxHeight: 100,
            opacity: 1,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
            padding: '6px 20px 0',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.35 }}>
              어떤 룸메이트를 찾으시나요?
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5 }}>우리 방의 체크리스트예요. 신청자의 체크리스트와 비교돼요.</div>
          </div>
        </> :

      isRoomEdit ?
      <>
          <TopNav
          title="방 체크리스트"
          backTo="/rooms/checklist"
          right={<button onClick={saveRoomRule} disabled={roomRuleLoading || roomRuleSaving || !roomContext} style={{ background: 'transparent', border: 0, fontSize: 13, color: 'var(--brand)', fontWeight: 700, cursor: roomRuleLoading || roomRuleSaving || !roomContext ? 'not-allowed' : 'pointer', opacity: roomRuleLoading || roomRuleSaving || !roomContext ? 0.45 : 1 }}>{roomRuleSaving ? '저장 중' : '저장'}</button>}
        />
          <div style={{ padding: '6px 20px 0' }}>
            <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.35 }}>
              방 기준 체크리스트를 수정해요
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.5 }}>
              신청자의 체크리스트와 비교될 기준이에요.
            </div>
          </div>
        </> :

      <TopNav
        title="내 체크리스트"
        backTo="/me"
        right={<button onClick={savePersonalChecklist} disabled={personalLoading || personalSaving} style={{ background: 'transparent', border: 0, fontSize: 13, color: 'var(--brand)', fontWeight: 700, cursor: personalLoading || personalSaving ? 'not-allowed' : 'pointer', opacity: personalLoading || personalSaving ? 0.45 : 1 }}>{personalSaving ? '저장 중' : '저장'}</button>}
      />
      }

      <div ref={scrollRef} onScroll={handleScroll} className="scroll" style={{ padding: isRoom ? '12px 20px 0' : '0 20px' }}>
        {isRoomEdit && roomRuleLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>방 체크리스트를 불러오는 중...</div>
        )}
        {isPersonal && personalLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>체크리스트를 불러오는 중...</div>
        )}
        {/* Section 1 */}
        <div style={{ padding: '10px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>생활 패턴</h2>
          <span className="chip brand" style={{ fontSize: 10, padding: '3px 8px', fontWeight: 700 }}>필수</span>
        </div>
        <div className="card" style={{ padding: '0 16px', marginBottom: 16 }}>
          <ChecklistRow label="취침 시간" align="top" required>
            <TimeRangeSelect value={v.sleep} onChange={(x) => upd('sleep', x)} />
          </ChecklistRow>
          <ChecklistRow label="기상 시간" align="top" required>
            <TimeRangeSelect value={v.wake} onChange={(x) => upd('wake', x)} />
          </ChecklistRow>
          <ChecklistRow label="귀가" required>
            <ChipPick value={v.homing} options={['유동적', '고정적']} onChange={(x) => upd('homing', x)} />
          </ChecklistRow>
          <ChecklistRow label="청소" required>
            <ChipPick value={v.cleaning} options={['주기적', '비주기적']} onChange={(x) => upd('cleaning', x)} />
          </ChecklistRow>
          <ChecklistRow label="방에서 전화" required>
            <ChipPick value={v.call} options={['가능', '불가능']} onChange={(x) => upd('call', x)} />
          </ChecklistRow>
          <ChecklistRow label="잠귀" required>
            <ChipPick value={v.dim} options={['밝음', '어두움']} onChange={(x) => upd('dim', x)} />
          </ChecklistRow>
          <ChecklistRow label="잠버릇" required>
            <ChipPick value={v.sleepHabit} options={['심함', '중간', '약함']} onChange={(x) => upd('sleepHabit', x)} />
          </ChecklistRow>
          <ChecklistRow label="코골이" required>
            <ChipPick value={v.snore} options={['심함', '중간', '약함~없음']} onChange={(x) => upd('snore', x)} />
          </ChecklistRow>
          <ChecklistRow label="샤워시간" required>
            <ChipPick value={v.shower} options={['아침', '저녁']} onChange={(x) => upd('shower', x)} />
          </ChecklistRow>
          <ChecklistRow label="방에서 취식" required>
            <ChipPick value={v.eating} options={['가능', '불가능', '가능+환기필수']} onChange={(x) => upd('eating', x)} />
          </ChecklistRow>
          <ChecklistRow label="소등" align="top" required>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <ChipPick value={v.lightsOut} options={['시간 지정', '한명 잘 때 알아서']} onChange={(x) => upd('lightsOut', x)} />
              {v.lightsOut === '시간 지정' &&
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--brand-soft)', borderRadius: 10, padding: '6px 10px', alignSelf: 'flex-start' }}>
                  <button
                  type="button"
                  onClick={() => upd('lightsOutHour', Math.max(0, v.lightsOutHour - 1))}
                  style={{ width: 26, height: 26, borderRadius: 7, border: 0, background: 'var(--surface)', color: 'var(--brand-deep)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  −</button>
                  <span style={{ minWidth: 70, textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'var(--brand-deep)' }}>{v.lightsOutHour}시 이후</span>
                  <button
                  type="button"
                  onClick={() => upd('lightsOutHour', Math.min(24, v.lightsOutHour + 1))}
                  style={{ width: 26, height: 26, borderRadius: 7, border: 0, background: 'var(--surface)', color: 'var(--brand-deep)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  +</button>
                </div>
              }
            </div>
          </ChecklistRow>
          <ChecklistRow label="본가 주기" required>
            <ChipPick value={v.visitHome} options={['매주', '2주', '한달이상', '거의 안 감']} onChange={(x) => upd('visitHome', x)} />
          </ChecklistRow>
          <ChecklistRow label="흡연" required>
            <ChipPick value={v.smoke} options={['연초', '전자담배', '비흡연']} onChange={(x) => upd('smoke', x)} />
          </ChecklistRow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <div style={{ width: 76, flexShrink: 0, fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>
              냉장고<span style={{ color: 'var(--brand)', marginLeft: 3, fontWeight: 700 }}>*</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ChipPick value={v.fridge} options={['대여·구매·보유', '협의 후 결정', '필요 없음']} onChange={(x) => upd('fridge', x)} />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div style={{ padding: '4px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-0.4px' }}>추가 규칙</h2>
          <span className="chip line" style={{ fontSize: 10, padding: '3px 8px', fontWeight: 700 }}>선택</span>
        </div>
        <div className="card" style={{ padding: '0 16px', marginBottom: 16 }}>
          <ChecklistRow label="드라이기 제한" align="top">
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: v.dryer ? 8 : 0 }}>
                <span onClick={() => upd('dryer', null)} className={!v.dryer ? 'chip ink' : 'chip line'} style={{ fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>제한 없음</span>
                <span onClick={() => upd('dryer', v.dryer || { start: 12, end: 19 })} className={v.dryer ? 'chip ink' : 'chip line'} style={{ fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>제한 시간</span>
              </div>
              {v.dryer && <TimeRangeSelect value={v.dryer} onChange={(x) => upd('dryer', x)} />}
            </div>
          </ChecklistRow>
          <ChecklistRow label="알람">
            <ChipPick value={v.alarm} options={['진동', '소리']} onChange={(x) => upd('alarm', x)} />
          </ChecklistRow>
          <ChecklistRow label="이어폰">
            <ChipPick value={v.earphone} options={['항상', '유동적']} onChange={(x) => upd('earphone', x)} />
          </ChecklistRow>
          <ChecklistRow label="키스킨">
            <ChipPick value={v.skinCare} options={['항상', '유동적']} onChange={(x) => upd('skinCare', x)} />
          </ChecklistRow>
          <ChecklistRow label="무소음 마우스">
            <ChipPick value={v.silentMouse} options={['사용', '미사용', '유동적']} onChange={(x) => upd('silentMouse', x)} />
          </ChecklistRow>
          <ChecklistRow label="더위">
            <ChipPick value={v.hot} options={['많이 탐', '중간', '적게 탐']} onChange={(x) => upd('hot', x)} />
          </ChecklistRow>
          <ChecklistRow label="추위">
            <ChipPick value={v.cold} options={['많이 탐', '중간', '적게 탐']} onChange={(x) => upd('cold', x)} />
          </ChecklistRow>
          <ChecklistRow label="공부">
            <ChipPick value={v.study} options={['기숙사 밖', '기숙사 안', '유동적']} onChange={(x) => upd('study', x)} />
          </ChecklistRow>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
            <div style={{ width: 76, flexShrink: 0, fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>쓰레기통</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ChipPick value={v.trash} options={['개별', '공유']} onChange={(x) => upd('trash', x)} />
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div style={{
          background: 'var(--brand-soft)', borderRadius: 12, padding: '10px 14px',
          fontSize: 12, color: 'var(--brand-deep)', lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16
        }}>
          <span>생활 패턴 항목은 모집방을 만들기 위해 모두 작성해야 해요.<br/>추가 규칙은 선택이에요.</span>
        </div>

        <div style={{ height: 100 }} />
      </div>

      {isRoomCreate &&
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px'  , background: 'transparent', display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/rooms/create/1')} className="btn ghost" style={{ width: 80, height: 52 }}>이전</button>
          <button onClick={() => { saveCreateRoomRuleDraft(v); navigate('/rooms/create/3'); }} className="btn full" style={{ flex: 1, height: 52 }}>다음</button>
        </div>
      }
      {isRoomEdit &&
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/rooms/checklist')} className="btn ghost" style={{ width: 80, height: 52 }}>취소</button>
          <button onClick={saveRoomRule} disabled={roomRuleLoading || roomRuleSaving || !roomContext} className="btn full" style={{ flex: 1, height: 52, opacity: roomRuleLoading || roomRuleSaving || !roomContext ? 0.45 : 1 }}>{roomRuleSaving ? '저장 중...' : '저장'}</button>
        </div>
      }
      {!isRoom &&
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'linear-gradient(180deg, transparent 0%, var(--bg) 30%)' }}>
          <button onClick={savePersonalChecklist} disabled={personalLoading || personalSaving} className="btn full" style={{ height: 52, opacity: personalLoading || personalSaving ? 0.45 : 1 }}>{personalSaving ? '저장 중...' : '저장'}</button>
        </div>
      }
    </div>);

}

// ─── Create-room Step 3: Preview & publish ──────────────────
const CREATE_ROOM_DRAFT_KEY = 'dorumdorum:create-room-draft';
const CREATE_ROOM_RULE_DRAFT_KEY = 'dorumdorum:create-room-rule-draft';
const PROFILE_STORAGE_KEY = 'dorumdorum:profile';
const DEFAULT_CREATE_ROOM_DRAFT = {
  title: '',
  dorm: '2생활관',
  roomSize: '4인실',
  residencePeriod: 'SEMESTER',
  notes: '',
};
const LEGACY_CREATE_ROOM_DRAFT = {
  title: '아침형 룸메 구해요',
  notes: '아침 7시쯤 일어나는 사람이면 좋아요. 청소는 일주일에 두 번 같이 하면 좋겠어요.',
};

const RESIDENCE_PERIOD_OPTIONS = [
  { key: 'SEMESTER', label: '학기', sub: '16주' },
  { key: 'HALF_YEAR', label: '반기', sub: '24주' },
  { key: 'SEASONAL', label: '계절학기', sub: '' },
];
export const CREATE_ROOM_DORMS = [
  { name: '1생활관', sizesLabel: '1·2·3인실', sizes: ['1인실', '2인실', '3인실'] },
  { name: '2생활관', sizesLabel: '1·2·4인실', sizes: ['1인실', '2인실', '4인실'] },
  { name: '3생활관', sizesLabel: '2·4인실', sizes: ['2인실', '4인실'] },
  { name: '메디컬', sizesLabel: '1·2·3·4인실', sizes: ['1인실', '2인실', '3인실', '4인실'] },
];
export const ROOM_SIZE_OPTIONS = ['1인실', '2인실', '3인실', '4인실'];

function withChecklistDefaults(value = {}) {
  return Object.fromEntries(
    Object.entries(defaultRoomChecklistForm).map(([key, fallback]) => [
      key,
      value[key] == null ? fallback : value[key],
    ]),
  );
}

function readCreateRoomDraft() {
  if (typeof window === 'undefined') return DEFAULT_CREATE_ROOM_DRAFT;
  try {
    const saved = window.sessionStorage.getItem(CREATE_ROOM_DRAFT_KEY);
    if (!saved) return DEFAULT_CREATE_ROOM_DRAFT;
    const draft = { ...DEFAULT_CREATE_ROOM_DRAFT, ...JSON.parse(saved) };
    return {
      ...draft,
      title: draft.title === LEGACY_CREATE_ROOM_DRAFT.title ? '' : draft.title,
      notes: draft.notes === LEGACY_CREATE_ROOM_DRAFT.notes ? '' : draft.notes,
    };
  } catch {
    return DEFAULT_CREATE_ROOM_DRAFT;
  }
}

function readCreateRoomRuleDraft() {
  if (typeof window === 'undefined') return defaultRoomChecklistForm;
  try {
    const saved = window.sessionStorage.getItem(CREATE_ROOM_RULE_DRAFT_KEY);
    return saved ? withChecklistDefaults(JSON.parse(saved)) : defaultRoomChecklistForm;
  } catch {
    return defaultRoomChecklistForm;
  }
}

function saveCreateRoomRuleDraft(value) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CREATE_ROOM_RULE_DRAFT_KEY, JSON.stringify(withChecklistDefaults(value)));
}

function readCachedProfileName() {
  if (typeof window === 'undefined') return '방장';
  try {
    const profile = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    return profile.displayName || profile.accountName || '방장';
  } catch {
    return '방장';
  }
}

export function CreateRoomStep3Screen() {
  const navigate = useNavigate();
  const draft = readCreateRoomDraft();
  const ruleDraft = readCreateRoomRuleDraft();
  const capacity = Number.parseInt(draft.roomSize, 10) || 4;
  const hostName = readCachedProfileName();
  const previewTitle = draft.title?.trim();
  const previewNotes = draft.notes?.trim();
  const canPublish = previewTitle.length > 0;
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  const publishRoom = () => {
    if (submitting) return;
    if (!canPublish) {
      setSubmitError('모집글 제목을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    createRoom(createRoomDraftToRequest(draft, ruleDraft))
      .then(() => navigate('/rooms/create/success', { state: { draft } }))
      .catch((error) => {
        setSubmitError(error?.message || '모집방을 등록하지 못했어요.');
        setSubmitting(false);
      });
  };

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="모집방 만들기" backTo="/rooms/create/2" collapsible={false} />

      <div style={{ padding: '0 20px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
          <span>3 / 3 단계</span>
          <span>미리보기</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'var(--brand)' }} />
        </div>
      </div>

      <div style={{ padding: '12px 20px 4px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.35 }}>
          이대로 모집글을 올릴까요?
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
          신청자에게 이렇게 보여요. 언제든 수정할 수 있어요.
        </div>
      </div>

      <div className="scroll" style={{ padding: '14px 16px 0' }}>
        {/* Preview card */}
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.4px', marginBottom: 8 }}>미리보기</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: previewTitle ? 'var(--ink)' : 'var(--ink-3)' }}>{previewTitle || '모집글 제목을 입력해주세요.'}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>{draft.dorm} · {draft.roomSize}</div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, marginTop: 12 }}>
            {previewNotes || '방장의 한마디가 비어 있어요.'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
            <Avatar name={hostName} size={28} />
            <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>방장 · <b>{hostName}</b></span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>1/{capacity} 모집중</span>
          </div>
        </div>

        {/* Summary */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 4 }}>
          {[
          { l: '기본 정보', v: `${previewTitle || '제목 미입력'} · ${draft.dorm} ${draft.roomSize}`, i: 1 },
          { l: '방 체크리스트', v: '작성한 체크리스트가 반영돼요', i: 2 }].
          map((r, i, a) =>
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 14px',
            borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)'
          }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{r.l}</div>
                <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.v}</div>
              </div>
              {r.i &&
            <button
              type="button"
              onClick={() => navigate(`/rooms/create/${r.i}`)}
              style={{ background: 'transparent', border: 0, padding: 0, fontSize: 12, fontWeight: 700, color: 'var(--brand)', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {r.i}단계 수정
            </button>
            }
            </div>
          )}
        </div>

        <div style={{ height: 110 }} />
      </div>

      {submitError &&
      <div style={{ position: 'absolute', left: 16, right: 16, bottom: 78, color: 'var(--danger)', fontSize: 13, textAlign: 'center', lineHeight: 1.4 }}>
          {submitError}
        </div>
      }

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px'  , background: 'transparent', display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('/rooms/create/2')} className="btn ghost" style={{ width: 80, height: 52 }}>이전</button>
        <button onClick={publishRoom} disabled={submitting || !canPublish} className="btn full" style={{ flex: 1, height: 52, opacity: submitting || !canPublish ? 0.6 : 1 }}>{submitting ? '등록 중...' : '모집방 올리기'}</button>
      </div>
    </div>);

}

// ─── Create recruitment room — Step 1: Basic info ───────────
export function CreateRoomScreen() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState(readCreateRoomDraft);
  const selectedDorm = CREATE_ROOM_DORMS.find((d) => d.name === form.dorm) || CREATE_ROOM_DORMS[1];
  const titleMax = 30;
  const noteMax = 180;
  const canGoNext = form.title.trim().length > 0;

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(CREATE_ROOM_DRAFT_KEY, JSON.stringify(form));
    }
  }, [form]);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectDorm = (dorm) => {
    setForm((prev) => ({
      ...prev,
      dorm: dorm.name,
      roomSize: dorm.sizes.includes(prev.roomSize) ? prev.roomSize : dorm.sizes[0],
    }));
  };

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="모집방 만들기" backTo="/rooms/find" collapsible={false} />

      <div style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
          <span>1 / 3 단계</span>
          <span>기본 정보</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden' }}>
          <div style={{ width: '33%', height: '100%', background: 'var(--brand)' }} />
        </div>
      </div>

      <div className="scroll" style={{ padding: '8px 20px 0' }}>
        <h1 style={{ margin: '4px 0 14px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
          어떤 룸메이트를<br />찾으시나요?
        </h1>


        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>모집글 제목</label>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{form.title.length} / {titleMax}</span>
            </div>
            <input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              maxLength={titleMax}
              placeholder="예: 아침형 룸메 구해요"
              style={{
                width: '100%',
                background: 'var(--surface)',
                border: '1.5px solid var(--brand)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                color: 'var(--ink)',
                fontWeight: 600,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>기숙사</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CREATE_ROOM_DORMS.map((d) => {
                const selected = d.name === form.dorm;
                return (
                  <button key={d.name} type="button" onClick={() => selectDorm(d)} style={{
                background: selected ? 'var(--brand-soft)' : 'var(--surface)',
                border: selected ? '1.5px solid var(--brand)' : '1.5px solid var(--line)',
                borderRadius: 12, padding: '12px 14px', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer'
              }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--brand-deep)' : 'var(--ink)' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: selected ? 'var(--brand-deep)' : 'var(--ink-3)', marginTop: 3, opacity: 0.75, fontWeight: 500 }}>{d.sizesLabel}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>모집 인원 <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>· {selectedDorm.name} 선택 가능</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROOM_SIZE_OPTIONS.map((size) => {
                const disabled = !selectedDorm.sizes.includes(size);
                const selected = form.roomSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => update('roomSize', size)}
                    className={"chip " + (selected ? 'ink' : 'line')}
                    style={{
                flex: 1, justifyContent: 'center', fontSize: 14, padding: '10px 0', borderRadius: 12,
                opacity: disabled ? 0.35 : 1,
                textDecoration: disabled ? 'line-through' : 'none',
                border: selected ? 0 : '1px solid var(--line-2)',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}>{size}</button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>거주기간</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {RESIDENCE_PERIOD_OPTIONS.map((opt) => {
                const selected = form.residencePeriod === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => update('residencePeriod', opt.key)}
                    style={{
                      flex: 1, borderRadius: 12, padding: '10px 0', fontFamily: 'inherit', cursor: 'pointer',
                      background: selected ? 'var(--brand-soft)' : 'var(--surface)',
                      border: selected ? '1.5px solid var(--brand)' : '1.5px solid var(--line)',
                      color: selected ? 'var(--brand-deep)' : 'var(--ink)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{opt.label}{opt.sub && <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, marginLeft: 4 }}>({opt.sub})</span>}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>방장의 한마디 <span style={{ color: 'var(--ink-4)', fontWeight: 500 }}>(선택)</span></label>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{(form.notes || '').length} / {noteMax}</span>
            </div>
            <textarea
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              maxLength={noteMax}
              placeholder="예: 생활 패턴이 잘 맞는 분이면 좋아요."
              style={{
                width: '100%',
                minHeight: 96,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                color: 'var(--ink)',
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>

      <div style={{ padding: '14px 16px'  , background: 'transparent' }}>
        <button onClick={() => { if (canGoNext) navigate('/rooms/create/2'); }} disabled={!canGoNext} className="btn full" style={{ height: 52, opacity: canGoNext ? 1 : 0.45 }}>다음</button>
      </div>
    </div>);

}

// ─── Applicant detail (host viewing applicant's checklist) ──
export function ApplicantDetailScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const applicant = state?.applicant;
  const roomNo = state?.roomNo;
  const [confirmAction, setConfirmAction] = React.useState(null);

  const openDirectChat = () => {
    if (!roomNo || !applicant?.userNo) { alert('정보를 불러올 수 없어요.'); return; }
    getOrCreateDirectChatRoom(roomNo, applicant.userNo)
      .then((chatRoomNo) => navigate('/chat/dm/' + chatRoomNo))
      .catch((e) => alert(e?.message || '채팅방을 열 수 없어요.'));
  };

  const completeDecision = () => {
    if (!confirmAction || !applicant) return;
    const call = confirmAction === 'accept'
      ? approveApplication(roomNo, applicant.requestNo)
      : rejectApplication(applicant.requestNo);
    call
      .then(() => navigate(confirmAction === 'accept' ? '/rooms/members' : '/rooms/applicants'))
      .catch((e) => alert(e?.message || '처리 중 오류가 발생했어요.'));
  };

  if (!applicant) {
    return (
      <div className="screen">
        <StatusBar />
        <TopNav title="신청자 정보" backTo="/rooms/applicants" />
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>신청자 정보를 불러올 수 없어요.</div>
      </div>
    );
  }

  const displayName = applicant.nickname || applicant.name;
  const displayMeta = [applicant.major, applicant.grade ? applicant.grade + '학년' : null].filter(Boolean).join(' ');

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="신청자 정보" backTo="/rooms/applicants" />

      <div className="scroll">
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={displayName} size={64} style={{ fontSize: 26 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 19, fontWeight: 700 }}>{displayName}</span>
            </div>
            {displayMeta && <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 2 }}>{displayMeta}</div>}
            {applicant.createdAt && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                {new Date(applicant.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 신청
              </div>
            )}
          </div>
        </div>

        {(applicant.introduction || applicant.additionalMessage) && (
          <>
            <div className="h-section"><h2>신청 메시지</h2></div>
            <div className="card" style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-2)', margin: '0 16px', padding: 16 }}>
              {applicant.additionalMessage || applicant.introduction}
            </div>
          </>
        )}

        <div style={{ height: 110 }} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <button onClick={() => setConfirmAction('reject')} className="btn ghost" style={{ flex: 1, height: 52 }}>거절</button>
        <button onClick={openDirectChat} className="btn ghost" style={{ width: 52, height: 52, padding: 0 }}><Icon.chat size={22} /></button>
        <button onClick={() => setConfirmAction('accept')} className="btn full" style={{ flex: 1, height: 52 }}>수락</button>
      </div>

      {confirmAction && (
        <div onClick={() => setConfirmAction(null)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(23,24,28,0.28)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 16px 30px', boxShadow: '0 -16px 40px rgba(23,24,28,0.14)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 2px 18px' }}>
              <Avatar name={displayName} size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>
                  {confirmAction === 'accept' ? '신청을 수락할까요?' : '신청을 거절할까요?'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{displayName}{displayMeta ? ' · ' + displayMeta : ''}</div>
              </div>
            </div>
            <div style={{ borderRadius: 14, background: 'var(--surface-2)', padding: 14, fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)', marginBottom: 12 }}>
              {confirmAction === 'accept'
                ? `수락하면 ${displayName}님이 방 멤버로 이동하고 신청은 완료 처리돼요.`
                : `거절하면 ${displayName}님의 신청이 목록에서 사라져요. 다시 되돌릴 수 없어요.`}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setConfirmAction(null)} className="btn ghost" style={{ width: 92, height: 52 }}>취소</button>
              <button
                type="button"
                onClick={completeDecision}
                className="btn full"
                style={{ flex: 1, height: 52, background: confirmAction === 'accept' ? 'var(--brand)' : 'var(--danger)' }}
              >
                {confirmAction === 'accept' ? '수락하기' : '거절하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notice list/detail ─────────────────────────────────────
export const NOTICES = [
  { id: 1, tag: '필독', tagBrand: true, title: '6월 입사식 일정 안내', desc: '5월 28일 18:00 다목적실 B동 1층 집합', date: '05.21', read: false },
  { id: 2, tag: '안전', title: '소화기 점검으로 인한 알람 테스트 안내', desc: 'B동 전체 소방 점검이 5월 24일 진행돼요', date: '05.20', read: false },
  { id: 3, tag: '시설', title: 'B동 세탁실 4번 기기 교체 완료', desc: '교체 완료 후 정상 이용 가능해요', date: '05.18', read: true },
  { id: 4, tag: '행사', title: '룸메이트 매칭 데이 안내', desc: '5월 25일 오후 7시 라운지에서 진행돼요', date: '05.17', read: true },
  { id: 5, tag: '생활', title: '공용 냉장고 정리 일정', desc: '이름이 없는 음식은 정리될 수 있어요', date: '05.15', read: true },
];

function formatNoticeDate(dateText, { long = false } = {}) {
  if (!dateText) return '';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  if (long) {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  }
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeNotice(notice) {
  return {
    id: notice.noticeNo || notice.id,
    noticeNo: notice.noticeNo || notice.id,
    tag: notice.tag || '공지',
    tagBrand: true,
    title: notice.title || '공지사항',
    desc: notice.content || notice.desc || '',
    content: notice.content || notice.desc || '',
    date: formatNoticeDate(notice.writtenDate || notice.date),
    writtenDate: notice.writtenDate,
    originalLink: notice.originalLink,
    read: true,
  };
}

export function NoticeListScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = React.useState('전체');
  const [notices, setNotices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const filters = ['전체', '공지'];
  const visibleNotices = filter === '전체' ? notices : notices.filter((notice) => notice.tag === filter);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    loadNotices()
      .then((list) => {
        if (!mounted) return;
        setNotices((Array.isArray(list) ? list : []).map(normalizeNotice));
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
        setNotices(NOTICES.map(normalizeNotice));
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="공지사항" backTo="/" />

      <div className="scroll" style={{ padding: '0 16px 24px' }}>
        <div style={{ padding: '4px 4px 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>공지사항</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>생활관 안내와 중요한 일정을 확인해요</div>
        </div>

        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 12 }}>
          {filters.map((item) => {
            const active = filter === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={"chip " + (active ? 'ink' : 'line')}
                style={{ fontSize: 13, padding: '7px 12px', border: active ? 0 : '1px solid var(--line-2)', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {visibleNotices.map((notice, index) => (
            <button
              key={notice.id}
              type="button"
              onClick={() => navigate(`/notice/${notice.noticeNo || notice.id}`, { state: { notice } })}
              style={{
                width: '100%',
                border: 0,
                background: 'transparent',
                padding: '15px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                textAlign: 'left',
                borderBottom: index === visibleNotices.length - 1 ? 'none' : '1px solid var(--line)',
                fontFamily: 'inherit',
                cursor: 'pointer',
              }}
            >
              <span className={"chip" + (notice.tagBrand ? ' brand' : '')} style={{ fontSize: 11, padding: '3px 8px', marginTop: 1 }}>{notice.tag}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {!notice.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0 }} />}
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notice.title}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.45 }}>{notice.desc}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600, flexShrink: 0 }}>{notice.date}</span>
            </button>
          ))}
          {!loading && visibleNotices.length === 0 && (
            <div style={{ padding: 22, textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>
              공지사항이 없어요.
            </div>
          )}
        </div>
        {loading && <div style={{ padding: 18, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>}
        {error && <div style={{ padding: 12, textAlign: 'center', color: 'var(--ink-3)', fontSize: 12 }}>공지 API 연결에 실패해 임시 데이터를 표시했어요.</div>}
      </div>
    </div>
  );
}

export function NoticeDetailScreen() {
  const { id } = useParams();
  const { state } = useLocation();
  const [notice, setNotice] = React.useState(() => state?.notice ? normalizeNotice(state.notice) : null);
  const [loading, setLoading] = React.useState(!state?.notice);

  React.useEffect(() => {
    if (notice || !id) return undefined;
    let mounted = true;
    loadNotices()
      .then((list) => {
        if (!mounted) return;
        const found = (Array.isArray(list) ? list : []).map(normalizeNotice).find((item) => String(item.noticeNo) === String(id));
        setNotice(found || null);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id, notice]);

  return (
	    <div className="screen" style={{ background: 'var(--surface)' }}>
	      <StatusBar />
	      <TopNav title="공지사항" backTo="/notices" />

      <div className="scroll" style={{ padding: '8px 20px 30px' }}>
        {loading && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>}
        {!loading && !notice && <div style={{ padding: 32, textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>공지사항을 찾을 수 없어요.</div>}
        {!loading && notice && (
        <>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <span className="chip brand" style={{ fontSize: 11, padding: '3px 9px' }}>{notice.tag}</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.4px' }}>
          {notice.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12, color: 'var(--ink-3)' }}>
          <Avatar name="사" size={22} style={{ fontSize: 11 }} />
          <span>사감팀</span>
          <span>·</span>
          <span>{formatNoticeDate(notice.writtenDate, { long: true }) || notice.date}</span>
        </div>

        <div style={{ height: 1, background: 'var(--line)', margin: '18px 0' }} />

        <div style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>
          {(notice.content || '본문이 없어요.').split('\n').map((line, index) => (
            <p key={index} style={{ margin: index === 0 ? '0 0 16px' : '0 0 12px' }}>{line}</p>
          ))}
          {notice.originalLink && (
            <a href={notice.originalLink} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)', fontWeight: 700, fontSize: 14 }}>
              원문 보기
            </a>
          )}
        </div>
        </>
        )}

      </div>
    </div>);

}

// ─── Notifications page (bell icon target) ─────────────────
const NOTIFICATION_ICON = {
  ROOM_APPLICATION_RECEIVED: 'user',
  ROOM_APPLICATION_APPROVED: 'door',
  ROOM_APPLICATION_REJECTED: 'bell',
  CHAT_MESSAGE_REQUEST: 'chat',
  CHAT_REQUEST_APPROVED: 'chat',
  CHAT_REQUEST_REJECTED: 'chat',
  NEW_MESSAGE_RECEIVED: 'chat',
};

function notificationIcon(type) {
  return NOTIFICATION_ICON[type] || 'bell';
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatNotificationTime(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (isSameDay(date, now)) return `${Math.floor(diffMin / 60)}시간 전`;

  const diffDay = Math.floor(diffMin / 60 / 24);
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`;
}

export function NotificationsScreen() {
  const navigate = useNavigate();
  const [items, setItems] = React.useState([]);
  const [cursor, setCursor] = React.useState(undefined);
  const [hasNext, setHasNext] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);

  const applyPage = React.useCallback((page, { append }) => {
    const pageItems = page?.items || [];
    setItems((prev) => (append ? [...prev, ...pageItems] : pageItems));
    setCursor(page?.nextCursor);
    setHasNext(Boolean(page?.hasNext));
  }, []);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    loadNotifications()
      .then((page) => {
        if (!mounted) return;
        applyPage(page, { append: false });
        setLoadError(false);
      })
      .catch(() => {
        if (mounted) setLoadError(true);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [applyPage]);

  React.useEffect(() => {
    const deviceId = getNotificationDeviceId();
    if (deviceId) registerNotificationDevice(deviceId).catch(() => {});
    const closeStream = openNotificationStream((notification) => {
      setItems((prev) => [{ ...notification, isRead: false }, ...prev]);
    });
    return closeStream;
  }, []);

  const hasUnread = items.some((item) => !item.isRead);

  const loadMore = () => {
    if (!hasNext || loading) return;
    setLoading(true);
    loadNotifications(cursor)
      .then((page) => applyPage(page, { append: true }))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  };

  const markOneRead = (notificationNo) => {
    setItems((prev) => prev.map((item) => (
      item.notificationNo === notificationNo ? { ...item, isRead: true } : item
    )));
    markNotificationRead(notificationNo).catch(() => {
      setItems((prev) => prev.map((item) => (
        item.notificationNo === notificationNo ? { ...item, isRead: false } : item
      )));
    });
  };

  const markAllRead = () => {
    const unread = items.filter((item) => !item.isRead);
    if (unread.length === 0) return;
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    markAllNotificationsRead().catch(() => {
      setItems((prev) => prev.map((item) => (
        unread.some((unreadItem) => unreadItem.notificationNo === item.notificationNo)
          ? { ...item, isRead: false }
          : item
      )));
    });
  };

  const openNotification = (n) => {
    if (!n.isRead) markOneRead(n.notificationNo);
    if (n.redirectPath) navigate(n.redirectPath);
  };

  const todayItems = items.filter((n) => isSameDay(new Date(n.createdAt), new Date()));
  const earlierItems = items.filter((n) => !isSameDay(new Date(n.createdAt), new Date()));

  const renderRow = (n, i, a) => {
    const I = Icon[notificationIcon(n.type)];
    return (
      <div
        key={n.notificationNo}
        role="button"
        tabIndex={0}
        onClick={() => openNotification(n)}
        onKeyDown={(e) => { if (e.key === 'Enter') openNotification(n); }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)', background: !n.isRead ? 'var(--brand-soft)' : 'transparent', cursor: 'pointer' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 10, background: !n.isRead ? 'var(--brand)' : 'var(--surface-2)', color: !n.isRead ? 'white' : 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I size={18} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: !n.isRead ? 600 : 500, color: !n.isRead ? 'var(--ink)' : 'var(--ink-2)' }}>{n.title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{formatNotificationTime(n.createdAt)}</span>
      </div>
    );
  };

  return (
    <div className="screen">
      <StatusBar />
      <TopNav
        title="알림"
        right={
          <button
            type="button"
            onClick={markAllRead}
            disabled={!hasUnread}
            style={{
              background: 'transparent',
              border: 0,
              padding: 8,
              fontSize: 13,
              color: hasUnread ? 'var(--brand)' : 'var(--ink-3)',
              fontWeight: 700,
              cursor: hasUnread ? 'pointer' : 'default',
              fontFamily: 'inherit',
              opacity: hasUnread ? 1 : 0.55,
            }}
          >
            모두 읽음
          </button>
        }
      />

      <div className="scroll" style={{ padding: '0 16px 24px' }}>
        {loadError && items.length === 0 && !loading && (
          <div style={{ padding: '32px 4px', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>알림을 불러오지 못했어요.</div>
        )}
        {!loadError && items.length === 0 && !loading && (
          <div style={{ padding: '32px 4px', textAlign: 'center', fontSize: 13, color: 'var(--ink-3)' }}>아직 받은 알림이 없어요.</div>
        )}

        {todayItems.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700, padding: '8px 4px 10px', letterSpacing: '0.3px' }}>오늘</div>
            <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
              {todayItems.map(renderRow)}
            </div>
          </>
        )}

        {earlierItems.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700, padding: '22px 4px 10px', letterSpacing: '0.3px' }}>이전 알림</div>
            <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
              {earlierItems.map(renderRow)}
            </div>
          </>
        )}

        {hasNext && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            style={{ width: '100%', marginTop: 16, padding: 12, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? '불러오는 중…' : '더 보기'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Notification settings ──────────────────────────────────
export function NotificationSettingsScreen() {
  const navigate = useNavigate();
  const [enabled, setEnabled] = React.useState(true);
  const [settings, setSettings] = React.useState({
    applicants: true,
    applicantResult: true,
    chat: true,
    notice: true,
    schedule: false,
  });

  const set = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const Toggle = ({ checked, onClick, disabled = false }) => (
    <button
      type="button"
      aria-pressed={checked}
      onClick={disabled ? undefined : onClick}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        border: 0,
        padding: 3,
        background: checked && !disabled ? 'var(--brand)' : 'var(--line-2)',
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background .16s ease',
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: checked ? 23 : 3,
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left .16s ease',
      }} />
    </button>
  );

  const SettingRow = ({ icon, title, desc, valueKey }) => {
    const I = Icon[icon];
    const active = settings[valueKey] && enabled;
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--line)',
        opacity: enabled ? 1 : 0.55,
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: active ? 'var(--brand-soft)' : 'var(--surface-2)',
          color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <I size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
        </div>
        <Toggle checked={settings[valueKey] && enabled} disabled={!enabled} onClick={() => set(valueKey)} />
      </div>
    );
  };

  const Section = ({ title, children }) => (
    <>
      <div className="h-section" style={{ marginTop: 22 }}>
        <h2>{title}</h2>
      </div>
      <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
        {children}
      </div>
    </>
  );

  return (
    <div className="screen">
      <StatusBar />
      <TopNav
        title="알림 설정"
        backTo="/me"
        right={<button onClick={() => navigate('/me')} style={{ background: 'transparent', border: 0, fontSize: 14, color: 'var(--brand)', fontWeight: 700, padding: 8, cursor: 'pointer' }}>완료</button>}
      />

      <div className="scroll" style={{ paddingBottom: 28 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
            필요한 알림만 받을 수 있어요
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            방 신청, 채팅, 기숙사 공지 알림을 따로 조절해요.
          </div>
        </div>

        <div style={{ margin: '0 16px' }}>
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14, background: enabled ? 'var(--ink)' : 'var(--surface)' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background: enabled ? 'var(--brand)' : 'var(--surface-2)',
              color: enabled ? 'white' : 'var(--ink-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon.bell size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: enabled ? 'white' : 'var(--ink)' }}>전체 알림</div>
              <div style={{ fontSize: 12, color: enabled ? 'rgba(255,255,255,0.62)' : 'var(--ink-3)', marginTop: 3 }}>
                모든 앱 알림을 한 번에 켜고 꺼요
              </div>
            </div>
            <Toggle checked={enabled} onClick={() => setEnabled(!enabled)} />
          </div>
        </div>

        <Section title="방과 신청">
          <SettingRow icon="user" title="새 신청자" desc="내 모집방에 누군가 신청하면 알려줘요" valueKey="applicants" />
          <SettingRow icon="check" title="신청 결과" desc="수락, 거절, 대기 상태 변경을 알려줘요" valueKey="applicantResult" />
        </Section>

        <Section title="채팅과 공지">
          <SettingRow icon="chat" title="채팅 메시지" desc="1:1 채팅과 방 단체 채팅 알림을 받아요" valueKey="chat" />
          <SettingRow icon="bell" title="공지사항" desc="필독 공지와 생활관 안내를 알려줘요" valueKey="notice" />
          <SettingRow icon="moon" title="기숙사 일정" desc="점호, 소등, 청소 일정 알림을 받아요" valueKey="schedule" />
        </Section>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

// ─── Account & verification settings ────────────────────────
export function AccountSettingsScreen() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [profile, setProfile] = React.useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  React.useEffect(() => {
    let mounted = true;
    getMe()
      .then((nextProfile) => {
        if (!mounted) return;
        setProfile({
          displayName: nextProfile.nickname || nextProfile.name || '',
          accountName: nextProfile.name || '',
          email: nextProfile.email || '',
          department: nextProfile.major || '',
          studentId: nextProfile.studentNo || '',
          grade: nextProfile.grade || '',
        });
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutUser();
    } finally {
      navigate('/', { replace: true });
    }
  };

  const InfoRow = ({ label, value, sub, action }) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 15, color: 'var(--ink)', fontWeight: 700, marginTop: 3 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{sub}</div>}
      </div>
      {action && (
        <button
          type="button"
          style={{
            background: 'var(--surface-2)',
            border: 0,
            borderRadius: 10,
            padding: '8px 11px',
            color: 'var(--ink-2)',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {action}
        </button>
      )}
    </div>
  );

  const MenuRow = ({ icon, title, desc, right, onClick }) => {
    const I = Icon[icon];
    return (
      <div onClick={onClick} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: '1px solid var(--line)',
        cursor: onClick ? 'pointer' : 'default',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <I size={18} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{desc}</div>
        </div>
        {right && <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 600 }}>{right}</span>}
        <Icon.chevron size={14} />
      </div>
    );
  };

  return (
    <div className="screen">
      <StatusBar />
      <TopNav
        title="계정 및 인증"
        backTo="/me"
        right={<button onClick={() => navigate('/me')} style={{ background: 'transparent', border: 0, fontSize: 14, color: 'var(--brand)', fontWeight: 700, padding: 8, cursor: 'pointer' }}>완료</button>}
      />

      <div className="scroll" style={{ paddingBottom: 28 }}>
        <div style={{ padding: '4px 20px 16px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
            학교 인증과 계정 정보를 관리해요
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            학교 인증으로 확인된 정보라 앱에서 직접 수정할 수 없어요.
          </div>
        </div>

        <div style={{ margin: '0 16px 16px' }}>
          <div className="card" style={{ padding: 16, background: 'var(--ink)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon.check size={24} weight={2.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>학교 인증 완료</span>
                  <span style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 700 }}>재학생</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.62)', marginTop: 4 }}>{profile.email || '학교 이메일'}</div>
              </div>
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.10)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.62)' }}>
              <span>최근 인증</span>
              <span>2026.05.21</span>
            </div>
          </div>
        </div>

        <div className="h-section"><h2>계정 정보</h2></div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          <InfoRow label="이름" value={profile.accountName || '-'} sub="실명 인증 정보" />
          <InfoRow label="학번" value={profile.studentId || '-'} sub="같은 방 멤버에게만 표시" />
          <InfoRow label="학과" value={[profile.department, profile.grade].filter(Boolean).join(' ') || '-'} sub="학교 인증 정보" />
          <InfoRow label="닉네임" value={profile.displayName || '-'} sub="인증된 계정 정보" />
        </div>

        <div style={{ margin: '14px 16px 0', background: 'var(--brand-soft)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--brand-deep)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flexShrink: 0 }}>
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 600 }}>
            계정 정보 변경이 필요하면 학교 인증을 다시 진행해야 해요.
          </div>
        </div>

        <div className="h-section"><h2>로그인과 보안</h2></div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          <MenuRow icon="settings" title="비밀번호 변경" desc="마지막 변경 32일 전" onClick={() => navigate('/find-password', { state: { mode: 'change-password', backTo: '/settings/account', doneTo: '/settings/account' } })} />
          <MenuRow icon="check" title="자동 로그인" desc="현재 기기에서 유지 중" right="켜짐" />
        </div>

        <div className="h-section"><h2>계정 관리</h2></div>
        <div style={{ margin: '0 16px 24px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--line)', cursor: isLoggingOut ? 'default' : 'pointer', opacity: isLoggingOut ? 0.6 : 1 }}>
            <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
            <Icon.chevron size={14} />
          </div>
          <div onClick={() => navigate('/settings/account/delete')} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
            <span style={{ flex: 1, fontSize: 15, color: 'var(--danger)', fontWeight: 600 }}>계정 탈퇴</span>
            <Icon.chevron size={14} />
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Delete account ─────────────────────────────────────────
export function DeleteAccountScreen() {
  const navigate = useNavigate();
  const [reason, setReason] = React.useState('');
  const [confirmText, setConfirmText] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const reasons = ['졸업했어요', '서비스를 자주 쓰지 않아요', '원하는 기능이 부족해요', '개인정보가 걱정돼요', '다른 이유'];
  const canDelete = reason && confirmed && confirmText.trim() === '탈퇴';

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="계정 탈퇴" backTo="/settings/account" />

      <div className="scroll" style={{ padding: '4px 20px 156px' }}>
        <div style={{ padding: '6px 0 18px' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
            계정을 탈퇴하기 전에
            <br />확인해주세요
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            탈퇴 후에는 내 프로필, 신청 내역, 북마크와 채팅 기록을 복구할 수 없어요.
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 18, background: '#FFF4F3', color: 'var(--danger)' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>삭제되는 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {['프로필 및 학교 인증 정보', '내 체크리스트와 모집방 정보', '신청 내역과 북마크', '채팅 및 룸메이트 기록'].map((item) => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 800, marginBottom: 8 }}>탈퇴 사유</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reasons.map((item) => {
              const selected = reason === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setReason(item)}
                  style={{
                    minHeight: 46,
                    borderRadius: 13,
                    border: selected ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                    background: selected ? 'var(--brand-soft)' : 'var(--surface)',
                    color: selected ? 'var(--brand-deep)' : 'var(--ink-2)',
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                    padding: '0 14px',
                  }}
                >{item}</button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', fontWeight: 800, marginBottom: 8 }}>확인 문구 입력</label>
          <input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="탈퇴"
            style={{
              width: '100%',
              border: '1.5px solid var(--line)',
              borderRadius: 13,
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 700,
              outline: 0,
              padding: '13px 14px',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6 }}>계속하려면 ‘탈퇴’를 입력해주세요.</div>
        </div>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--surface)', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} style={{ marginTop: 2, accentColor: 'var(--brand)' }} />
          <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, fontWeight: 700 }}>
            탈퇴 후 계정과 이용 기록을 복구할 수 없다는 점을 확인했어요.
          </span>
        </label>
        <div style={{ height: 28 }} />
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <button onClick={() => navigate('/settings/account')} className="btn ghost" style={{ width: 86, height: 52 }}>취소</button>
        <button
          type="button"
          disabled={!canDelete}
          onClick={() => navigate('/', { replace: true })}
          className="btn full"
          style={{
            flex: 1,
            height: 52,
            background: canDelete ? 'var(--danger)' : 'var(--surface-2)',
            color: canDelete ? 'white' : 'var(--ink-4)',
            cursor: canDelete ? 'pointer' : 'default',
          }}
        >계정 탈퇴</button>
      </div>
    </div>
  );
}

// ─── Customer support ───────────────────────────────────────
export function SupportScreen() {
  const navigate = useNavigate();
  const [category, setCategory] = React.useState('앱 이용');
  const [message, setMessage] = React.useState('');
  const maxLength = 500;
  const categories = ['앱 이용', '매칭/신청', '계정/인증', '오류 및 사용자 신고'];

  return (
    <div className="screen">
      <StatusBar />
      <TopNav
        title="고객 문의"
        backTo="/me"
        right={<button onClick={() => navigate('/me')} style={{ background: 'transparent', border: 0, fontSize: 14, color: 'var(--brand)', fontWeight: 700, padding: 8, cursor: 'pointer' }}>완료</button>}
      />

      <div className="scroll" style={{ padding: '4px 20px 120px' }}>
        <div style={{ padding: '6px 0 18px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
            무엇을 도와드릴까요?
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            문의를 남기면 확인 후 앱 알림으로 답변드려요.
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon.chat size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>평균 답변 시간</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>평일 10:00 - 18:00 · 보통 1일 이내</div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 700, marginBottom: 8 }}>문의 유형</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {categories.map((c) => {
              const selected = c === category;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  style={{
                    minHeight: 44,
                    borderRadius: 12,
                    border: selected ? '1.5px solid var(--brand)' : '1px solid var(--line)',
                    background: selected ? 'var(--brand-soft)' : 'var(--surface)',
                    color: selected ? 'var(--brand-deep)' : 'var(--ink-2)',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>문의 내용</span>
            <span style={{ fontSize: 12, color: message.length > maxLength - 60 ? 'var(--brand)' : 'var(--ink-3)', fontWeight: 600 }}>{message.length} / {maxLength}</span>
          </label>
          <textarea
            value={message}
            maxLength={maxLength}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="문의 내용을 자세히 적어주세요."
            style={{
              width: '100%',
              minHeight: 170,
              resize: 'none',
              border: '1.5px solid var(--line)',
              outline: 'none',
              borderRadius: 16,
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: 15,
              lineHeight: 1.55,
              padding: 16,
            }}
          />
        </div>

      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'var(--surface)', borderTop: '1px solid var(--line)' }}>
        <button
          onClick={() => navigate('/me')}
          className="btn full"
          style={{ height: 52, opacity: message.trim() ? 1 : 0.55 }}
        >
          문의 보내기
        </button>
      </div>
    </div>
  );
}

// ─── 1:1 DM chat ────────────────────────────────────────────
export function ChatDMScreen() {
  const navigate = useNavigate();
  const { chatRoomNo } = useParams();
  const myUserNo = React.useMemo(() => getCachedUserNo(), []);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (!chatRoomNo) return;
    let alive = true;
    setLoading(true);
    loadChatMessages(chatRoomNo)
      .then((page) => {
        if (!alive) return;
        setMessages((page?.items || []).slice().reverse());
        setLoading(false);
      })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [chatRoomNo]);

  React.useEffect(() => {
    if (!chatRoomNo) return;
    let unsubMsg = () => {};
    let unsubRead = () => {};
    let alive = true;

    const pMsg = subscribe(`/topic/chat-room/${chatRoomNo}`, (incoming) => {
      if (!alive) return;
      setMessages((prev) => appendMessage(prev, incoming));
      if (incoming.senderNo !== myUserNo) markChatRoomRead(chatRoomNo).catch(() => {});
    });

    const pRead = subscribe(`/topic/chat-room/${chatRoomNo}/read`, (receipt) => {
      if (!alive) return;
      setMessages((prev) => applyReadReceipt(prev, receipt));
    });

    // 두 구독이 모두 준비된 뒤 읽음 처리 — 이 시점에 서버 broadcast를 수신할 수 있음
    Promise.all([pMsg, pRead]).then(([fnMsg, fnRead]) => {
      if (!alive) { fnMsg(); fnRead(); return; }
      unsubMsg = fnMsg;
      unsubRead = fnRead;
      markChatRoomRead(chatRoomNo).catch(() => {});
    });

    return () => { alive = false; unsubMsg(); unsubRead(); };
  }, [chatRoomNo, myUserNo]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const sendDMMessage = (text) => {
    publish(`/app/chat-room/${chatRoomNo}/send`, { content: text }).catch(() => {});
  };

  const handleLeave = () => {
    leaveChatRoom(chatRoomNo)
      .then(() => { setMenuOpen(false); navigate('/chat'); })
      .catch((e) => { alert(e?.message || '나갈 수 없어요.'); });
  };

  const partnerName = messages.find((m) => m.senderNo !== myUserNo)?.senderNickname || '상대방';

  return (
    <div className="screen" style={{ background: '#EDEEF1' }}>
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <StatusBar />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 12px' }}>
          <button onClick={() => goBack(navigate, '/chat')} style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
          <Avatar name={partnerName.slice(0, 1)} size={36} style={{ fontSize: 14 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{partnerName}</div>
          </div>
          <button onClick={() => setMenuOpen(true)} aria-label="채팅방 메뉴" style={{ background: 'transparent', border: 0, padding: 6, color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      <div className="scroll" ref={scrollRef} style={{ padding: '12px 12px 8px' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: 24 }}>불러오는 중…</div>}
        {!loading && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, padding: 24 }}>첫 메시지를 보내보세요.</div>
        )}
        {messages.map((m) => (
          <ChatMessageItem key={m.messageNo} message={m} myUserNo={myUserNo} />
        ))}
      </div>

      <ChatComposer onSend={sendDMMessage} disabled={loading} />
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'rgba(23,24,28,0.28)', display: 'flex', alignItems: 'flex-end' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface)', borderRadius: '22px 22px 0 0', padding: '10px 16px 30px', boxShadow: '0 -16px 40px rgba(23,24,28,0.14)' }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--line-2)', margin: '0 auto 14px' }} />
            <div style={{ padding: '0 2px 14px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>채팅방 메뉴</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{partnerName}님과의 대화</div>
            </div>
            <button
              type="button"
              onClick={handleLeave}
              style={{ width: '100%', minHeight: 52, border: 0, borderRadius: 14, background: 'rgba(226,69,60,0.08)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            >
              <span>대화방 나가기</span>
            </button>
            <button type="button" onClick={() => setMenuOpen(false)} className="btn full ghost" style={{ height: 48, marginTop: 12 }}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Apply message ──────────────────────────────────────────
export function ApplyMessageScreen() {
  const navigate = useNavigate();
  const { id = '1' } = useParams();
  const [message, setMessage] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');
  const maxLength = 300;

  const handleSubmit = () => {
    if (submitting) return;
    if (!message.trim()) { setSubmitError('신청 메시지를 입력해주세요.'); return; }
    setSubmitting(true);
    setSubmitError('');
    submitRoomApplication(id, message.trim())
      .then(() => navigate('/apply/success', { state: { roomNo: id } }))
      .catch((e) => { setSubmitError(e?.message || '신청에 실패했어요.'); setSubmitting(false); });
  };
  const suggestions = [
    '안녕하세요! 체크리스트가 잘 맞는 것 같아서 신청드립니다.',
    '조용히 지내는 편이고 청소 규칙도 잘 맞출 수 있어요.',
    '입주 전에 채팅으로 더 이야기해보고 싶어요.',
  ];

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="입주 신청" backTo={`/rooms/`} />

      <div className="scroll" style={{ padding: '4px 20px 120px' }}>
        <div style={{ padding: '6px 0 18px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
            방장에게 보낼<br />신청 메시지를 작성해요
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            메시지는 선택 사항이에요. 비워두고 바로 신청할 수도 있어요.
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.door size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>아침형 룸메 구해요</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>2생활관 · 4인실 · 방장 민지</div>
            </div>
            <span className="chip brand" style={{ fontSize: 11 }}>잘 맞아요</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>신청 메시지 <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>(선택)</span></span>
            <span style={{ fontSize: 12, color: message.length > maxLength - 30 ? 'var(--brand)' : 'var(--ink-3)', fontWeight: 600 }}>
              {message.length} / {maxLength}
            </span>
          </label>
          <textarea
            value={message}
            maxLength={maxLength}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예: 안녕하세요! 체크리스트가 잘 맞는 것 같아서 신청드립니다."
            style={{
              width: '100%',
              minHeight: 150,
              resize: 'none',
              border: '1.5px solid var(--line)',
              outline: 'none',
              borderRadius: 16,
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: 15,
              lineHeight: 1.55,
              padding: 16,
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.3px', marginBottom: 8 }}>빠른 문장</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMessage(s)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  color: 'var(--ink-2)',
                  fontSize: 13,
                  lineHeight: 1.45,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--brand-soft)', borderRadius: 14, padding: 14, display: 'flex', gap: 10, color: 'var(--brand-deep)' }}>
          <Icon.check size={18} weight={2.6} />
          <div style={{ fontSize: 12, lineHeight: 1.5, fontWeight: 600 }}>
            신청하면 방장이 내 체크리스트와 메시지를 함께 확인할 수 있어요.
          </div>
        </div>
      </div>

      {submitError && (
        <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{submitError}</div>
      )}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 16px 30px', background: 'var(--surface)', borderTop: '1px solid var(--line)', display: 'flex', gap: 8 }}>
        <button onClick={() => navigate(`/rooms/${id}`)} className="btn ghost" style={{ width: 84, height: 52 }}>취소</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="btn full"
          style={{ flex: 1, height: 52, opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? '신청 중...' : '신청 보내기'}
        </button>
      </div>
    </div>
  );
}

// ─── Apply success ──────────────────────────────────────────
export function ApplySuccessScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const roomNo = state?.roomNo;
  const openDirectChat = () => {
    if (!roomNo) { alert('방 정보를 불러올 수 없어요.'); return; }
    getOrCreateDirectChatRoom(roomNo, getCachedUserNo())
      .then((chatRoomNo) => navigate('/chat/dm/' + chatRoomNo))
      .catch((e) => alert(e?.message || '채팅방을 열 수 없어요.'));
  };

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      <StatusBar />
      <TopNav
        title=""
        backTo="/rooms/find"
        right={<button onClick={() => navigate('/rooms/find')} style={{ background: 'transparent', border: 0, fontSize: 14, color: 'var(--ink-3)', fontWeight: 600, padding: 8, cursor: 'pointer' }}>닫기</button>}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', gap: 24 }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <div className="success-halo" />
          <div className="success-badge">
            <svg className="success-check" width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>입주 신청이 완료됐어요</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>방장이 확인 후 24시간 내에<br />응답을 드릴 거예요</p>
        </div>

        <div style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 14, padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.door size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>아침형 룸메 구해요</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>2생활관 · 4인실</div>
            </div>
            <span className="chip brand" style={{ fontSize: 11 }}>대기중</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => openDirectChat()} className="btn full" style={{ height: 52 }}>방장과 채팅하기</button>
        <button onClick={() => navigate('/rooms/find')} className="btn full ghost" style={{ height: 52 }}>다른 방 둘러보기</button>
      </div>
    </div>);

}

// ─── Create Room Success ─────────────────────────────────────
export function CreateRoomSuccessScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const draft = state?.draft || readCreateRoomDraft();
  const title = draft.title || '모집방';
  const dorm = draft.dorm || '2생활관';
  const roomSize = draft.roomSize || '4인실';

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      <StatusBar />
      <TopNav
        title=""
        backTo="/myroom"
        right={<button onClick={() => navigate('/rooms/me')} style={{ background: 'transparent', border: 0, fontSize: 14, color: 'var(--ink-3)', fontWeight: 600, padding: 8, cursor: 'pointer' }}>닫기</button>}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', gap: 24 }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          <div className="success-halo" />
          <div className="success-badge">
            <svg className="success-check" width="54" height="54" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', fontFamily: 'var(--font-sans)' }}>모집방이 등록됐어요!</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>이제 신청자를 기다려 보세요.<br />신청이 오면 알림으로 알려드릴게요.</p>
        </div>

        <div style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 14, padding: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--ink)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon.door size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{dorm} · {roomSize}</div>
            </div>
            <span className="chip brand" style={{ fontSize: 11 }}>모집중</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 30px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => navigate('/rooms/me')} className="btn full" style={{ height: 52 }}>내 방 보러가기</button>
        <button onClick={() => navigate('/home')} className="btn full ghost" style={{ height: 52 }}>홈으로 돌아가기</button>
      </div>
    </div>
  );
}

// ─── My Applications List ────────────────────────────────────
export function MyApplicationsScreen() {
  const navigate = useNavigate();
  const [applications, setApplications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [cancelTarget, setCancelTarget] = React.useState(null);
  const [cancelling, setCancelling] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    loadMyAppliedRooms()
      .then((rooms) => {
        if (mounted) setApplications((Array.isArray(rooms) ? rooms : []).map(normalizeRoom));
      })
      .catch(() => { if (mounted) setError('신청 내역을 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const handleCancel = () => {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    cancelRoomApplication(cancelTarget)
      .then(() => {
        setApplications((prev) => prev.filter((a) => a.roomNo !== cancelTarget));
        setCancelTarget(null);
      })
      .catch((e) => alert(e?.message || '신청 취소에 실패했어요.'))
      .finally(() => setCancelling(false));
  };

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="신청 내역" backTo="/me" />

      <div className="scroll" style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>
        )}
        {!loading && error && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && applications.length === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '64px 0', gap: 12, color: 'var(--ink-4)',
          }}>
            <Icon.clipboard size={36} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>신청 내역이 없어요</span>
          </div>
        )}
        {!loading && !error && applications.map((app) => (
          <div key={app.roomNo} className="card" style={{ padding: 16 }}>
            {/* Room info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'var(--surface-2)',
                color: 'var(--ink-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon.door size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{app.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                  {app.dorm} · {app.size}
                </div>
              </div>
              <span className="chip" style={{ fontSize: 11, flexShrink: 0 }}>{roomStatusLabel(app.roomStatus)}</span>
            </div>

            {/* Divider + meta */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingTop: 12, borderTop: '1px solid var(--line)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--ink-4)' }}>{residencePeriodLabel(app.residencePeriod)}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {app.roomStatus !== 'COMPLETED' && (
                  <button
                    onClick={() => setCancelTarget(app.roomNo)}
                    className="btn ghost"
                    style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, height: 'auto', color: 'var(--danger)' }}
                  >취소하기</button>
                )}
                <button
                  onClick={() => navigate(`/rooms/${app.roomNo}`)}
                  className="btn ghost"
                  style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, height: 'auto' }}
                >방 보기</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cancel confirm bottom sheet */}
      {cancelTarget !== null && (
        <>
          <div
            onClick={() => setCancelTarget(null)}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 40,
            }}
          />
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: 'var(--surface)',
            borderRadius: '20px 20px 0 0',
            padding: '24px 20px 36px',
            zIndex: 41,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>신청을 취소할까요?</div>
            <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6, marginBottom: 12 }}>
              취소하면 다시 신청해야 해요.<br />정말 취소하시겠어요?
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="btn full"
              style={{ height: 52, background: 'var(--danger)', opacity: cancelling ? 0.6 : 1 }}
            >{cancelling ? '취소하는 중...' : '신청 취소하기'}</button>
            <button
              onClick={() => setCancelTarget(null)}
              className="btn full ghost"
              style={{ height: 52 }}
            >돌아가기</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Bookmarks List ──────────────────────────────────────────
const BOOKMARK_TABS = [
  { key: 'all', label: '전체' },
  { key: 'recruiting', label: '모집중' },
  { key: 'closed', label: '마감됨' },
];

export function BookmarksScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState('all');
  const [bookmarks, setBookmarks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');
    loadLikedRooms()
      .then((rooms) => {
        if (mounted) setBookmarks((Array.isArray(rooms) ? rooms : []).map(normalizeRoom));
      })
      .catch(() => { if (mounted) setError('북마크를 불러오지 못했어요.'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = tab === 'all'
    ? bookmarks
    : bookmarks.filter(b => tab === 'recruiting' ? b.recruiting : !b.recruiting);

  const handleRemove = (roomNo) => {
    unlikeRoom(roomNo)
      .then(() => setBookmarks((prev) => prev.filter((b) => b.roomNo !== roomNo)))
      .catch((e) => alert(e?.message || '북마크 해제에 실패했어요.'));
  };

  return (
    <div className="screen">
      <StatusBar />
      <TopNav title="북마크" backTo="/me" />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 16px 12px', overflowX: 'auto', flexShrink: 0 }}>
        {BOOKMARK_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '7px 14px', borderRadius: 999,
              border: tab === t.key ? 'none' : '1px solid var(--line-2)',
              background: tab === t.key ? 'var(--ink)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--ink-2)',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >{t.label}</button>
        ))}
      </div>

      <div className="scroll" style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>불러오는 중...</div>
        )}
        {!loading && error && (
          <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--danger)', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '64px 0', gap: 12, color: 'var(--ink-4)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M19 7v14l-7-4-7 4V7a3 3 0 013-3h8a3 3 0 013 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 500 }}>북마크한 방이 없어요</span>
          </div>
        )}
        {!loading && !error && filtered.map(b => (
          <div key={b.roomNo} className="card" style={{ padding: 16 }}>
            {/* Room info row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: b.recruiting ? 'var(--brand-soft)' : 'var(--surface-2)',
                color: b.recruiting ? 'var(--brand)' : 'var(--ink-4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.door size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: b.recruiting ? 'var(--ink)' : 'var(--ink-3)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{b.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>{b.dorm} · {b.size}</div>
              </div>
              <span className={b.recruiting ? 'chip brand' : 'chip'} style={{ fontSize: 11, flexShrink: 0 }}>
                {b.recruiting ? '모집중' : '마감됨'}
              </span>
            </div>

            {/* Divider + actions */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              paddingTop: 12, borderTop: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handleRemove(b.roomNo)}
                  className="btn ghost"
                  style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, height: 'auto', color: 'var(--ink-3)' }}
                >북마크 해제</button>
                <button
                  onClick={() => navigate(`/rooms/${b.roomNo}`)}
                  className="btn ghost"
                  style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, height: 'auto' }}
                >방 보기</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DormInfoScreen() {
  const navigate = useNavigate();

  const hours = [
    { day: '학기 중', open: '09:00', close: '24:00' },
    { day: '방학 중', open: '09:00', close: '24:00' },
    { day: '점심시간', open: '12:00', close: '13:00' },
    { day: '저녁시간', open: '18:00', close: '19:00' },
    { day: '야간휴게', open: '01:00', close: '06:00' },
  ];

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.4px', marginBottom: 10 }}>{title}</div>
      <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, value, last }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 16px', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, minWidth: 80 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600, flex: 1, lineHeight: 1.5 }}>{value}</div>
    </div>
  );

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, '/home')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>사감실 운영 안내</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '8px 16px 40px' }}>
        <Section title="사감실 운영 시간">
          {hours.map((h, i) => (
            <Row key={i} label={h.day} value={`${h.open} – ${h.close}`} last={i === hours.length - 1} />
          ))}
        </Section>

        <div style={{ background: 'var(--brand-soft)', borderRadius: 14, padding: '12px 14px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 13, color: 'var(--brand-deep)', lineHeight: 1.6 }}>
            설날·추석 등 연휴, 야간근무자 공석 시에는 유동적으로 변동될 수 있어요.
          </div>
        </div>

        <Section title="연락처">
          <Row label="사감실" value="번호를 입력해주세요" last />
        </Section>

      </div>
    </div>
  );
}

export function RollCallRulesScreen() {
  const navigate = useNavigate();

  const CHECKLIST = [
    { item: '창문', desc: '창틀, 창문유리' },
    { item: '현관', desc: '머리카락 유무, 신발장 및 바닥' },
    { item: '세면대', desc: '거울, 타일, 하수구' },
    { item: '샤워실', desc: '타일, 하수구' },
    { item: '화장실', desc: '변기, 타일, 하수구' },
    { item: '개인비품', desc: '의자 머리카락 유무, 침대 커버 유무, 침대·책상 서랍장 아래' },
  ];

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, '/home')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>점호 및 청소 점검 안내</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '4px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>정기 점호 일정 (1학기 2회)</div>
          </div>
          {[
            { label: '1차', value: '3월 18일 (수) 진행 예정' },
            { label: '2차', value: '5월 13일 (수) 진행 예정' },
          ].map((r, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, minWidth: 36 }}>{r.label}</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{r.value}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--brand-soft)', borderRadius: 14, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 13, color: 'var(--brand-deep)', lineHeight: 1.6 }}>
            음주·흡연·외부인 출입 등이 의심되는 경우 호실 방문.<br/> 청소 상태에 따라 상/벌점 부여.
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>청소 점검 항목</div>
          </div>
          {CHECKLIST.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: i < CHECKLIST.length - 1 ? '1px solid var(--line)' : 'none', alignItems: 'flex-start' }}>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', fontWeight: 500, minWidth: 60, flexShrink: 0 }}>{row.item}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{row.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--surface-2)', borderRadius: 14, padding: '12px 14px' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.7 }}>
            ※ 청소 점검 참고용 사진과 같이 준비해주시길 바랍니다.
          </div>
        </div>
      </div>
    </div>
  );
}

export function DormRulesScreen() {
  const navigate = useNavigate();

  const RULES = [
    {
      title: '23시 이후 소란행위 금지',
      items: [
        '23시 이후 호실 및 기숙사 공용 공간에서의 소란행위 금지, 라운지 음식물 섭취 불가 (음료 제외)',
        '호실·복도·휴게실·라운지에서 소란스러울 경우 사감실로 신고',
        '01시 이후에는 다음 날 09시 이후에 사감실로 신고. CCTV 확인 후 벌점 부과',
      ],
    },
    {
      title: '통금 시간 01:00 ~ 05:00',
      items: [
        '해당 시간에는 모든 출입 불가',
        '출입하는 경우 다음날 사감실 방문하여 사고경위서 작성 및 벌점 부여',
      ],
    },
    {
      title: '음주 절대 금지',
      items: [
        '호실 내 음주 행위, 주류 반입 및 보관 — 징계퇴사 및 입사제한',
        '기숙사 내 음주 행위 및 인사불성 상태에서 공동생활에 불쾌감을 주는 주정 행위도 생활관 내 규정을 적용하여 퇴사 및 징계',
        '기숙사 내 음주 행위 신고: 사감실 앞 불편사항 신고 대장에 기록',
      ],
    },
    {
      title: '실내흡연 금지',
      items: [
        '기숙사 실내흡연 금지, 지정된 흡연구역 이용',
        '흡연구역은 생활관 밖 지정된 구역에서만 가능',
        '실내흡연 (전자담배 포함) 시 퇴사 및 징계',
        '룸메이트가 흡연 방조 시 함께 벌점 부과',
      ],
    },
    {
      title: '반입 금지 물품',
      items: [
        '취사도구',
        '온풍기 및 냉풍기 등 개별 냉난방기, 전기장판, 다리미',
        '고데기 — 자동꺼짐 기능이 없는 제품 반입 금지',
        '인화물질 — 모기향, 향초 포함',
        '위험물 — 가스버너',
        '전동 킥보드, 자전거 (접이식 포함)',
        '칼집이 없는 칼 종류 일절 반입 금지',
      ],
    },
    {
      title: '냉장고 반입 기준',
      items: [
        '각 호실에 1인 1대만 반입 가능',
        '2인실: 1인당 87L까지 용량 제한',
        '4인실: 1인당 46L까지 용량 제한',
        '※ 호실 내 24시간 공급되는 전기는 벽면 한 곳에서만 작동되므로 콘센트 사용을 고려하여 설치 바람',
      ],
    },
    {
      title: '기숙사 내 취사 행위 금지',
      items: [
        '기숙사 내 일체의 취사 행위 금지',
      ],
    },
    {
      title: '우편물 수령 안내',
      items: [
        '등기·우편: 사감실에서 가천관 10층 총무인사팀 수령 후 입사생에게 연락 예정',
        '등기는 사감실 문자 확인 후 사감실 방문하여 수령',
        '일반우편은 우편함에서 수령',
      ],
    },
    {
      title: '위탁업체 운영 시설',
      items: [
        '학생 식당, 세탁실, 프린트, 무인 택배함은 위탁업체 운영',
        '문제 발생 시 안내된 고객센터로 직접 문의',
      ],
    },
    {
      title: 'WIFI',
      items: [
        'ID: 호실번호',
        'PW: 00000호실번호  (예: 200호 → 00000200)',
      ],
    },
    {
      title: '벌점 기준',
      items: [
        '해당 학기 벌점 합계 10점 이상 시 징계퇴사 및 향후 입사제한',
        '상·벌점 기준표: 각 층 게시판 및 학생생활관 홈페이지 참고',
      ],
    },
    {
      title: '기타 규칙',
      items: [
        '각 층 복도에 물건 적치 금지 (위반 시 벌점 부과)',
        '지정된 의자 위치 변경 금지',
        '룸메이트 간 카드키 혼용 주의. 카드에 스티커 등 부착물 부착 금지',
        '카드 대여: 21시까지 가능 / 반납: 21시 30분까지',
        '휴게실에서 소란 행위 금지',
        '호실 내 스티커, 고리 및 기타 부착물 부착 금지',
      ],
    },
    {
      title: '슬기로운 장학금 신청 안내',
      items: [
        '신청 기간: 3월 3일(화) ~ 3월 8일(일) 17시까지',
        '상세 내용은 공지사항 참조',
      ],
    },
    {
      title: '주차장 출입 통제',
      items: [
        '2026년 2월 2일(월)부터 등록 차량 외 주차장 진입 불가',
        '차량 등록 관련 상세 내용은 공지사항 참조',
      ],
    },
  ];

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, '/home')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>기숙사 규칙</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '4px 16px 40px' }}>
        <div style={{ padding: '6px 4px 16px', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>
          가천대학교 제2학생생활관 생활 시 꼭 알아두어야 할 내용입니다.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {RULES.map((rule, ri) => (
            <div key={ri} style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{rule.title}</div>
              </div>
              <div style={{ padding: '4px 0' }}>
                {rule.items.map((item, ii) => (
                  <div key={ii} style={{ display: 'flex', gap: 10, padding: '9px 16px', borderBottom: ii < rule.items.length - 1 ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--brand)', marginTop: 6, flexShrink: 0 }} />
                    <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
