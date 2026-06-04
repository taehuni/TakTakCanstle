import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase.js';

export default function AuthScreen({ onClose }) {
  const [mode, setMode]         = useState('login'); // 'login' | 'signup'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const trimmed = nickname.trim().slice(0, 12);
        if (!trimmed) { setError('닉네임을 입력해 주세요.'); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: trimmed });
        setSuccess(`${trimmed}님, 환영합니다! 🎉`);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(translateError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page} onClick={e => e.target === e.currentTarget && onClose?.()}>
      <div style={S.card}>
        <div style={S.logo}>⌨ 탁탁성</div>
        <div style={S.logoSub}>TAKTAK CASTLE</div>
        {onClose && (
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        )}

        <div style={S.tabs}>
          <button style={{ ...S.tab, ...(mode === 'login'  ? S.tabActive : {}) }} onClick={() => { setMode('login');  setError(''); }}>로그인</button>
          <button style={{ ...S.tab, ...(mode === 'signup' ? S.tabActive : {}) }} onClick={() => { setMode('signup'); setError(''); }}>회원가입</button>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          {mode === 'signup' && (
            <label style={S.label}>
              <span style={S.labelText}>닉네임</span>
              <input
                style={S.input}
                type="text"
                placeholder="최대 12자"
                maxLength={12}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                required
              />
            </label>
          )}
          <label style={S.label}>
            <span style={S.labelText}>이메일</span>
            <input
              style={S.input}
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label style={S.label}>
            <span style={S.labelText}>비밀번호</span>
            <input
              style={S.input}
              type="password"
              placeholder="6자 이상"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {error   && <div style={S.error}>{error}</div>}
          {success && <div style={S.success}>{success}</div>}

          <button style={{ ...S.submitBtn, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  );
}

function translateError(code) {
  switch (code) {
    case 'auth/email-already-in-use':    return '이미 사용 중인 이메일입니다.';
    case 'auth/invalid-email':           return '이메일 형식이 올바르지 않습니다.';
    case 'auth/weak-password':           return '비밀번호는 6자 이상이어야 합니다.';
    case 'auth/user-not-found':          return '존재하지 않는 계정입니다.';
    case 'auth/wrong-password':          return '비밀번호가 올바르지 않습니다.';
    case 'auth/invalid-credential':      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests':       return '잠시 후 다시 시도해 주세요.';
    default:                             return `오류가 발생했습니다 (${code})`;
  }
}

const S = {
  page: {
    position: 'fixed', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(6px)',
    zIndex: 200,
  },
  card: {
    position: 'relative',
    width: 380, padding: '44px 40px',
    background: 'linear-gradient(160deg, #0f0d1c 0%, #0a0814 100%)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18,
    boxShadow: '0 0 60px rgba(124,92,191,0.15), 0 24px 60px rgba(0,0,0,0.7)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  logo: {
    fontSize: 28, fontWeight: 900, color: '#fbbf24', letterSpacing: 2,
  },
  logoSub: {
    fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: 5, marginBottom: 20,
  },
  tabs: {
    display: 'flex', width: '100%',
    background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1, padding: '8px 0', border: 'none', borderRadius: 6,
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    background: 'transparent', color: 'rgba(180,210,240,0.4)',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'rgba(124,92,191,0.35)', color: '#e2e8f8',
  },
  form: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 14,
  },
  label: {
    display: 'flex', flexDirection: 'column', gap: 5,
  },
  labelText: {
    fontSize: 11, color: 'rgba(180,210,240,0.5)', letterSpacing: 0.5,
  },
  input: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, padding: '10px 14px',
    color: '#e2e8f8', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  },
  error: {
    fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.1)',
    border: '1px solid rgba(248,113,113,0.25)', borderRadius: 6,
    padding: '8px 12px', textAlign: 'center',
  },
  success: {
    fontSize: 13, color: '#4ade80', background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.25)', borderRadius: 6,
    padding: '10px 12px', textAlign: 'center', fontWeight: 700,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14,
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6, color: 'rgba(180,210,240,0.5)', fontSize: 13,
    width: 28, height: 28, cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    marginTop: 4, padding: '13px 0',
    background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
    border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
    letterSpacing: 1, boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
    transition: 'opacity 0.15s',
  },
};
