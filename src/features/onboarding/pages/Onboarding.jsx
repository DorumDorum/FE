import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon, LogoMark, StatusBar, goBack } from '../../../shared/components';
import {
  getMe,
  login as loginUser,
  resetPassword,
  sendPasswordResetEmail,
  sendVerificationEmail,
  signUp,
  verifyEmail,
  verifyPasswordResetCode,
} from '../../../shared/api/auth';

// onboarding.jsx — Splash + Login

export function SplashScreen() {
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;

    getMe()
      .then(() => {
        if (mounted) navigate('/home', { replace: true });
      })
      .catch(() => {
        // Stay on the splash screen when no valid login session exists.
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="screen" style={{ background: 'var(--brand)', color: 'white', alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar dark />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
        <LogoMark size={168} radius={38} style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }} />
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, letterSpacing: '-1.2px' }}>도룸도룸</h1>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.88)' }}>나와 꼭 맞는 룸메이트, 도룸도룸에서</p>
        </div>
      </div>

      <div style={{ padding: '0 24px 44px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => navigate('/login')} className="btn full" style={{ background: 'white', color: 'var(--brand)' }}>학교 계정으로 시작하기</button>
          <button onClick={() => navigate('/guest')} className="btn full ghost" style={{ background: 'rgba(255,255,255,0.18)', color: 'white' }}>둘러보기</button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 18 }}>
          계속 진행하면 <u>이용약관</u> 및 <u>개인정보 처리방침</u>에 동의하게 됩니다.
        </p>
      </div>
    </div>);

}

export function LoginScreen() {
  const navigate = useNavigate();
  const [autoLogin, setAutoLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const canSubmit = email.trim() && password;

  const handleLogin = async () => {
    setSubmitted(true);
    setErrorMessage('');

    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await loginUser(email.trim(), password);
      navigate('/home', { replace: true });
    } catch (error) {
      setErrorMessage(error?.status ? error.message : '서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') handleLogin();
  };

  const inputErrorStyle = (value) => submitted && !value
    ? { boxShadow: '0 0 0 1.5px #FCA5A5', background: '#FEF2F2' }
    : {};

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      <StatusBar />
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, '/')} style={{ background: 'transparent', border: 0, padding: 8, marginLeft: -8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
      </div>

      <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.6px' }}>학교 이메일로<br />도룸도룸에 입주해요</h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>재학생 인증 후 바로 시작할 수 있어요</p>
      </div>

      <div style={{ padding: '32px 24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>학교 이메일</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px', fontSize: 16, border: 0, outline: 0, fontFamily: 'inherit', color: 'var(--ink)', fontWeight: 500, boxSizing: 'border-box', ...inputErrorStyle(email.trim()) }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--ink-3)', marginBottom: 6 }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
            style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 14, padding: '14px 16px', fontSize: 16, border: 0, outline: 0, fontFamily: 'inherit', color: 'var(--ink)', boxSizing: 'border-box', ...inputErrorStyle(password) }}
          />
        </div>

        <div onClick={() => setAutoLogin(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer', userSelect: 'none' }}>
          <div style={{ width: 18, height: 18, borderRadius: 5, background: autoLogin ? 'var(--brand)' : 'transparent', border: autoLogin ? 'none' : '1.5px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background .15s' }}>
            {autoLogin && <Icon.check size={12} />}
          </div>
          자동 로그인
        </div>

        {(submitted && !canSubmit) && (
          <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
            학교 이메일과 비밀번호를 입력해주세요.
          </div>
        )}

        {errorMessage && (
          <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
            {errorMessage}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: '0 20px 30px' }}>
        <button
          onClick={handleLogin}
          disabled={isSubmitting}
          className="btn full"
          style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'default' : 'pointer' }}
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, fontSize: 13, color: 'var(--ink-3)', marginTop: 16 }}>
          <span onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>회원가입</span>
          <span style={{ color: 'var(--line-2)' }}>|</span>
          <span onClick={() => navigate('/find-password')} style={{ cursor: 'pointer' }}>비밀번호 찾기</span>
        </div>
      </div>
    </div>);

}

// ─── Sign-up ────────────────────────────────────────────────
export function SignUpScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const isValidEmail = email.toLowerCase().endsWith('@gachon.ac.kr') && email.length > '@gachon.ac.kr'.length;
  const [code, setCode] = React.useState(['','','','','','']);
  const codeRefs = React.useRef([]);
  const [isSendingCode, setIsSendingCode] = React.useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formMessage, setFormMessage] = React.useState('');
  const [formMessageTone, setFormMessageTone] = React.useState('error');

  const handleCodeChange = (i, val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = [...code];
      digits.slice(0, 6 - i).split('').forEach((digit, offset) => {
        next[i + offset] = digit;
      });
      setCode(next);
      codeRefs.current[Math.min(i + digits.length, 5)]?.focus();
      return;
    }

    const digit = digits.slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodePaste = (i, e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '');
    if (digits.length <= 1) return;

    e.preventDefault();
    handleCodeChange(i, digits);
  };

  const handleCodeKeyDown = (i, e) => {
    const allowedControlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (
      e.key.length === 1
      && !/^\d$/.test(e.key)
      && !e.metaKey
      && !e.ctrlKey
    ) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }

    if (!allowedControlKeys.includes(e.key) && e.key.length !== 1) {
      e.preventDefault();
    }
  };

  const [codeStatus, setCodeStatus] = React.useState(null); // null | 'success' | 'error'

  const handleCodeConfirm = async () => {
    const entered = code.join('');
    if (entered.length < 6 || isVerifyingCode) return;

    setIsVerifyingCode(true);
    setFormMessage('');
    try {
      await verifyEmail(email.trim(), entered);
      setCodeStatus('success');
      setFormMessageTone('success');
      setFormMessage('인증번호가 확인됐어요.');
    } catch (error) {
      setCodeStatus('error');
      setFormMessageTone('error');
      setFormMessage(error?.status ? error.message : '인증번호 확인에 실패했어요. 잠시 후 다시 시도해주세요.');
      setCode(['','','','','','']);
      setTimeout(() => codeRefs.current[0]?.focus(), 0);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const [name, setName] = React.useState('');
  const [studentId, setStudentId] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState(null);
  const [nickname, setNickname] = React.useState('');
  const [dept, setDept] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [pwConfirm, setPwConfirm] = React.useState('');
  const [terms, setTerms] = React.useState([false, false, false, false]);
  const toggleTerm = (i) => {
    if (i === 0) {
      const allChecked = terms.slice(1).every(Boolean);
      setTerms(terms.map(() => !allChecked));
    } else {
      const next = [...terms];
      next[i] = !next[i];
      next[0] = next.slice(1).every(Boolean);
      setTerms(next);
    }
  };
  const [submitted, setSubmitted] = React.useState(false);

  const err = (v) => submitted && !v
    ? { boxShadow: '0 0 0 1.5px #FCA5A5', background: '#FEF2F2' }
    : {};

  const toGenderValue = (value) => value === '남성' ? 'MALE' : 'FEMALE';
  const toBirthFromAge = (value) => {
    const parsedAge = Number(value);
    const birthYear = new Date().getFullYear() - parsedAge + 1;
    return `${birthYear}-01-01`;
  };
  const toGradeFromStudentId = (value) => {
    const admissionYear = value.trim().slice(0, 4);
    return /^\d{4}$/.test(admissionYear) ? `${admissionYear.slice(2)}학번` : '1학년';
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setFormMessage('');
    const ok = codeStatus === 'success' && name && studentId && age && gender && nickname && dept && password && pwConfirm && password === pwConfirm && terms[1] && terms[2];
    if (!ok) return;

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await signUp({
        name: name.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        password,
        passwordCheck: pwConfirm,
        gender: toGenderValue(gender),
        studentNo: studentId.trim(),
        major: dept.trim(),
        grade: toGradeFromStudentId(studentId),
        birth: toBirthFromAge(age),
      });

      navigate('/login', { replace: true });
    } catch (error) {
      if (error?.code === 'USER002') {
        alert('이메일 인증이 만료됐어요. 처음부터 다시 진행해주세요.');
        window.location.reload();
        return;
      }
      setFormMessageTone('error');
      setFormMessage(error?.status ? error.message : '회원가입에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const [cooldown, setCooldown] = React.useState(null);
  const [requested, setRequested] = React.useState(false);
  const [codeTimer, setCodeTimer] = React.useState(null);

  const startCooldown = async () => {
    if (!isValidEmail || cooldown || isSendingCode) return;

    setIsSendingCode(true);
    setFormMessage('');
    try {
      await sendVerificationEmail(email.trim());
      setFormMessageTone('success');
      setFormMessage('인증번호를 이메일로 보냈어요.');
      setRequested(true);
      setCooldown(10);
      setCodeTimer(300);
      setCodeStatus(null);
      setCode(['','','','','','']);
      setTimeout(() => codeRefs.current[0]?.focus(), 0);
    } catch (error) {
      setFormMessageTone('error');
      setFormMessage(error?.status ? error.message : '인증 메일 전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSendingCode(false);
    }
  };

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(c => c <= 1 ? null : c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  React.useEffect(() => {
    if (!codeTimer) return;
    const t = setTimeout(() => setCodeTimer(c => c <= 1 ? null : c - 1), 1000);
    return () => clearTimeout(t);
  }, [codeTimer]);

  const fmtTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')} : ${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      <StatusBar />
      <div style={{ padding: '6px 12px 4px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, '/login')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
      </div>

      <div className="scroll" style={{ padding: '4px 24px 0' }}>
        <h1 style={{ margin: '4px 0 6px', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1.35 }}>
          도룸도룸 시작하기
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          학교 이메일 인증 후 가입할 수 있어요
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 22 }}>
          {/* School email + verify button */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>학교 이메일 <span style={{ color: 'var(--brand)' }}>*</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="학교 이메일" readOnly={requested} style={{ flex: 1, background: requested ? 'var(--surface-2)' : 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, border: 0, outline: 0, fontFamily: 'inherit', color: requested ? 'var(--ink-3)' : 'var(--ink)', fontWeight: 500, minWidth: 0 }} />
              <button
                onClick={startCooldown}
                disabled={!isValidEmail || !!cooldown || isSendingCode}
                style={{
                  padding: '0 14px',
                  background: isValidEmail && !cooldown && !isSendingCode ? 'var(--ink)' : 'var(--surface-2)',
                  color: isValidEmail && !cooldown && !isSendingCode ? 'white' : 'var(--ink-4)',
                  border: 0, borderRadius: 12,
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap',
                  cursor: isValidEmail && !cooldown && !isSendingCode ? 'pointer' : 'default', minWidth: 72, transition: 'background .2s',
                }}
              >{isSendingCode ? '전송중' : cooldown ? `${cooldown}초` : requested ? '재전송' : '인증요청'}</button>
            </div>
          </div>

          {/* Verification code */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 600 }}>
              <span>인증번호 <span style={{ color: 'var(--brand)' }}>*</span></span>
              <span style={{ color: codeTimer ? 'var(--brand)' : 'var(--ink-4)', fontWeight: 700 }}>{codeTimer ? fmtTimer(codeTimer) : '05 : 00'}</span>
            </label>
            <div style={{ display: 'flex', gap: 7 }}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={el => codeRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  disabled={codeStatus === 'success' || isVerifyingCode}
                  onChange={e => { setCodeStatus(null); handleCodeChange(i, e.target.value); }}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={e => handleCodePaste(i, e)}
                  style={{
                    flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 700,
                    background: 'var(--surface)',
                    border: codeStatus === 'success'
                      ? '1.5px solid var(--success)'
                      : codeStatus === 'error'
                      ? '1.5px solid var(--danger)'
                      : digit ? '1.5px solid var(--brand)' : '1.5px solid var(--line-2)',
                    borderRadius: 12, padding: '14px 0',
                    outline: 0, fontFamily: 'inherit', color: 'var(--ink)',
                    minWidth: 0,
                  }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ fontSize: 11, color: codeStatus === 'success' ? 'var(--success)' : codeStatus === 'error' ? 'var(--danger)' : 'var(--ink-3)', fontWeight: codeStatus ? 600 : 400 }}>
                {codeStatus === 'success' ? '✓ 인증번호가 확인됐어요'
                  : codeStatus === 'error' ? '인증번호가 일치하지 않아요'
                  : '이메일로 받은 6자리 숫자를 입력해주세요'}
              </div>
              {codeStatus !== 'success' && (
                <button
                  type="button"
                  onClick={handleCodeConfirm}
                  disabled={code.join('').length < 6 || isVerifyingCode}
                  style={{ background: 'none', border: 0, padding: 0, fontSize: 11, color: code.join('').length < 6 || isVerifyingCode ? 'var(--ink-4)' : 'var(--brand)', fontWeight: 700, fontFamily: 'inherit', cursor: code.join('').length < 6 || isVerifyingCode ? 'default' : 'pointer', flexShrink: 0 }}
                >{isVerifyingCode ? '확인중' : '확인'}</button>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--line)', margin: '2px 0' }} />

          {/* 실명 + 학번 (private) */}
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>이름 <span style={{ color: 'var(--brand)' }}>*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box', ...err(name) }} />
            </div>
            <div style={{ flex: 1.2 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>학번 <span style={{ color: 'var(--brand)' }}>*</span></label>
              <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box', ...err(studentId) }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: -10, marginLeft: 2 }}>같은 방에 입주한 사람끼리만 볼 수 있어요.

          </div>

          {/* Age + Gender */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <div style={{ width: 90 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>나이 <span style={{ color: 'var(--brand)' }}>*</span></label>
              <input type="text" inputMode="numeric" maxLength={3} value={age} onChange={e => setAge(e.target.value.replace(/\D/g, ''))} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box', ...err(age) }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>성별 <span style={{ color: 'var(--brand)' }}>*</span></label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['여성', '남성'].map(g => (
                  <span key={g} onClick={() => setGender(g)} className={gender === g ? 'chip ink' : 'chip line'} style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '12px 0', borderRadius: 12, cursor: 'pointer', ...(submitted && !gender ? { background: '#FEF2F2', boxShadow: '0 0 0 1.5px #FCA5A5' } : {}) }}>{g}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Nickname (public) */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>닉네임 <span style={{ color: 'var(--brand)' }}>*</span></label>
            <input type="text" maxLength={12} value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box', ...err(nickname) }} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>다른 사람들에게 보여지는 이름이에요.</div>
          </div>

          {/* Department */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>학과 <span style={{ color: 'var(--brand)' }}>*</span></label>
            <input type="text" placeholder="예: 경영" value={dept} onChange={e => setDept(e.target.value)} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box', ...err(dept) }} />
          </div>

          {/* Password + confirm */}
          <div>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>비밀번호 <span style={{ color: 'var(--brand)' }}>*</span></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', boxSizing: 'border-box', ...err(password) }} />
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>영문 + 숫자 포함 8자 이상</div>
          </div>
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
              <span>비밀번호 확인 <span style={{ color: 'var(--brand)' }}>*</span></span>
              {pwConfirm && password === pwConfirm && <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ 일치해요</span>}
              {pwConfirm && password !== pwConfirm && <span style={{ color: 'var(--danger)', fontWeight: 700 }}>일치하지 않아요</span>}
            </label>
            <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} style={{ width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', boxSizing: 'border-box', ...err(pwConfirm), ...(submitted && pwConfirm && password !== pwConfirm ? { boxShadow: '0 0 0 1.5px #FCA5A5', background: '#FEF2F2' } : {}) }} />
          </div>

          <div style={{ height: 1, background: 'var(--line)', margin: '2px 0' }} />

          {/* Terms agreement */}
          <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: 12 }}>
            {[
              { l: '약관 전체 동의', primary: true },
              { l: '[필수] 이용약관', slug: 'service' },
              { l: '[필수] 개인정보 처리방침', slug: 'privacy' },
              { l: '[선택] 마케팅 알림 수신', slug: 'marketing' },
            ].map((t, i) => {
              const needsErr = submitted && (i === 1 || i === 2) && !terms[i];
              return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 4px',
                borderBottom: i === 0 ? '1px solid var(--line-2)' : 'none',
                marginBottom: i === 0 ? 4 : 0,
                userSelect: 'none',
              }}>
                <span onClick={() => toggleTerm(i)} style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: terms[i] ? 'var(--brand)' : 'transparent',
                  border: terms[i] ? 'none' : '1.5px solid var(--line-2)',
                  boxShadow: needsErr && !terms[i] ? '0 0 0 1.5px #FCA5A5' : 'none',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  cursor: 'pointer', transition: 'background .15s',
                }}>{terms[i] && <Icon.check size={12} weight={3} />}</span>
                <span onClick={() => toggleTerm(i)} style={{ flex: 1, fontSize: t.primary ? 14 : 13, fontWeight: t.primary ? 700 : 500, color: 'var(--ink)', cursor: 'pointer' }}>{t.l}</span>
                {t.slug && <span onClick={() => navigate(`/terms/${t.slug}`)} style={{ padding: 4, cursor: 'pointer', color: 'var(--ink-3)' }}><Icon.chevron size={12} /></span>}
              </div>
            );})}
          </div>
          {formMessage && (
            <div style={{ fontSize: 12, color: formMessageTone === 'success' ? 'var(--success)' : 'var(--danger)', fontWeight: 700, lineHeight: 1.5 }}>
              {formMessage}
            </div>
          )}
        </div>

        <div style={{ height: 100 }} />
      </div>

      <div style={{ padding: '14px 20px 30px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn full"
          style={{ height: 52, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'default' : 'pointer' }}
        >
          {isSubmitting ? '가입 중...' : '가입하고 시작하기'}
        </button>
      </div>
    </div>);

}

// ─── Find password ───────────────────────────────────────────
export function FindPasswordScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const isChangeMode = location.state?.mode === 'change-password';
  const backTo = location.state?.backTo || '/login';
  const doneTo = location.state?.doneTo || '/login';

  const [email, setEmail] = React.useState('');
  const isValidEmail = email.toLowerCase().endsWith('@gachon.ac.kr') && email.length > '@gachon.ac.kr'.length;
  const [cooldown, setCooldown] = React.useState(null);
  const [requested, setRequested] = React.useState(false);
  const [codeTimer, setCodeTimer] = React.useState(null);

  const [code, setCode] = React.useState(['','','','','','']);
  const codeRefs = React.useRef([]);
  const [codeStatus, setCodeStatus] = React.useState(null);
  const [codeLoading, setCodeLoading] = React.useState(false);
  const [sendError, setSendError] = React.useState(null);

  const handleCodeChange = (i, val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 1) {
      const next = [...code];
      digits.slice(0, 6 - i).split('').forEach((digit, offset) => {
        next[i + offset] = digit;
      });
      setCode(next);
      codeRefs.current[Math.min(i + digits.length, 5)]?.focus();
      return;
    }

    const digit = digits.slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  };

  const handleCodePaste = (i, e) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '');
    if (digits.length <= 1) return;

    e.preventDefault();
    handleCodeChange(i, digits);
  };

  const handleCodeKeyDown = (i, e) => {
    const allowedControlKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (e.key.length === 1 && !/^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      return;
    }

    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }

    if (!allowedControlKeys.includes(e.key) && e.key.length !== 1) {
      e.preventDefault();
    }
  };
  const handleCodeConfirm = async () => {
    setCodeLoading(true);
    try {
      await verifyPasswordResetCode(email.trim(), code.join(''));
      setCodeStatus('success');
    } catch {
      setCodeStatus('error');
      setCode(['','','','','','']);
      setTimeout(() => codeRefs.current[0]?.focus(), 0);
    } finally {
      setCodeLoading(false);
    }
  };

  const startCooldown = async () => {
    setSendError(null);
    try {
      await sendPasswordResetEmail(email.trim());
      setRequested(true);
      setCooldown(10);
      setCodeTimer(300);
    } catch (e) {
      setSendError(e?.message || '인증번호 전송에 실패했어요.');
    }
  };
  React.useEffect(() => {
    if (!cooldown) return;
    const t = setTimeout(() => setCooldown(c => c <= 1 ? null : c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  React.useEffect(() => {
    if (!codeTimer) return;
    const t = setTimeout(() => setCodeTimer(c => c <= 1 ? null : c - 1), 1000);
    return () => clearTimeout(t);
  }, [codeTimer]);
  const fmtTimer = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')} : ${String(s % 60).padStart(2, '0')}`;

  const [password, setPassword] = React.useState('');
  const [pwConfirm, setPwConfirm] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);
  const [resetError, setResetError] = React.useState(null);
  const err = (v) => submitted && !v ? { boxShadow: '0 0 0 1.5px #FCA5A5', background: '#FEF2F2' } : {};

  const handleReset = async () => {
    setSubmitted(true);
    if (!password || !pwConfirm) return;
    setResetError(null);
    setResetLoading(true);
    try {
      await resetPassword(email.trim(), password);
      navigate(doneTo, { replace: true });
    } catch (e) {
      setResetError(e?.message || '비밀번호 변경에 실패했어요.');
    } finally {
      setResetLoading(false);
    }
  };

  const inputBase = { width: '100%', background: 'var(--surface-2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, outline: 0, fontFamily: 'inherit', fontWeight: 500, boxSizing: 'border-box' };

  return (
    <div className="screen" style={{ background: 'var(--surface)' }}>
      <StatusBar />
      <div style={{ padding: '6px 12px 4px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, backTo)} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{isChangeMode ? '비밀번호 변경' : '비밀번호 찾기'}</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '16px 24px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              {isChangeMode ? '계정 확인을 위해 학교 이메일로' : '가입 시 사용한 학교 이메일로'}<br />인증번호를 보내드릴게요.
            </p>
            <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>학교 이메일 <span style={{ color: 'var(--brand)' }}>*</span></label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="학교 이메일" readOnly={requested} style={{ ...inputBase, flex: 1, minWidth: 0, color: requested ? 'var(--ink-3)' : 'var(--ink)' }} />
              <button
                onClick={startCooldown}
                disabled={!isValidEmail || !!cooldown || codeStatus === 'success'}
                style={{ padding: '0 14px', background: isValidEmail && !cooldown && codeStatus !== 'success' ? 'var(--ink)' : 'var(--surface-2)', color: isValidEmail && !cooldown && codeStatus !== 'success' ? 'white' : 'var(--ink-4)', border: 0, borderRadius: 12, fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap', cursor: isValidEmail && !cooldown && codeStatus !== 'success' ? 'pointer' : 'default', minWidth: 72, transition: 'background .2s' }}
              >{cooldown ? `${cooldown}초` : requested ? '재전송' : '인증요청'}</button>
            </div>
            {sendError && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4, fontWeight: 600 }}>{sendError}</div>}
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, fontWeight: 600 }}>
              <span>인증번호 <span style={{ color: 'var(--brand)' }}>*</span></span>
              <span style={{ color: codeTimer ? 'var(--brand)' : 'var(--ink-4)', fontWeight: 700 }}>{codeTimer ? fmtTimer(codeTimer) : '05 : 00'}</span>
            </label>
            <div style={{ display: 'flex', gap: 7 }}>
              {code.map((digit, i) => (
                <input key={i} ref={el => codeRefs.current[i] = el} type="text" inputMode="numeric" maxLength={1} value={digit}
                  disabled={codeStatus === 'success'}
                  onChange={e => { setCodeStatus(null); handleCodeChange(i, e.target.value); }}
                  onKeyDown={e => handleCodeKeyDown(i, e)}
                  onPaste={e => handleCodePaste(i, e)}
                  style={{ flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 700, background: 'var(--surface)', border: codeStatus === 'error' ? '1.5px solid var(--danger)' : codeStatus === 'success' ? '1.5px solid var(--success)' : digit ? '1.5px solid var(--brand)' : '1.5px solid var(--line-2)', borderRadius: 12, padding: '14px 0', outline: 0, fontFamily: 'inherit', color: 'var(--ink)', minWidth: 0 }}
                />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
              <div style={{ fontSize: 11, color: codeStatus === 'error' ? 'var(--danger)' : codeStatus === 'success' ? 'var(--success)' : 'var(--ink-3)', fontWeight: codeStatus ? 600 : 400 }}>
                {codeStatus === 'error' ? '인증번호가 일치하지 않아요' : codeStatus === 'success' ? '인증이 완료됐어요' : '이메일로 받은 6자리 숫자를 입력해주세요'}
              </div>
              {codeStatus !== 'success' && (
                <button type="button" onClick={handleCodeConfirm} disabled={code.join('').length < 6 || codeLoading}
                  style={{ background: 'none', border: 0, padding: 0, fontSize: 11, color: code.join('').length < 6 || codeLoading ? 'var(--ink-4)' : 'var(--brand)', fontWeight: 700, fontFamily: 'inherit', cursor: code.join('').length < 6 || codeLoading ? 'default' : 'pointer', flexShrink: 0 }}
                >{codeLoading ? '확인 중...' : '확인'}</button>
              )}
            </div>
          </div>

          {codeStatus === 'success' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>새 비밀번호 <span style={{ color: 'var(--brand)' }}>*</span></label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputBase, ...err(password) }} />
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>영문 + 숫자 포함 8자 이상</div>
              </div>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)', marginBottom: 6, fontWeight: 600 }}>
                  <span>새 비밀번호 확인 <span style={{ color: 'var(--brand)' }}>*</span></span>
                  {pwConfirm && password === pwConfirm && <span style={{ color: 'var(--success)', fontWeight: 700 }}>✓ 일치해요</span>}
                </label>
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} style={{ ...inputBase, ...err(pwConfirm) }} />
              </div>
              {resetError && <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>{resetError}</div>}
            </>
          )}
        </div>
        <div style={{ height: 100 }} />
      </div>

      <div style={{ padding: '14px 20px 30px', borderTop: '1px solid var(--line)', background: 'var(--surface)' }}>
        {codeStatus === 'success'
          ? <button onClick={handleReset} disabled={resetLoading} className="btn full" style={{ height: 52 }}>{resetLoading ? '변경 중...' : '비밀번호 변경하기'}</button>
          : <button disabled className="btn full" style={{ height: 52, opacity: 0.4 }}>다음</button>
        }
      </div>
    </div>
  );
}

// ─── Terms detail ────────────────────────────────────────────
const TERMS_CONTENT = {
  service: {
    title: '이용약관',
    sections: [
      { heading: '제1조 (목적)', body: '이 약관은 도룸도룸(이하 "서비스")이 제공하는 룸메이트 매칭 서비스의 이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.' },
      { heading: '제2조 (정의)', body: '"이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다. "콘텐츠"란 이용자가 서비스 내에서 작성·등록한 게시물, 체크리스트, 메시지 등 일체의 정보를 말합니다.' },
      { heading: '제3조 (약관의 효력 및 변경)', body: '본 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다. 회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.' },
      { heading: '제4조 (서비스 이용)', body: '서비스는 재학생 인증을 완료한 이용자에게 제공됩니다. 이용자는 서비스를 통해 룸메이트 모집 공고를 등록하거나 신청할 수 있으며, 매칭된 상대방과 채팅을 통해 소통할 수 있습니다.' },
      { heading: '제5조 (이용자의 의무)', body: '이용자는 타인의 개인정보를 무단으로 수집·이용하거나 허위 정보를 등록해서는 안 됩니다. 서비스를 통해 알게 된 다른 이용자의 정보를 서비스 목적 외로 활용하는 행위는 금지됩니다.' },
      { heading: '제6조 (면책)', body: '회사는 이용자 간의 거래 또는 분쟁에 대해 개입하거나 책임을 지지 않습니다. 천재지변, 서비스 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.' },
    ],
  },
  privacy: {
    title: '개인정보 처리방침',
    sections: [
      { heading: '1. 수집하는 개인정보 항목', body: '서비스는 가입 시 학교 이메일, 이름, 학번, 나이, 성별, 닉네임, 학과를 수집합니다. 서비스 이용 과정에서 기기 정보, 접속 로그, 채팅 내용이 자동으로 생성·저장될 수 있습니다.' },
      { heading: '2. 개인정보 수집 및 이용 목적', body: '수집된 개인정보는 재학생 인증, 룸메이트 매칭 서비스 제공, 부정 이용 방지, 서비스 개선을 위해 이용됩니다. 같은 방에 입주한 멤버에 한해 이름과 학번이 공개됩니다.' },
      { heading: '3. 개인정보 보유 및 이용 기간', body: '개인정보는 회원 탈퇴 시까지 보유합니다. 단, 관계 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보존합니다.' },
      { heading: '4. 개인정보의 제3자 제공', body: '서비스는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의한 경우는 예외로 합니다.' },
      { heading: '5. 이용자의 권리', body: '이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 개인정보 관련 문의는 고객 문의 채널을 통해 접수할 수 있습니다.' },
    ],
  },
  marketing: {
    title: '마케팅 알림 수신',
    sections: [
      { heading: '수신 동의 안내', body: '마케팅 알림 수신에 동의하시면 도룸도룸의 새로운 기능, 이벤트, 혜택 등의 정보를 푸시 알림 및 이메일로 받아보실 수 있습니다.' },
      { heading: '수신 항목', body: '신규 기능 출시 안내, 기숙사 모집 시즌 알림, 이벤트 및 혜택 정보, 서비스 이용 팁 등이 포함됩니다.' },
      { heading: '수신 거부 방법', body: '마케팅 수신 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에 불이익이 없습니다. 수신 거부는 마이페이지 > 설정 > 알림 설정에서 언제든지 변경할 수 있습니다.' },
      { heading: '개인정보 처리', body: '수집된 마케팅 정보(이메일, 기기 토큰)는 마케팅 목적으로만 사용되며, 동의 철회 시 즉시 마케팅 발송이 중단됩니다.' },
    ],
  },
};

export function TermsDetailScreen() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const content = TERMS_CONTENT[slug];

  if (!content) return null;

  return (
    <div className="screen">
      <StatusBar />
      <div style={{ padding: '6px 12px 8px', display: 'flex', alignItems: 'center' }}>
        <button onClick={() => goBack(navigate, '/signup')} style={{ background: 'transparent', border: 0, padding: 8, color: 'var(--ink)', cursor: 'pointer' }}><Icon.back /></button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600 }}>{content.title}</div>
        <div style={{ width: 38 }} />
      </div>

      <div className="scroll" style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {content.sections.map((s, i) => (
          <div key={i}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{s.heading}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
