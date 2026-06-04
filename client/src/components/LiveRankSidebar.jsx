import { useState, useEffect } from 'react';
import { subscribeTopRanks, getTier } from '../data/rankService.js';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function LiveRankSidebar() {
  const [ranks, setRanks]   = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const unsub = subscribeTopRanks(10, data => {
      setRanks(data);
      setLoaded(true);
    });
    return unsub;
  }, []);

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <span style={S.headerIcon}>⚔</span>
        <span style={S.headerText}>랭크 TOP 10</span>
        <span style={S.liveDot} />
      </div>

      <div style={S.list}>
        {!loaded && (
          <div style={S.empty}>불러오는 중...</div>
        )}
        {loaded && ranks.length === 0 && (
          <div style={S.empty}>랭크 기록 없음</div>
        )}
        {ranks.map((s, i) => {
          const tier = getTier(s.lp || 0);
          return (
            <div key={s.id} style={{ ...S.row, background: i < 3 ? tier.color + '08' : 'transparent' }}>
              <span style={{ ...S.rank, color: i < 3 ? tier.color : '#2e2550' }}>
                {i < 3 ? MEDAL[i] : `#${i + 1}`}
              </span>
              <span style={S.tierEmoji}>{tier.emoji}</span>
              <span style={S.name}>{s.name}</span>
              <span style={{ ...S.lp, color: tier.color }}>{s.lp || 0}<span style={S.lpUnit}>LP</span></span>
            </div>
          );
        })}
      </div>

      <div style={S.footer}>랭크 게임 전적 기준 · ELO 기반 LP</div>
    </div>
  );
}

const S = {
  wrap: {
    position: 'fixed',
    right: 16,
    top: 80,
    width: 240,
    background: 'rgba(10,8,24,0.92)',
    border: '1px solid rgba(255,255,255,0.13)',
    borderRadius: 14,
    backdropFilter: 'blur(20px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,191,0.08)',
    overflow: 'hidden',
    zIndex: 50,
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '13px 14px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(124,92,191,0.08)',
  },
  headerIcon: { fontSize: 14 },
  headerText: { fontSize: 12, fontWeight: 800, color: '#c084fc', letterSpacing: 2, flex: 1 },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#4ade80',
    boxShadow: '0 0 8px #4ade80',
    animation: 'pulse 2s infinite',
  },
  list: { padding: '8px 0' },
  empty: { fontSize: 12, color: '#2e2550', textAlign: 'center', padding: '16px 0' },
  row: {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '7px 12px',
  },
  rank: { fontSize: 14, fontWeight: 900, width: 26, flexShrink: 0, textAlign: 'center' },
  tierEmoji: { fontSize: 13, flexShrink: 0 },
  name: {
    fontSize: 12, color: '#c0c8e0', flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    fontWeight: 600,
  },
  lp: { fontSize: 13, fontWeight: 900, flexShrink: 0 },
  lpUnit: { fontSize: 9, marginLeft: 2, opacity: 0.6 },
  footer: {
    fontSize: 10, color: '#2a2550', textAlign: 'center',
    padding: '8px 10px 10px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    letterSpacing: 0.3,
  },
};
