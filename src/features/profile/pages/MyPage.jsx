import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, TabBar, StatusBar, Avatar, goBack } from '../../../shared/components';

// mypage.jsx — My Page (profile, checklist, settings)

const PROFILE_STORAGE_KEY = 'dorumdorum:profile';

const DEFAULT_PROFILE = {
  displayName: '민지',
  accountName: '강민지',
  email: 'minji_kang@univ.ac.kr',
  department: '경영학과 22학번',
  studentId: '202234511',
  age: '23',
  gender: '여성',
  photo: '',
};

function readProfile() {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || '{}');
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      photo: typeof parsed.photo === 'string' ? parsed.photo : DEFAULT_PROFILE.photo,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile(profile) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function ProfilePhoto({ profile, size = 64, style = {} }) {
  if (profile.photo) {
    return (
      <img
        src={profile.photo}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          background: '#F2F3F5',
          display: 'block',
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return <Avatar name={profile.displayName || profile.accountName} size={size} style={style} />;
}

export function MyPageScreen({ activeTab='me' }) {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(readProfile);

  React.useEffect(() => {
    const sync = () => setProfile(readProfile());
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

	  return (
	    <div className="screen">
	      <div className="scroll">
	        <StatusBar />
		        <div className="topbar">
		          <div className="brand">마이페이지</div>
		          <div style={{ display: 'flex', gap: 4 }}>
		            <button onClick={() => navigate('/notifications')} style={{ background: 'transparent', border: 0, color: 'var(--ink)', padding: 6, display: 'flex', cursor: 'pointer' }}><Icon.bell size={22}/></button>
		          </div>
		        </div>
	        {/* Profile card */}
        <div style={{ padding: '4px 16px 16px' }}>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <ProfilePhoto profile={profile} size={64} style={{ fontSize: 28 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 19, fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.displayName}</span>
                  <span className="chip success" style={{ fontSize: 10, padding: '2px 6px', flexShrink: 0 }}><Icon.check size={10} weight={3}/> 인증</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>{profile.department}</div>
              </div>
              <button onClick={() => navigate('/me/edit')} style={{ background: 'var(--surface-2)', border: 0, padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer', flexShrink: 0 }}>편집</button>
            </div>
          </div>
        </div>

        {/* My checklist progress */}
        <div className="h-section"><h2>내 체크리스트</h2><span onClick={() => navigate('/checklist')} className="more" style={{ cursor: 'pointer' }}>수정</span></div>
        <div onClick={() => navigate('/checklist')} style={{ margin: '0 16px', cursor: 'pointer' }} className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>완성도</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, letterSpacing: '-0.5px' }}>20<span style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 600 }}> / 22 항목</span></div>
            </div>
            <span className="chip brand" style={{ fontSize: 12, padding: '6px 12px' }}>2개 남음</span>
          </div>
          {/* horizontal progress bar */}
          <div style={{ height: 8, borderRadius: 99, background: 'var(--surface-2)', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ width: 'calc(20/22 * 100%)', height: '100%', background: 'var(--brand)', borderRadius: 99 }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { l: '생활 패턴', v: '14/14 완료', done: true },
              { l: '추가 규칙', v: '6/9 작성됨', done: false },
            ].map((r, i, a) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: r.done ? 'var(--brand)' : 'var(--surface-2)', color: r.done ? 'white' : 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {r.done ? <Icon.check size={12} weight={3}/> : <Icon.plus size={12} weight={2.4}/>}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{r.l}</span>
                </div>
                <span style={{ fontSize: 12, color: r.done ? 'var(--ink-3)' : 'var(--brand)', fontWeight: 600 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu groups */}
        <div className="h-section"><h2>활동</h2></div>
        <div style={{ margin: '0 16px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {[
            { i: 'door', l: '내가 만든 모집방', r: '1', to: '/rooms/me' },
            { i: 'clipboard', l: '신청 내역', r: '3', to: '/my/applications' },
            { i: 'bell', l: '북마크', r: '12', to: '/my/bookmarks' },
            { i: 'user', l: '룸메이트 기록', r: '', to: '/my/roommates' },
          ].map((m, i, a) => {
            const I = Icon[m.i];
            return (
              <div key={i} onClick={() => navigate(m.to)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)', cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--surface-2)', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I size={18}/></div>
                <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{m.l}</span>
                {m.r && <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{m.r}</span>}
                <Icon.chevron size={14} color="var(--ink-4)"/>
              </div>
            );
          })}
        </div>

        <div className="h-section"><h2>설정</h2></div>
        <div style={{ margin: '0 16px 24px', background: 'var(--surface)', borderRadius: 18, overflow: 'hidden' }}>
          {[
            { l: '알림 설정', r: '켜짐', to: '/settings/notifications' },
            { l: '계정 및 인증', r: '', to: '/settings/account' },
            { l: '고객 문의', r: '', to: '/settings/support' },
            { l: '버전', r: 'v1.2.0' },
          ].map((m, i, a) => (
            <div
              key={i}
              onClick={() => m.to && navigate(m.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i === a.length - 1 ? 'none' : '1px solid var(--line)',
                cursor: m.to ? 'pointer' : 'default',
              }}
            >
              <span style={{ flex: 1, fontSize: 15, color: 'var(--ink)' }}>{m.l}</span>
              {m.r && <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{m.r}</span>}
              {m.to && <Icon.chevron size={14}/>}
            </div>
          ))}
        </div>

        <div style={{ padding: '0 16px 24px', textAlign: 'center', fontSize: 12, color: 'var(--ink-4)' }}>로그아웃</div>
      </div>

      <TabBar active={activeTab}/>
    </div>
  );
}

export function ProfileEditScreen() {
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState(readProfile);
  const nickname = profile.displayName;
  const department = profile.department;
  const canSave = nickname.trim().length > 0 && department.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveProfile({
      ...profile,
      displayName: nickname.trim(),
      department: department.trim(),
    });
    navigate('/me');
  };

  const inputBase = {
    width: '100%',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    outline: 0,
    fontFamily: 'inherit',
    fontWeight: 500,
    boxSizing: 'border-box',
  };

  const disabledInput = {
    ...inputBase,
    border: 0,
    background: 'var(--surface-2)',
    color: 'var(--ink-3)',
    cursor: 'not-allowed',
    WebkitTextFillColor: 'var(--ink-3)',
  };

  const activeInput = {
    ...inputBase,
    border: '1.5px solid var(--brand)',
    background: 'var(--surface)',
    color: 'var(--ink)',
    fontWeight: 700,
  };

  const Label = ({ children, required = false }) => (
    <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
      {children} {required && <span style={{ color: 'var(--brand)' }}>*</span>}
    </label>
  );

  return (
    <div className="screen">
      <StatusBar />
      <div style={{
        padding: '6px 12px 8px',
        display: 'grid',
        gridTemplateColumns: '72px 1fr 72px',
        alignItems: 'center',
        minHeight: 48,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={() => goBack(navigate, '/me')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', textAlign: 'center' }}>프로필 편집</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              background: 'transparent',
              border: 0,
              fontSize: 14,
              color: canSave ? 'var(--brand)' : 'var(--ink-4)',
              fontWeight: 800,
              padding: 8,
              cursor: canSave ? 'pointer' : 'default',
              fontFamily: 'inherit',
            }}
          >저장</button>
        </div>
      </div>

      <div className="scroll" style={{ padding: '6px 24px 34px' }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: '4px 0 6px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>가입 정보</h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>닉네임과 학과를 수정할 수 있어요</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label required>학교 이메일</Label>
            <input type="email" value={profile.email} disabled style={disabledInput} />
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <Label required>이름</Label>
              <input type="text" value={profile.accountName} disabled style={disabledInput} />
            </div>
            <div style={{ flex: 1.2 }}>
              <Label required>학번</Label>
              <input type="text" value={profile.studentId} disabled style={disabledInput} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: -10, marginLeft: 2 }}>같은 방에 입주한 사람끼리만 볼 수 있어요.</div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <div style={{ width: 90 }}>
              <Label required>나이</Label>
              <input type="text" value={profile.age} disabled style={disabledInput} />
            </div>
            <div style={{ flex: 1 }}>
              <Label required>성별</Label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['여성', '남성'].map((gender) => {
                  const selected = profile.gender === gender;
                  return (
                    <span
                      key={gender}
                      style={{
                        flex: 1,
                        justifyContent: 'center',
                        fontSize: 13,
                        padding: '12px 0',
                        borderRadius: 12,
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: selected ? 'var(--line-2)' : 'var(--surface-2)',
                        color: selected ? 'var(--ink-2)' : 'var(--ink-4)',
                        border: '1px solid var(--line-2)',
                        fontWeight: 700,
                        cursor: 'not-allowed',
                      }}
                    >{gender}</span>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label required>닉네임</Label>
            <input
              type="text"
              maxLength={12}
              value={nickname}
              onChange={(event) => setProfile((prev) => ({ ...prev, displayName: event.target.value }))}
              style={activeInput}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
              <span>다른 사람들에게 보여지는 이름이에요.</span>
              <span style={{ flexShrink: 0 }}>{nickname.length}/12</span>
            </div>
          </div>

          <div>
            <Label required>학과</Label>
            <input
              type="text"
              value={department}
              onChange={(event) => setProfile((prev) => ({ ...prev, department: event.target.value }))}
              style={activeInput}
            />
          </div>

          <div>
            <Label>비밀번호</Label>
            <button
              type="button"
              onClick={() => navigate('/find-password', { state: { mode: 'change-password', backTo: '/me/edit', doneTo: '/me/edit' } })}
              style={{
                width: '100%',
                minHeight: 46,
                border: 0,
                borderRadius: 12,
                background: 'var(--surface-2)',
                color: 'var(--ink)',
                fontSize: 14,
                fontWeight: 800,
                fontFamily: 'inherit',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
              }}
            >
              <span>비밀번호 변경</span>
              <Icon.chevron size={14} />
            </button>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>별도 인증 후 변경할 수 있어요.</div>
          </div>
        </div>

        <div style={{ marginTop: 18, background: 'var(--surface)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--brand-soft)', color: 'var(--brand-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon.chat size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>가입 정보가 잘못됐나요?</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>학교 인증 정보 수정은 문의가 필요해요.</div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings/support')}
            style={{
              border: 0,
              borderRadius: 11,
              background: 'var(--surface-2)',
              color: 'var(--ink-2)',
              padding: '9px 11px',
              fontSize: 12,
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >문의</button>
        </div>
      </div>
    </div>
  );
}
