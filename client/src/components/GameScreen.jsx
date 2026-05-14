import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { WEAPON_WORDS } from '../data/words.js';
import { UNIT_DEFS } from '../data/units.js';
import { SHEETS } from '../game/SpriteCache.js';

const W = 1200, H = 500;

const UNIT_META = {
  swordsman: { label: '검사',   color: '#60a5fa' },
  archer:    { label: '궁수',   color: '#4ade80' },
  knight:    { label: '기사',   color: '#fbbf24' },
  wizard:    { label: '마법사',  color: '#c084fc' },
  catapult:  { label: '투석기', color: '#fb923c' },
};
const BUILD_ORDER = ['swordsman', 'archer', 'knight', 'wizard', 'catapult'];

// ── 유닛 스프라이트 렌더 ────────────────────────────────────────────────────
function UnitSprite({ unitId, side = 'player', size = 36 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    const def = UNIT_DEFS[unitId];
    if (!def) return;
    const color = side === 'player' ? (def.color || '#60a5fa') : (def.enemyColor || '#ef4444');
    const flip = side === 'enemy';

    const drawFallback = () => {
      ctx.fillStyle = color + '44';
      ctx.fillRect(2, 2, size - 4, size - 4);
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.floor(size * 0.38)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((UNIT_META[unitId]?.label || '?')[0], size / 2, size / 2);
    };

    const blit = (img, sx, sy, sw, sh) => {
      ctx.clearRect(0, 0, size, size);
      if (flip) {
        ctx.save(); ctx.translate(size, 0); ctx.scale(-1, 1);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        ctx.restore();
      } else {
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      }
    };

    if (def.sprite) {
      const src = (flip && def.enemySprite) ? def.enemySprite : def.sprite;
      const img = new Image();
      img.onload = () => blit(img, 0, 0, img.width, img.height);
      img.onerror = drawFallback;
      img.src = src;
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
  }, [unitId, side, size]);
  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }} />;
}

// ── HP 바 ───────────────────────────────────────────────────────────────────
function HpBar({ label, hp, maxHp, color, rtl, slim }) {
  const ratio = Math.max(0, hp / maxHp);
  const fill = ratio > 0.5 ? color : ratio > 0.25 ? '#facc15' : '#ef4444';
  return (
    <div style={{ textAlign: rtl ? 'right' : 'left' }}>
      {label && <div style={{ fontSize: 11, color: '#666', marginBottom: 2 }}>{label}</div>}
      <div style={{ width: slim ? 80 : 150, height: slim ? 5 : 9, background: '#111', borderRadius: 3, overflow: 'hidden', border: '1px solid #2a2a3a' }}>
        <div style={{ width: `${ratio * 100}%`, height: '100%', background: fill, transition: 'width 0.25s', float: rtl ? 'right' : 'left' }} />
      </div>
      {!slim && <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{Math.ceil(hp)}/{maxHp}</div>}
    </div>
  );
}

// ── 전략 설정 패널 ──────────────────────────────────────────────────────────
function StrategyPanel({ strategy, onChange, locked }) {
  const [hovered, setHovered] = useState(null);
  const btn = (key, val, label) => {
    const on = strategy[key] === val;
    const hoverKey = `${key}_${val}`;
    const isHovered = !locked && hovered === hoverKey;
    return (
      <button
        key={val}
        onClick={() => !locked && onChange({ ...strategy, [key]: val })}
        onMouseEnter={() => !locked && setHovered(hoverKey)}
        onMouseLeave={() => setHovered(null)}
        style={{
          fontSize: 11, padding: '4px 11px', borderRadius: 4,
          border: `1px solid ${on ? '#c8a040' : locked ? '#1a1208' : isHovered ? '#5a3a1a' : '#3a2510'}`,
          background: on
            ? 'linear-gradient(135deg,#3a2810 0%,#251a08 100%)'
            : isHovered ? 'rgba(90,58,26,0.25)' : 'transparent',
          color: on ? '#f0d090' : locked ? '#252525' : isHovered ? '#c8a060' : '#998877',
          cursor: locked ? 'default' : 'pointer',
          fontFamily: 'inherit', fontWeight: on ? 700 : 400,
          transition: 'all 0.1s',
        }}
      >{label}</button>
    );
  };
  return (
    <div style={S.stratPanel}>
      <div style={S.secTitle}>
        전략 설정
        {locked && <span style={{ fontSize: 9, color: '#2a2a2a', marginLeft: 6, letterSpacing: 0 }}>전투중 고정</span>}
        {!locked && <span style={{ fontSize: 9, color: '#5a3a1a', marginLeft: 6, letterSpacing: 0 }}>클릭해서 변경</span>}
      </div>
      {[
        { key: 'wallPos',    label: '성벽 위치', opts: [['back','후방'],['mid','중간'],['front','전방']] },
        { key: 'meleeMode',  label: '근거리',    opts: [['advance','전진'],['hold','성벽 대기']] },
        { key: 'rangedMode', label: '원거리',    opts: [['advance','전진'],['behind','성벽 뒤']] },
      ].map(({ key, label, opts }) => (
        <div key={key} style={S.stratRow}>
          <span style={S.stratLabel}>{label}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {opts.map(([val, lbl]) => btn(key, val, lbl))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 빌드 단계 좌측 패널 ────────────────────────────────────────────────────
function BuildSidePanel({ playerArmy }) {
  return (
    <div style={S.sidePanel}>
      <div style={S.secTitle}>소환 가능</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {BUILD_ORDER.map(uid => (
          <div key={uid} style={{ ...S.unitCard, borderColor: UNIT_META[uid].color + '40' }}>
            <UnitSprite unitId={uid} size={32} />
            <div style={{ fontSize: 9, color: UNIT_META[uid].color, marginTop: 2 }}>{UNIT_META[uid].label}</div>
          </div>
        ))}
        <div style={{ ...S.unitCard, borderColor: '#94a3b830' }}>
          <div style={{ width: 32, height: 32, background: '#1a1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>壁</span>
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>성벽</div>
        </div>
      </div>

      {playerArmy.length > 0 && (
        <>
          <div style={S.secTitle}>편성 ({playerArmy.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {playerArmy.map((item, i) => {
              if (item.type === 'unit') {
                const c = UNIT_META[item.unitId]?.color || '#aaa';
                return (
                  <div key={i} style={{ width: 26, height: 26, border: `1px solid ${c}40`, borderRadius: 3, overflow: 'hidden', background: c + '10' }}>
                    <UnitSprite unitId={item.unitId} size={26} />
                  </div>
                );
              }
              return (
                <div key={i} style={{ width: 26, height: 26, border: '1px solid #94a3b830', borderRadius: 3, background: '#1a1a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 9, color: '#94a3b8' }}>壁</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── 전투 단계 좌측 패널 ────────────────────────────────────────────────────
function BattleSidePanel({ playerUnits, playerBuildings }) {
  const total = playerUnits.length + playerBuildings.length;
  return (
    <div style={S.sidePanel}>
      <div style={S.secTitle}>내 부대 ({total})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, overflowY: 'auto', maxHeight: 128 }}>
        {playerUnits.map((u, i) => {
          const meta = UNIT_META[u.unitId];
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <UnitSprite unitId={u.unitId} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: meta?.color || '#aaa', marginBottom: 3 }}>{meta?.label || u.unitId}</div>
                <HpBar hp={u.hp} maxHp={u.maxHp} color={meta?.color || '#60a5fa'} slim />
              </div>
            </div>
          );
        })}
        {playerBuildings.map((b, i) => (
          <div key={`b${i}`} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 28, background: '#1a1a2a', border: '1px solid #94a3b830', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>壁</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>성벽</div>
              <HpBar hp={b.hp} maxHp={b.maxHp} color="#94a3b8" slim />
            </div>
          </div>
        ))}
        {total === 0 && <div style={{ fontSize: 11, color: '#333' }}>전멸</div>}
      </div>
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────────────────────────
export default function GameScreen({ onEnd }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const inputRef  = useRef(null);
  const composingRef = useRef(false);

  const [gs, setGs] = useState({
    phase: 'build', timer: 30,
    playerArmy: [], playerArmyCount: 0, enemyArmyCount: 0,
    playerHp: 500, playerMaxHp: 500, enemyHp: 500, enemyMaxHp: 500,
    playerUnits: [], playerBuildings: [],
  });
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [strategy, setStrategyState] = useState({ wallPos: 'mid', meleeMode: 'advance', rangedMode: 'advance' });

  const setStrategy = s => { setStrategyState(s); engineRef.current?.setStrategy(s); };

  const onStateChange = useCallback(state => {
    if (state.phase === 'over') { onEnd(state); return; }
    setGs(prev => ({ ...prev, ...state }));
  }, [onEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = W; canvas.height = H;
    const engine = new GameEngine(canvas, onStateChange);
    engineRef.current = engine;
    engine.start();
    inputRef.current?.focus();
    return () => engine.destroy();
  }, [onStateChange]);

  const submit = () => {
    const word = input.trim();
    if (!word || composingRef.current) return;
    const result = engineRef.current?.handleInput(word);
    let text, color;
    if (result) {
      if (result.type === 'block') {
        text = `막음  ${result.word}`;  color = '#38bdf8';
      } else if (result.type === 'attack') {
        text = `${result.word}  ${result.damage} 피해`;
        color = result.target === 'castle' ? '#fb923c' : '#f472b6';
      } else if (result.type === 'unit') {
        const meta = UNIT_META[result.unit];
        text = `${meta?.label || result.unit} 소환`;  color = meta?.color || '#4ade80';
      } else {
        text = '성벽 건설';  color = '#94a3b8';
      }
    } else {
      text = '없는 단어';  color = '#f87171';
    }
    setFeedback({ text, color });
    setTimeout(() => setFeedback(null), 700);
    setInput('');
  };

  const { phase, timer, playerArmy, playerArmyCount, enemyArmyCount,
          playerHp, playerMaxHp, enemyHp, enemyMaxHp,
          playerUnits, playerBuildings } = gs;

  return (
    <div style={S.wrap}>

      {/* HUD */}
      <div style={S.hud}>
        <div style={S.hudSide}>
          {phase === 'battle'
            ? <HpBar label="아군 성" hp={playerHp} maxHp={playerMaxHp} color="#60a5fa" />
            : <div style={{ color: '#60a5fa', fontSize: 13, fontWeight: 700 }}>아군 {playerArmyCount}부대</div>}
        </div>
        <div style={S.hudCenter}>
          <div style={S.phaseTag}>{phase === 'build' ? 'BUILD  —  건설' : 'BATTLE  —  전투'}</div>
          <div style={S.timerText}>
            {timer}
            <span style={{ fontSize: 13, color: '#443322', marginLeft: 3, fontWeight: 400 }}>s</span>
          </div>
        </div>
        <div style={{ ...S.hudSide, alignItems: 'flex-end' }}>
          {phase === 'battle'
            ? <HpBar label="적군 성" hp={enemyHp} maxHp={enemyMaxHp} color="#f87171" rtl />
            : <div style={{ color: '#f87171', fontSize: 13, fontWeight: 700 }}>적군 {enemyArmyCount}부대</div>}
        </div>
      </div>

      {/* 캔버스 */}
      <canvas ref={canvasRef} style={S.canvas} />

      {/* 하단 패널 */}
      <div style={S.bottom}>

        {/* 좌측: 편성 / 부대 현황 */}
        {phase === 'build'
          ? <BuildSidePanel playerArmy={playerArmy} />
          : <BattleSidePanel playerUnits={playerUnits} playerBuildings={playerBuildings} />}

        {/* 중앙: 입력 */}
        <div style={S.centerCol}>
          {phase === 'battle' && (
            <div style={S.weaponSection}>
              <div style={S.weaponRow}>
                <span style={{ fontSize: 10, color: '#60a5fa99', marginRight: 6, flexShrink: 0 }}>대유닛</span>
                {WEAPON_WORDS.filter(w => w.target === 'unit').map(w => (
                  <span key={w.word} style={{ ...S.chip, color: '#60a5fa', borderColor: '#60a5fa33' }}>
                    {w.word}<span style={{ fontSize: 9, color: '#60a5fa55', marginLeft: 3 }}>{w.damage}</span>
                  </span>
                ))}
              </div>
              <div style={S.weaponRow}>
                <span style={{ fontSize: 10, color: '#d9770699', marginRight: 6, flexShrink: 0 }}>공성</span>
                {WEAPON_WORDS.filter(w => w.target === 'building').map(w => (
                  <span key={w.word} style={{ ...S.chip, color: '#d97706', borderColor: '#d9770633' }}>
                    {w.word}<span style={{ fontSize: 9, color: '#d9770655', marginLeft: 3 }}>{w.damage}</span>
                  </span>
                ))}
              </div>
              <div style={S.weaponRow}>
                <span style={{ fontSize: 10, color: '#fb923c99', marginRight: 6, flexShrink: 0 }}>대성</span>
                {WEAPON_WORDS.filter(w => w.target === 'castle').map(w => (
                  <span key={w.word} style={{ ...S.chip, color: '#fb923c', borderColor: '#fb923c33' }}>
                    {w.word}<span style={{ fontSize: 9, color: '#fb923c55', marginLeft: 3 }}>{w.damage}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {phase === 'build' && (
            <div style={S.hintRow}>
              {BUILD_ORDER.map(uid => (
                <span key={uid} style={{ color: UNIT_META[uid].color, fontSize: 12 }}>{UNIT_META[uid].label}</span>
              ))}
              <span style={{ color: '#94a3b8', fontSize: 12 }}>성벽</span>
            </div>
          )}
          <div style={{ height: 20, display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            {feedback && <span style={{ color: feedback.color, fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }}>{feedback.text}</span>}
          </div>
          <div style={S.inputBox}>
            <span style={{ color: '#4a2a6a', fontSize: 14, fontFamily: 'monospace', flexShrink: 0 }}>▶</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              style={S.input}
              placeholder={phase === 'build' ? '유닛·건물 이름 입력 후 Enter' : '단어 차단 / 공격 마법 입력'}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {/* 우측: 전략 설정 */}
        <StrategyPanel strategy={strategy} onChange={setStrategy} locked={phase === 'battle'} />
      </div>
    </div>
  );
}

const S = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    background: '#09080f', width: W,
    minHeight: '100vh',
  },

  // HUD
  hud: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '8px 24px', minHeight: 60,
    background: 'linear-gradient(180deg,#1a1208 0%,#110d06 100%)',
    borderBottom: '2px solid #2a1a08',
  },
  hudSide: { width: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  hudCenter: { textAlign: 'center', flex: 1 },
  phaseTag: {
    fontSize: 9, color: '#6a4a1a', fontWeight: 700,
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 3,
  },
  timerText: {
    fontSize: 34, fontWeight: 900, lineHeight: 1,
    color: '#e8e8f0', fontVariantNumeric: 'tabular-nums',
  },

  canvas: { display: 'block', imageRendering: 'pixelated' },

  // 하단 패널
  bottom: {
    display: 'flex', flex: 1, minHeight: 170,
    background: 'linear-gradient(180deg,#0d0a18 0%,#090812 100%)',
    borderTop: '2px solid #1e1428',
  },

  sidePanel: {
    width: 255, minWidth: 255, flexShrink: 0,
    padding: '12px 14px', borderRight: '1px solid #140e1e',
    overflowY: 'auto',
  },

  centerCol: {
    flex: 1, padding: '12px 20px',
    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
  },

  stratPanel: {
    width: 265, minWidth: 265, flexShrink: 0,
    padding: '12px 16px', borderLeft: '1px solid #140e1e',
  },

  secTitle: {
    fontSize: 9, color: '#3a2a1a', fontWeight: 700,
    letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 8,
  },

  unitCard: {
    width: 44, padding: '5px 4px 3px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid', borderRadius: 5,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },

  weaponSection: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 8 },
  weaponRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  chip: {
    fontSize: 12, padding: '2px 9px', borderRadius: 4,
    border: '1px solid', background: 'rgba(255,255,255,0.03)',
  },

  hintRow: { display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap' },

  inputBox: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid #1e1430',
    borderRadius: 8, padding: '8px 14px',
  },
  input: {
    flex: 1, background: 'transparent', border: 'none',
    color: '#ddd8f0', fontSize: 17, padding: 0, outline: 'none',
    fontFamily: 'Noto Sans KR, Malgun Gothic, sans-serif',
  },

  stratRow: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 9,
  },
  stratLabel: { fontSize: 11, color: '#4a3322', minWidth: 52, fontWeight: 500 },
};
