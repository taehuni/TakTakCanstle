import { useState, useEffect } from 'react';
import { subscribeTopRanks, getTier } from '../data/rankService.js';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function RankScreen({ onBack, currentUid }) {
  const [ranks, setRanks]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeTopRanks(30, data => {
      setRanks(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.topRow}>
          <button onClick={onBack} style={S.backBtn}>← 돌아가기</button>
          <div>
            <div style={S.eyebrow}>RANKED LEADERBOARD</div>
            <h1 style={S.title}>⚔ 랭킹</h1>
          </div>
          <div style={{ width: 100 }} />
        </div>

        <div style={S.board}>
          {loading && <div style={S.status}>불러오는 중...</div>}
          {!loading && ranks.length === 0 && (
            <div style={S.status}>아직 랭크 기록이 없습니다.<br /><span style={{ fontSize: 11, color: '#888' }}>랭크 게임을 플레이하면 자동으로 등록됩니다.</span></div>
          )}
          {!loading && ranks.map((s, i) => {
            const tier = getTier(s.lp || 0);
            const isMe = s.id === currentUid;
            return (
              <div key={s.id} style={{ ...S.row,
                background: isMe ? 'rgba(124,92,191,0.15)' : i < 3 ? tier.color + '10' : 'rgba(255,255,255,0.02)',
                borderColor: isMe ? '#7c5cbf' : i < 3 ? tier.color + '35' : '#1a1628',
              }}>
                <div style={{ ...S.rankNum, color: i < 3 ? tier.color : '#7878a8' }}>
                  {i < 3 ? MEDAL[i] : `#${i + 1}`}
                </div>
                <div style={{ ...S.tierBadge, color: tier.color, borderColor: tier.color + '55' }}>
                  {tier.emoji}
                </div>
                <div style={S.playerName}>{s.name}{isMe && <span style={{ fontSize: 10, color: '#7c5cbf', marginLeft: 6 }}>나</span>}</div>
                <div style={S.statCell}><span style={S.statVal}>{s.wins || 0}</span><span style={S.statUnit}>승</span></div>
                <div style={S.statCell}><span style={S.statVal}>{s.losses || 0}</span><span style={S.statUnit}>패</span></div>
                <div style={{ ...S.lpCell, color: tier.color }}>{s.lp || 0}<span style={{ fontSize: 10, marginLeft: 2, opacity: 0.6 }}>LP</span></div>
                <div style={{ ...S.tierName, color: tier.color }}>{tier.name}</div>
              </div>
            );
          })}
        </div>

        <div style={S.hint}>랭크 게임 전적만 반영됩니다 · ELO 기반 LP 변동</div>
      </div>
    </div>
  );
}

const S = {
  page: {
    width: '100vw', minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, #1e1540 0%, #0f0d20 65%)',
    padding: '40px 20px',
  },
  card: {
    width: 700, padding: '36px 40px',
    background: 'linear-gradient(160deg, #1a1730 0%, #131128 100%)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
    boxShadow: '0 0 60px rgba(124,92,191,0.15), 0 24px 60px rgba(0,0,0,0.6)',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  topRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, color: '#ccc', fontSize: 13, fontWeight: 600,
    padding: '9px 18px', cursor: 'pointer', letterSpacing: 0.3,
  },
  eyebrow: { fontSize: 9, color: '#fde047', fontWeight: 700, letterSpacing: 4, marginBottom: 4, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, textAlign: 'center' },

  nameRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
  },
  nameLabel: { fontSize: 11, color: '#9090b0', flexShrink: 0 },
  nameInput: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#ddd', fontSize: 14, fontFamily: 'inherit',
  },
  nameBtn: {
    background: '#1e1630', border: '1px solid #7878a8', borderRadius: 4,
    color: '#7c5cbf', fontSize: 11, padding: '4px 10px', cursor: 'pointer',
  },

  board: { display: 'flex', flexDirection: 'column', gap: 6 },
  status: {
    textAlign: 'center', fontSize: 13, color: '#7878a8',
    padding: '30px 0', lineHeight: 1.8,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 14px', borderRadius: 8, border: '1px solid',
  },
  rankNum: { width: 32, fontSize: 16, fontWeight: 900, textAlign: 'center', flexShrink: 0 },
  playerName: { flex: 1, fontSize: 13, color: '#ccc', fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statCell: { display: 'flex', alignItems: 'baseline', gap: 2, minWidth: 50, justifyContent: 'flex-end' },
  statVal:  { fontSize: 14, fontWeight: 700, color: '#aaa' },
  statUnit: { fontSize: 9, color: '#9090b8' },
  tierBadge: {
    width: 28, textAlign: 'center', fontSize: 16, flexShrink: 0,
    border: '1px solid', borderRadius: 6, padding: '2px 4px',
  },
  lpCell: { fontSize: 14, fontWeight: 900, minWidth: 56, textAlign: 'right', flexShrink: 0 },
  tierName: { fontSize: 10, fontWeight: 700, minWidth: 52, textAlign: 'right', letterSpacing: 0.5, flexShrink: 0 },

  hint: { fontSize: 10, color: '#5a4a7a', textAlign: 'center', letterSpacing: 0.5 },
};
