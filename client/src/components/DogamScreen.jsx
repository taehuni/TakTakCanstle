import { useState, useEffect, useRef } from 'react';
import { BUILD_WORDS } from '../data/words.js';
import { UNIT_META } from '../data/unitMeta.js';
import { UNIT_DEFS } from '../data/units.js';
import { SHEETS } from '../game/SpriteCache.js';

const PUBLIC_UNITS = BUILD_WORDS.filter(w => !w.hidden && w.type === 'unit');
const HIDDEN_UNITS = BUILD_WORDS.filter(w =>  w.hidden && w.type === 'unit');

// ── 번역 테이블 ────────────────────────────────────────────────────────────
const ROLE_KO    = { infantry:'보병', ranged:'원거리', heavy:'중장보병', mage:'마법사', spirit:'정령', explosive:'폭발물', siege:'공성' };
const FACTION_KO = { human:'인간', undead:'언데드', goblin:'고블린', orc:'오크', feline:'정령', beast:'야수', dragon:'용족' };
const DMG_KO     = { physical:'물리', pierce:'관통', magical:'마법', holy:'신성', fire:'화염', curse:'저주', true:'고정' };

// ── 상성 힌트 (combat.js 기반) ──────────────────────────────────────────────
// 어느 종족/유형에 강한지만 표시 (특성과 중복 제외)
const COUNTER_INFO = {
  swordsman:   '마법사 계열에 강함',
  archer:      '보병 계열에 강함',
  knight:      '원거리·궁수 계열에 강함',
  wizard:      '중장갑 유닛에 강함',
  paladin:     '언데드 진영에 강함',
  priest:      '언데드 진영에 강함',
  rogue:       '마법사 계열에 강함',
  lich:        '중장갑·정령 유닛에 강함',
  death_knight:'중장갑 계열에 강함',
  shaman:      '강력한 단일 유닛에 강함',
  warchief:    '아군이 많을수록 강함',
  cat:         '인간 진영 유닛에 강함',
  wolf:        '마법사 계열에 강함 (빠른 돌격)',
  bear:        '원거리·궁수 계열에 강함 (고방어)',
  dragon:      '언데드·군집 유닛에 강함',
  eagle:       '지상 유닛에 강함',
};

function abilityDesc(ability, data = {}) {
  switch (ability) {
    case 'charge':      return `첫 번째 공격 시 ${Math.round((data.mult||1)*100)}% 피해`;
    case 'double_spawn':return '소환 시 2마리 동시 등장';
    case 'triple_spawn':return '소환 시 3마리 동시 등장';
    case 'phase':       return '첫 공격 전까지 완전 무적 · 성벽 통과';
    case 'revive':      return `사망 후 ${data.delay||1.5}초 뒤 HP ${Math.round((data.hpRatio||0.4)*100)}%로 부활 (1회)`;
    case 'life_steal':  return `가한 피해의 ${Math.round((data.stealRate||0.2)*100)}%를 HP로 흡수`;
    case 'aura':        return `주변 ${data.range||150}px 아군 속도 +${Math.round((data.speedMult||1.3)*100-100)}% · 공격력 +${Math.round((data.atkMult||1.2)*100-100)}%`;
    case 'kamikaze':    return `적 ${data.triggerRange||50}px 내 진입 시 자폭 · 반경 ${data.aoeRange||90}px AoE`;
    case 'rage':        return `HP ${Math.round((data.threshold||0.3)*100)}% 이하 → 공격력 ×${data.atkMult||2} · 속도 ×${data.spdMult||1.5}`;
    case 'curse':       return `대상 공격력 ${Math.round((data.curseMult||0.6)*100)}% · 지속 ${data.curseDuration||5}초`;
    case 'heal_aura':   return `주변 ${data.range||120}px 아군 초당 ${data.healRate||5} HP 회복`;
    case 'charm_aura':  return `주변 ${data.range||90}px 인간 유닛 행동 불가`;
    case 'regen':       return `매초 ${data.regenRate||3} HP 자동 회복`;
    default:            return null;
  }
}

const ABILITY_NAME = {
  charge:'돌격', double_spawn:'군집 소환', triple_spawn:'군집 소환',
  phase:'유체화', revive:'부활', life_steal:'흡혈',
  aura:'전투 오라', kamikaze:'자폭', rage:'분노',
  curse:'저주', heal_aura:'치유 오라', charm_aura:'매혹 오라', regen:'재생',
};

// ── 유닛 스프라이트 ────────────────────────────────────────────────────────
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
      img.onload = () => {
        if (def.animFrames) {
          const { cols, rows = 1, walkFrames = [0] } = def.animFrames;
          const fw = img.width / cols;
          const fh = img.height / rows;
          const fi = 0; // 도감: 항상 정면(frame 0) 포즈
          const sx = (fi % cols) * fw, sy = Math.floor(fi / cols) * fh;
          // 픽셀 스캔으로 실제 캐릭터 영역 감지
          const tmp = document.createElement('canvas');
          tmp.width = fw; tmp.height = fh;
          const tc = tmp.getContext('2d');
          tc.drawImage(img, sx, sy, fw, fh, 0, 0, fw, fh);
          const pd = tc.getImageData(0, 0, fw, fh).data;
          let x0 = fw, x1 = 0, y0 = fh, y1 = 0;
          for (let py = 0; py < fh; py++) for (let px = 0; px < fw; px++) {
            if (pd[(py * fw + px) * 4 + 3] > 10) {
              if (px < x0) x0 = px; if (px > x1) x1 = px;
              if (py < y0) y0 = py; if (py > y1) y1 = py;
            }
          }
          if (x1 >= x0 && y1 >= y0) blit(img, sx + x0, sy + y0, x1 - x0 + 1, y1 - y0 + 1);
          else blit(img, sx, sy, fw, fh);
        } else {
          blit(img, 0, 0, img.width, img.height);
        }
      };
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

// ── 유닛 카드 ──────────────────────────────────────────────────────────────
function UnitCard({ entry, discovered }) {
  const [hovered, setHovered] = useState(false);
  const meta  = UNIT_META[entry.unit] || {};
  const color = meta.color || '#888';

  if (!discovered) {
    return (
      <div style={{ ...S.card, borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.25)', cursor: 'default' }}>
        <div style={{ position: 'relative' }}>
          <UnitCanvas unitId={entry.unit} size={56} silhouette />
          <div style={S.unknownOverlay}>?</div>
        </div>
        <div style={{ fontSize: 13, color: '#9090b8', fontWeight: 700, marginTop: 6 }}>???</div>
        <div style={{ fontSize: 10, color: '#7a6a9a', letterSpacing: 1, marginTop: 2 }}>미발견</div>
      </div>
    );
  }

  const def   = UNIT_DEFS[entry.unit];
  const aDesc = abilityDesc(def?.ability, def?.abilityData);
  const aName = ABILITY_NAME[def?.ability];

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        ...S.card,
        borderColor: hovered ? color + 'bb' : color + '55',
        background: hovered ? color + '18' : color + '0d',
        cursor: 'default',
        transition: 'all 0.15s',
        boxShadow: hovered ? `0 0 18px ${color}33` : 'none',
      }}>
        <UnitCanvas unitId={entry.unit} size={64} />
        <div style={{ fontSize: 14, color, fontWeight: 800, marginTop: 10, letterSpacing: 0.5 }}>{meta.label || entry.unit}</div>
        <div style={{
          marginTop: 6, fontSize: 11, color,
          background: color + '18', border: `1px solid ${color}44`,
          borderRadius: 4, padding: '2px 10px', letterSpacing: 0.5,
        }}>{entry.word}</div>
      </div>

      {/* 호버 툴팁 */}
      {hovered && def && (
        <div style={{ ...S.tooltip, borderColor: color + '55' }}>
          {/* 기본 정보 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            <Tag color={color}>{FACTION_KO[def.faction] || def.faction}</Tag>
            <Tag color="#7060a0">{ROLE_KO[def.role] || def.role}</Tag>
            <Tag color={(def.range||0) >= 40 ? '#60a5fa' : '#f87171'}>
              {(def.range||0) >= 40 ? '원거리' : '근접'}
            </Tag>
            {def.traits?.includes('flying') && <Tag color="#67e8f9">🪶 공중</Tag>}
            {def.traits?.includes('armored') && <Tag color="#fbbf24">🛡 방어구</Tag>}
          </div>
          {/* 스탯 */}
          <div style={S.tipStats}>
            <TipStat label="HP"   value={def.maxHp}      color={color} />
            <TipStat label="공격" value={def.attack}     color={color} />
            <TipStat label="속도" value={def.speed}      color={color} />
            <TipStat label="방어" value={def.def}        color={color} />
            <TipStat label="사거리" value={def.range}    color={color} />
            <TipStat label="쿨타임" value={`${def.cooldown}s`} color={color} />
          </div>
          {/* 어빌리티 */}
          {aDesc && (
            <div style={S.tipAbility}>
              <span style={{ color, fontWeight: 800, fontSize: 10, marginRight: 6 }}>★ {aName}</span>
              <span style={{ color: '#b0a8c8', fontSize: 11 }}>{aDesc}</span>
            </div>
          )}
          {/* 강점 */}
          {COUNTER_INFO[entry.unit] && (
            <div style={{ marginTop: 6, fontSize: 10 }}>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>⚡ </span>
              <span style={{ color: '#a0d0b8' }}>{COUNTER_INFO[entry.unit]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{ fontSize: 9, color, background: color + '18', border: `1px solid ${color}33`, borderRadius: 3, padding: '2px 7px', fontWeight: 700, letterSpacing: 0.5 }}>
      {children}
    </span>
  );
}
function TipStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 9, color: '#5a5070', marginTop: 1 }}>{label}</div>
    </div>
  );
}


// ── 메인 ───────────────────────────────────────────────────────────────────
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
            <span style={{ fontSize: 14, color: '#8878b8', margin: '0 4px' }}>/</span>
            <span style={{ fontSize: 16, color: '#8878b8' }}>{total}</span>
          </div>
          <div style={{ fontSize: 10, color: '#8878b8', letterSpacing: 1, marginTop: 2 }}>발견 완료</div>
          <div style={S.progressBar}>
            <div style={{ ...S.progressFill, width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 10, color: '#fde047', marginTop: 4 }}>{pct}%</div>
        </div>
      </div>

      <div style={S.hint}>
        게임 중 어떤 단어든 타이핑해 보세요 — 히든 유닛이 소환될지도 모릅니다.
      </div>

      {/* 기본 유닛 */}
      <div style={S.sectionLabel}>⚔ 기본 유닛</div>
      <div style={S.grid}>
        {PUBLIC_UNITS.map(entry => (
          <UnitCard key={entry.unit} entry={entry} discovered={true} />
        ))}
      </div>

      {/* 히든 유닛 */}
      <div style={{ ...S.sectionLabel, marginTop: 32 }}>✦ 히든 유닛</div>
      <div style={S.grid}>
        {HIDDEN_UNITS.map(entry => (
          <UnitCard
            key={entry.unit}
            entry={entry}
            discovered={discovered.includes(entry.unit)}
          />
        ))}
      </div>

      {count === total && total > 0 && (
        <div style={S.completeMsg}>✦ 모든 히든 유닛을 발견했습니다! ✦</div>
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
    fontSize: 12, color: '#9090b0', letterSpacing: 0.5,
    marginBottom: 28, textAlign: 'center',
  },
  sectionLabel: {
    width: '100%', maxWidth: 940,
    fontSize: 10, fontWeight: 700, color: '#9080b8',
    letterSpacing: 3, marginBottom: 12,
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
    fontSize: 22, fontWeight: 900, color: '#7a6a9a',
  },

  // 툴팁
  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 10px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 240,
    background: 'linear-gradient(160deg, #1e1a38 0%, #151228 100%)',
    border: '1px solid',
    borderRadius: 10,
    padding: '12px 14px',
    zIndex: 200,
    boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
    pointerEvents: 'none',
  },
  tipStats: {
    display: 'flex', gap: 4,
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 6, padding: '8px 4px',
    marginBottom: 8,
  },
  tipAbility: {
    background: 'rgba(124,92,191,0.1)',
    border: '1px solid rgba(124,92,191,0.2)',
    borderRadius: 6, padding: '8px 10px',
    lineHeight: 1.6,
  },

  completeMsg: {
    marginTop: 40, fontSize: 14, fontWeight: 700, color: '#fde047',
    letterSpacing: 3, textShadow: '0 0 20px #fde047',
  },
};
