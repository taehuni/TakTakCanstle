import { useState, useEffect, useRef } from 'react';
import { BUILD_WORDS } from '../data/words.js';
import { UNIT_META } from '../data/unitMeta.js';
import { UNIT_DEFS } from '../data/units.js';
import { SHEETS } from '../game/SpriteCache.js';

const HIDDEN_UNITS = BUILD_WORDS.filter(w => w.hidden && w.type === 'unit');

function UnitCanvas({ unitId, size = 56, silhouette = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    const def = UNIT_DEFS[unitId];
    if (!def) return;

    const drawFallback = () => {
      ctx.fillStyle = silhouette ? '#1a1a2a' : (def.color + '44');
      ctx.fillRect(4, 4, size - 8, size - 8);
      if (!silhouette) {
        const meta = UNIT_META[unitId];
        ctx.fillStyle = meta?.color || '#aaa';
        ctx.font = `bold ${Math.floor(size * 0.4)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText((meta?.label || unitId)[0], size / 2, size / 2);
      }
    };

    const blit = (img, sx, sy, sw, sh) => {
      if (silhouette) {
        const tmp = document.createElement('canvas');
        tmp.width = size; tmp.height = size;
        const tc = tmp.getContext('2d');
        tc.imageSmoothingEnabled = false;
        tc.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        // silhouette: tint solid dark
        tc.globalCompositeOperation = 'source-in';
        tc.fillStyle = '#1a1a2a';
        tc.fillRect(0, 0, size, size);
        ctx.drawImage(tmp, 0, 0);
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      }
    };

    if (def.sprite) {
      const img = new Image();
      img.onload = () => blit(img, 0, 0, img.width, img.height);
      img.onerror = drawFallback;
      img.src = def.sprite;
    } else if (def.sheet && def.tileRow !== null) {
      const sd = SHEETS[def.sheet];
      if (!sd) { drawFallback(); return; }
      const img = new Image();
      img.onload = () => {
        const step = sd.tileW + (sd.spacing || 0);
        blit(img, def.tileCol * step, def.tileRow * step, sd.tileW, sd.tileH);
      };
      img.onerror = drawFallback;
      img.src = sd.src;
    } else {
      drawFallback();
    }
  }, [unitId, size, silhouette]);

  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: 'pixelated', display: 'block' }} />;
}

function UnitCard({ entry, discovered }) {
  const meta = UNIT_META[entry.unit] || {};
  const color = meta.color || '#888';

  if (!discovered) {
    return (
      <div style={{ ...S.card, borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)' }}>
        <div style={{ position: 'relative' }}>
          <UnitCanvas unitId={entry.unit} size={56} silhouette />
          <div style={S.unknownOverlay}>?</div>
        </div>
        <div style={{ fontSize: 13, color: '#555070', fontWeight: 700, marginTop: 6 }}>???</div>
        <div style={{ fontSize: 10, color: '#3a3555', letterSpacing: 1, marginTop: 2 }}>미발견</div>
      </div>
    );
  }

  return (
    <div style={{ ...S.card, borderColor: color + '55', background: color + '0d' }}>
      <UnitCanvas unitId={entry.unit} size={64} />
      <div style={{ fontSize: 14, color, fontWeight: 800, marginTop: 10, letterSpacing: 0.5 }}>{meta.label || entry.unit}</div>
      <div style={{
        marginTop: 6, fontSize: 11, color: color,
        background: color + '18', border: `1px solid ${color}44`,
        borderRadius: 4, padding: '2px 10px', letterSpacing: 0.5,
      }}>{entry.word}</div>
    </div>
  );
}

export default function DogamScreen({ onBack }) {
  const [discovered, setDiscovered] = useState([]);

  useEffect(() => {
    setDiscovered(JSON.parse(localStorage.getItem('tcb_discovered') || '[]'));
  }, []);

  const count = HIDDEN_UNITS.filter(w => discovered.includes(w.unit)).length;
  const total = HIDDEN_UNITS.length;
  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={onBack} style={S.backBtn}>← 돌아가기</button>
        <div style={S.titleArea}>
          <div style={S.eyebrow}>HIDDEN UNIT COLLECTION</div>
          <h1 style={S.title}>히든 유닛 도감</h1>
        </div>
        <div style={S.progress}>
          <div style={S.progressNum}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#fde047' }}>{count}</span>
            <span style={{ fontSize: 14, color: '#2e2550', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: 16, color: '#2e2550' }}>{total}</span>
          </div>
          <div style={{ fontSize: 10, color: '#2e2550', letterSpacing: 1, marginTop: 2 }}>발견 완료</div>
          <div style={S.progressBar}>
            <div style={{ ...S.progressFill, width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 10, color: '#fde047', marginTop: 4 }}>{pct}%</div>
        </div>
      </div>

      <div style={S.hint}>
        게임 중 어떤 단어든 타이핑해 보세요 — 히든 유닛이 소환될지도 모릅니다.
      </div>

      <div style={S.grid}>
        {HIDDEN_UNITS.map(entry => (
          <UnitCard key={entry.unit} entry={entry} discovered={discovered.includes(entry.unit)} />
        ))}
      </div>

      {count === total && total > 0 && (
        <div style={S.completeMsg}>
          ✦ 모든 히든 유닛을 발견했습니다! ✦
        </div>
      )}
    </div>
  );
}

const S = {
  page: {
    width: 1200, minHeight: '100vh',
    background: 'linear-gradient(180deg, #12102a 0%, #1a1636 100%)',
    color: '#e2e8f8',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '0 0 60px',
  },
  header: {
    width: '100%', maxWidth: 940,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '32px 0 28px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 24,
  },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8, color: '#ccc', fontSize: 13, fontWeight: 600,
    padding: '9px 18px', cursor: 'pointer', letterSpacing: 0.3,
  },
  titleArea: { textAlign: 'center', flex: 1 },
  eyebrow: { fontSize: 9, color: '#fde047', fontWeight: 700, letterSpacing: 4, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: 2 },
  progress: { textAlign: 'right', minWidth: 110 },
  progressNum: { display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end' },
  progressBar: {
    width: 110, height: 5, background: '#2a2545', borderRadius: 3,
    overflow: 'hidden', marginTop: 6,
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #7c3aed, #fde047)',
    transition: 'width 0.4s ease',
    borderRadius: 3,
  },
  hint: {
    fontSize: 12, color: '#6a6080', letterSpacing: 0.5,
    marginBottom: 28, textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    width: '100%', maxWidth: 940,
  },
  card: {
    padding: '18px 12px 14px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  unknownOverlay: {
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 900, color: '#3a3555',
  },
  completeMsg: {
    marginTop: 40, fontSize: 14, fontWeight: 700, color: '#fde047',
    letterSpacing: 3, textShadow: '0 0 20px #fde047',
  },
};
