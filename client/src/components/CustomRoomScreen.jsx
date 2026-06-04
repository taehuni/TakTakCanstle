import { useEffect, useRef, useState } from 'react';
import { SocketManager } from '../game/SocketManager.js';

export default function CustomRoomScreen({ onMatched, onBack }) {
  const [tab, setTab]       = useState('create'); // 'create' | 'join'
  const [phase, setPhase]   = useState('idle');   // 'idle' | 'waiting' | 'error'
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg]   = useState('');
  const mgr = useRef(null);

  useEffect(() => {
    const sm = new SocketManager();
    mgr.current = sm;
    let matched = false;

    sm.connect();

    sm.on('connect', () => {});

    sm.on('room_code', ({ code }) => {
      setRoomCode(code);
      setPhase('waiting');
    });

    sm.on('room_error', ({ msg }) => {
      setErrorMsg(msg);
      setPhase('error');
    });

    sm.on('matched', ({ roomId, side, mode }) => {
      matched = true;
      onMatched({ socket: sm, side, mode: mode || 'custom', opponentLp: null });
    });

    return () => { if (!matched) sm.disconnect(); };
  }, [onMatched]);

  const handleCreate = () => {
    setPhase('idle');
    setRoomCode('');
    setErrorMsg('');
    mgr.current?.createCustomRoom();
  };

  const handleJoin = () => {
    if (inputCode.length < 6) { setErrorMsg('6자리 코드를 입력하세요.'); setPhase('error'); return; }
    setErrorMsg('');
    setPhase('idle');
    mgr.current?.joinCustomRoom(inputCode);
  };

  const handleTabSwitch = (t) => {
    setTab(t);
    setPhase('idle');
    setRoomCode('');
    setErrorMsg('');
    setInputCode('');
  };

  const handleCancel = () => {
    mgr.current?.disconnect();
    onBack();
  };

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.eyebrow}>🎮 CUSTOM ROOM</div>
        <div style={S.title}>커스텀 방</div>

        {/* 탭 */}
        <div style={S.tabs}>
          <button
            style={{ ...S.tab, ...(tab === 'create' ? S.tabActive : {}) }}
            onClick={() => handleTabSwitch('create')}
          >
            방 만들기
          </button>
          <button
            style={{ ...S.tab, ...(tab === 'join' ? S.tabActive : {}) }}
            onClick={() => handleTabSwitch('join')}
          >
            방 참가
          </button>
        </div>

        {/* 방 만들기 */}
        {tab === 'create' && (
          <div style={S.panel}>
            {phase !== 'waiting' && (
              <>
                <p style={S.desc}>방을 만들고 친구에게 코드를 알려주세요.</p>
                <button style={S.actionBtn} onClick={handleCreate}>방 만들기</button>
              </>
            )}
            {phase === 'waiting' && roomCode && (
              <>
                <p style={S.desc}>친구에게 이 코드를 알려주세요</p>
                <div style={S.codeBox}>
                  <span style={S.codeText}>{roomCode}</span>
                </div>
                <div style={S.dots}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ ...S.dot, animationDelay: `${i * 0.3}s` }} />
                  ))}
                </div>
                <div style={S.waitLabel}>친구를 기다리는 중...</div>
              </>
            )}
          </div>
        )}

        {/* 방 참가 */}
        {tab === 'join' && (
          <div style={S.panel}>
            <p style={S.desc}>친구에게 받은 6자리 코드를 입력하세요.</p>
            <input
              style={S.codeInput}
              value={inputCode}
              maxLength={6}
              placeholder="예: A1B2C3"
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              autoFocus
            />
            <button style={S.actionBtn} onClick={handleJoin}>
              참가하기
            </button>
          </div>
        )}

        {/* 에러 */}
        {phase === 'error' && errorMsg && (
          <div style={S.error}>{errorMsg}</div>
        )}

        <button style={S.back} onClick={handleCancel}>취소</button>
      </div>
      <style>{`@keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }`}</style>
    </div>
  );
}

const S = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '100vw', height: '100vh',
  },
  box: {
    background: '#0d1020', border: '2px solid #2a1f4a',
    borderRadius: 14, padding: '48px 60px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    minWidth: 380,
  },
  eyebrow: { fontSize: 10, color: '#6b7280', letterSpacing: 4, fontWeight: 700 },
  title:   { fontSize: 24, fontWeight: 800, color: '#e8e8f0', letterSpacing: 2 },

  tabs: { display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid #2a1f4a' },
  tab: {
    padding: '9px 28px', background: 'transparent',
    border: 'none', color: '#6b7280', fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  tabActive: {
    background: 'rgba(124,92,191,0.2)', color: '#c084fc',
  },

  panel: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    width: '100%',
  },
  desc: { fontSize: 13, color: '#64748b', margin: 0, textAlign: 'center' },

  codeBox: {
    background: 'rgba(124,92,191,0.12)',
    border: '2px solid rgba(124,92,191,0.4)',
    borderRadius: 12, padding: '16px 32px',
  },
  codeText: {
    fontSize: 40, fontWeight: 900, letterSpacing: 10,
    color: '#c084fc', fontFamily: 'monospace',
  },

  dots: { display: 'flex', gap: 10 },
  dot: {
    display: 'inline-block', width: 10, height: 10,
    borderRadius: '50%', background: '#7c5cbf',
    animation: 'blink 1.2s infinite',
  },
  waitLabel: { fontSize: 13, color: '#64748b' },

  codeInput: {
    width: '100%', padding: '14px 18px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid #2a1f4a',
    borderRadius: 8, color: '#e8e8f0', fontSize: 24, fontWeight: 900,
    textAlign: 'center', letterSpacing: 8, fontFamily: 'monospace',
    outline: 'none', boxSizing: 'border-box',
  },

  actionBtn: {
    padding: '12px 40px', borderRadius: 8,
    background: 'rgba(124,92,191,0.25)', border: '1px solid rgba(124,92,191,0.5)',
    color: '#c084fc', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    letterSpacing: 1,
  },

  error: {
    fontSize: 13, color: '#f87171', fontWeight: 600,
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
    borderRadius: 6, padding: '8px 18px', textAlign: 'center',
  },

  back: {
    marginTop: 4, padding: '8px 24px',
    background: 'transparent', border: '1px solid #334155',
    borderRadius: 6, color: '#64748b', cursor: 'pointer', fontSize: 13,
  },
};
