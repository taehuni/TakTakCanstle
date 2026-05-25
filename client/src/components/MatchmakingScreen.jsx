import { useEffect, useRef, useState } from 'react';
import { SocketManager } from '../game/SocketManager.js';

export default function MatchmakingScreen({ onMatched, onBack }) {
  const [status, setStatus] = useState('connecting'); // connecting | waiting | matched
  const mgr = useRef(null);

  useEffect(() => {
    const sm = new SocketManager();
    mgr.current = sm;
    let matched = false;

    sm.connect();

    sm.on('connect',  () => { setStatus('waiting'); sm.joinQueue(); });
    sm.on('waiting',  () => setStatus('waiting'));
    sm.on('matched',  ({ roomId, side }) => {
      matched = true;
      setStatus('matched');
      onMatched({ socket: sm, side });
    });

    return () => { if (!matched) sm.disconnect(); };
  }, [onMatched]);

  const label = {
    connecting: '서버 연결 중...',
    waiting:    '상대방 기다리는 중...',
    matched:    '매칭 완료! 게임 시작',
  }[status];

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.title}>온라인 대전</div>
        <div style={S.dot}>
          {[0,1,2].map(i => (
            <span key={i} style={{ ...S.d, animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
        <div style={S.label}>{label}</div>
        <button style={S.back} onClick={() => { mgr.current?.disconnect(); onBack(); }}>
          취소
        </button>
      </div>
      <style>{`
        @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
      `}</style>
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
    borderRadius: 12, padding: '48px 64px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
  },
  title: { fontSize: 24, fontWeight: 800, color: '#e8e8f0', letterSpacing: 2 },
  dot: { display: 'flex', gap: 10 },
  d: {
    display: 'inline-block', width: 10, height: 10,
    borderRadius: '50%', background: '#7c3aed',
    animation: 'blink 1.2s infinite',
  },
  label: { fontSize: 14, color: '#94a3b8' },
  back: {
    marginTop: 8, padding: '8px 24px',
    background: 'transparent', border: '1px solid #334155',
    borderRadius: 6, color: '#64748b', cursor: 'pointer', fontSize: 13,
  },
};
