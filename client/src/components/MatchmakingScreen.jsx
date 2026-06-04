import { useEffect, useRef, useState } from 'react';
import { SocketManager } from '../game/SocketManager.js';
import { getUserRank, getTier } from '../data/rankService.js';

export default function MatchmakingScreen({ onMatched, onBack, mode = 'normal', userId }) {
  const [status, setStatus] = useState('connecting');
  const [myRank, setMyRank] = useState(null);
  const mgr = useRef(null);
  const isRanked = mode === 'ranked';

  useEffect(() => {
    const sm = new SocketManager();
    mgr.current = sm;
    let matched = false;

    sm.connect();

    sm.on('connect', async () => {
      if (isRanked) {
        const rank = await getUserRank(userId).catch(() => ({ lp: 0, wins: 0, losses: 0 }));
        setMyRank(rank);
        sm.joinRankedQueue(rank.lp || 0);
      } else {
        sm.joinQueue();
      }
      setStatus('waiting');
    });

    sm.on('waiting', () => setStatus('waiting'));

    sm.on('matched', ({ roomId, side, mode: matchedMode, opponentLp }) => {
      matched = true;
      setStatus('matched');
      onMatched({ socket: sm, side, mode: matchedMode || 'normal', opponentLp });
    });

    return () => { if (!matched) sm.disconnect(); };
  }, [onMatched, isRanked, userId]);

  const label = {
    connecting: '서버 연결 중...',
    waiting:    '상대방 기다리는 중...',
    matched:    '매칭 완료! 게임 시작',
  }[status];

  const tier = myRank ? getTier(myRank.lp) : null;

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.eyebrow}>{isRanked ? '⚔ RANKED' : '🌐 NORMAL'}</div>
        <div style={S.title}>{isRanked ? '랭크 게임' : '온라인 대전'}</div>

        {isRanked && tier && (
          <div style={{ ...S.tierBadge, color: tier.color, borderColor: tier.color + '55' }}>
            {tier.emoji} {tier.name} · {myRank.lp} LP
          </div>
        )}

        <div style={S.dot}>
          {[0,1,2].map(i => (
            <span key={i} style={{ ...S.d, background: isRanked ? '#f59e0b' : '#7c3aed', animationDelay: `${i * 0.3}s` }} />
          ))}
        </div>
        <div style={S.label}>{label}</div>
        <button style={S.back} onClick={() => { mgr.current?.disconnect(); onBack(); }}>
          취소
        </button>
      </div>
      <style>{`@keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }`}</style>
    </div>
  );
}

const S = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh' },
  box: {
    background: '#0d1020', border: '2px solid #2a1f4a',
    borderRadius: 12, padding: '48px 64px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
  },
  eyebrow: { fontSize: 10, color: '#6b7280', letterSpacing: 4, fontWeight: 700 },
  title:   { fontSize: 24, fontWeight: 800, color: '#e8e8f0', letterSpacing: 2 },
  tierBadge: {
    fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20,
    border: '1px solid', background: 'rgba(255,255,255,0.04)',
  },
  dot:   { display: 'flex', gap: 10, marginTop: 8 },
  d: {
    display: 'inline-block', width: 10, height: 10,
    borderRadius: '50%', animation: 'blink 1.2s infinite',
  },
  label: { fontSize: 14, color: '#94a3b8' },
  back: {
    marginTop: 8, padding: '8px 24px',
    background: 'transparent', border: '1px solid #334155',
    borderRadius: 6, color: '#64748b', cursor: 'pointer', fontSize: 13,
  },
};
