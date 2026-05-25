export default function ResultScreen({ result, onReplay, onMenu }) {
  if (!result) return null;
  const won  = result.winner === 'player';
  const { stats } = result;
  const grade = getGrade(stats, won);

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* 승패 배너 */}
        <div className="anim-win" style={{ ...S.banner, background: won ? S.winGrad : S.loseGrad }}>
          <span style={S.bannerText}>{won ? '승리' : '패배'}</span>
          <span style={S.bannerEn}>{won ? 'VICTORY' : 'DEFEAT'}</span>
        </div>

        {/* 등급 */}
        <div className="anim-2" style={S.gradeWrap}>
          <div style={{ ...S.gradeLetter, color: grade.color }}>{grade.letter}</div>
          <div style={S.gradeLabel}>{grade.label}</div>
        </div>

        {/* 스탯 */}
        <div className="anim-3" style={S.grid}>
          <StatCard label="입력 단어"  value={stats.wordsTyped}  unit="개" color="#c084fc" />
          <StatCard label="분당 타수"  value={stats.wpm}         unit="WPM" color="#60a5fa" />
          <StatCard label="건설 부대"  value={stats.unitsBuilt}  unit="명" color="#4ade80" />
          <StatCard label="적 처치"    value={stats.kills}        unit="킬" color="#f87171" />
        </div>

        {/* 버튼 */}
        <div className="anim-4" style={S.btns}>
          <button className="btn-action" onClick={onReplay}>다시하기</button>
          <button className="btn-ghost"  onClick={onMenu}>메인메뉴</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statUnit}>{unit}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

function getGrade(stats, won) {
  if (!won) return { letter: 'F', color: '#6b6b8a', label: '다음엔 이길 수 있어' };
  const score = (stats.wpm || 0) * 2 + (stats.wordsTyped || 0) * 4 + (stats.kills || 0) * 3;
  if (score >= 180) return { letter: 'S', color: '#fde047', label: '완벽한 타자 실력!' };
  if (score >= 120) return { letter: 'A', color: '#4ade80', label: '훌륭한 전략가' };
  if (score >= 70)  return { letter: 'B', color: '#60a5fa', label: '선전했습니다' };
  return              { letter: 'C', color: '#94a3b8', label: '아직 갈 길이 멀다' };
}

const S = {
  page: {
    width: '100vw', height: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, #1a0e2e 0%, #07060f 65%)',
  },
  card: {
    width: 560, padding: '40px 44px',
    background: 'linear-gradient(160deg, #0f0d1c 0%, #0a0814 100%)',
    border: '1px solid #1e1630', borderRadius: 16,
    boxShadow: '0 0 60px rgba(124,92,191,0.12), 0 24px 60px rgba(0,0,0,0.7)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
  },
  banner: {
    width: '100%', borderRadius: 12, padding: '18px 0',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  winGrad:  'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
  loseGrad: 'linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #991b1b 100%)',
  bannerText: { fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: 6 },
  bannerEn:   { fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: 8, marginTop: 2 },

  gradeWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  gradeLetter: { fontSize: 72, fontWeight: 900, lineHeight: 1 },
  gradeLabel:  { fontSize: 12, color: '#2e2550', letterSpacing: 2 },

  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, width: '100%',
  },
  stat: {
    background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1628',
    borderRadius: 10, padding: '16px 8px', textAlign: 'center',
  },
  statValue: { fontSize: 30, fontWeight: 900, lineHeight: 1 },
  statUnit:  { fontSize: 10, color: '#2e2550', marginTop: 2, letterSpacing: 1 },
  statLabel: { fontSize: 11, color: '#2a2440', marginTop: 6 },

  btns: { display: 'flex', gap: 12 },
};
