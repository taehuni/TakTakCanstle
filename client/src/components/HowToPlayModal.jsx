export default function HowToPlayModal({ onClose }) {
  return (
    <div style={S.backdrop} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>HOW TO PLAY</div>
            <h2 style={S.title}>게임 방법</h2>
          </div>
          <button style={S.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={S.body}>

          {/* 흐름 */}
          <div style={S.flowRow}>
            {[
              { icon: '⚒', label: '건설 단계', sub: '30초', color: '#fbbf24', desc: '유닛·건물 소환' },
              { icon: '→', label: '', sub: '', color: '#666', desc: '' },
              { icon: '⚔', label: '전투 단계', sub: '120초', color: '#f87171', desc: '마법으로 공격' },
              { icon: '→', label: '', sub: '', color: '#666', desc: '' },
              { icon: '🏆', label: '승패 결정', sub: '', color: '#4ade80', desc: '성 파괴 또는 HP 비교' },
            ].map((s, i) => s.label ? (
              <div key={i} style={{ ...S.flowStep, borderColor: s.color + '44', background: s.color + '10' }}>
                <div style={{ fontSize: 22 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 10, color: s.color + '99', letterSpacing: 1 }}>{s.sub}</div>}
                <div style={{ fontSize: 11, color: '#9090b0', marginTop: 2 }}>{s.desc}</div>
              </div>
            ) : (
              <div key={i} style={{ fontSize: 20, color: '#777', alignSelf: 'center' }}>›</div>
            ))}
          </div>

          <div style={S.cols}>
            {/* 건설 단계 */}
            <div style={S.section}>
              <div style={{ ...S.secHead, color: '#fbbf24' }}>⚒ 건설 단계</div>
              <div style={S.secBody}>
                <Row icon="⌨" text="단어 입력 후 Enter → 유닛·건물 즉시 소환" />
                <Row icon="🏯" text="성벽 위치(후방·중간·전방)와 진형을 전략 패널에서 설정" />
                <Row icon="✦" text="힌트에 없는 단어도 입력해보세요 — 히든 유닛이 소환될 수도!" color="#fde047" />
              </div>
              <div style={S.chipRow}>
                {['검사','궁수','기사','성벽'].map(w => (
                  <Chip key={w} word={w} color="#60a5fa" />
                ))}
                <Chip word="???" color="#fde047" dim />
              </div>
            </div>

            {/* 전투 단계 */}
            <div style={S.section}>
              <div style={{ ...S.secHead, color: '#f87171' }}>⚔ 전투 단계</div>
              <div style={S.secBody}>
                <Row icon="🎯" text="대유닛 마법 — 최전선 적 유닛 공격 / 유닛 없으면 성에 50% 피해" color="#60a5fa" />
                <Row icon="💥" text="공성 마법 — 성벽 있으면 성벽 타격, 없으면 성 직격 (쿨타임 있음)" color="#fb923c" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={S.spellRow}>
                  <span style={{ ...S.tag, color: '#60a5fa' }}>대유닛</span>
                  {['화염','얼음','불화살','독화살'].map(w => <Chip key={w} word={w} color="#60a5fa" />)}
                </div>
                <div style={S.spellRow}>
                  <span style={{ ...S.tag, color: '#fb923c' }}>공성</span>
                  {['번개','폭발','마법진','화염구'].map(w => <Chip key={w} word={w} color="#fb923c" />)}
                </div>
              </div>
            </div>
          </div>

          {/* 승리 조건 */}
          <div style={S.winRow}>
            <WinCard icon="💣" color="#f87171" title="즉시 승리" desc="적의 성 HP를 0으로 만들면 바로 승리" />
            <div style={{ fontSize: 18, color: '#888', alignSelf: 'center' }}>또는</div>
            <WinCard icon="⏱" color="#4ade80" title="시간 종료" desc="120초 후 남은 HP가 더 높은 플레이어 승리" />
          </div>

        </div>
      </div>
    </div>
  );
}

function Row({ icon, text, color }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: color || '#aaaacc', lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

function Chip({ word, color, dim }) {
  return (
    <span style={{
      fontSize: 12, padding: '3px 10px', borderRadius: 4,
      border: `1px solid ${color}${dim ? '44' : '55'}`,
      color: dim ? color + '66' : color,
      background: color + '10',
      letterSpacing: 0.5,
    }}>{word}</span>
  );
}

function WinCard({ icon, color, title, desc }) {
  return (
    <div style={{ flex: 1, padding: '14px 18px', borderRadius: 10, border: `1px solid ${color}33`, background: color + '0c', display: 'flex', gap: 14, alignItems: 'center' }}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9090b0', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
  },
  modal: {
    width: 760, maxHeight: '90vh',
    background: 'linear-gradient(160deg, #1a1730 0%, #131128 100%)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
    boxShadow: '0 0 60px rgba(124,92,191,0.15), 0 24px 60px rgba(0,0,0,0.7)',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '24px 32px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  eyebrow: { fontSize: 9, color: '#fde047', fontWeight: 700, letterSpacing: 4, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: 900, color: '#fff', margin: 0 },
  closeBtn: {
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, color: '#aaa', fontSize: 16, width: 36, height: 36,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  body: {
    padding: '24px 32px 28px', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 22,
  },

  flowRow: {
    display: 'flex', alignItems: 'stretch', gap: 8,
  },
  flowStep: {
    flex: 1, padding: '14px 10px', borderRadius: 10, border: '1px solid',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    textAlign: 'center',
  },

  cols: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  section: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
  },
  secHead: { fontSize: 13, fontWeight: 800, letterSpacing: 1 },
  secBody: { display: 'flex', flexDirection: 'column' },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  spellRow: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tag: { fontSize: 10, fontWeight: 700, letterSpacing: 1, flexShrink: 0, minWidth: 36 },

  winRow: { display: 'flex', gap: 14, alignItems: 'center' },
};
