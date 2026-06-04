import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { WEAPON_WORDS, BUILD_WORDS, EASTER_WORDS } from '../data/words.js';
import { UNIT_DEFS, BUILDING_DEFS } from '../data/units.js';
import { SHEETS } from '../game/SpriteCache.js';
import { UNIT_META } from '../data/unitMeta.js';

const W = 1200, H = 500;
const BUILD_ORDER = ['swordsman', 'archer', 'knight'];

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

// ── 건물 스프라이트 ─────────────────────────────────────────────────────────
function BuildingSprite({ buildingId, size = 32 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    const def = BUILDING_DEFS[buildingId];
    if (!def?.tileGrid?.length) return;

    // 상단 타일(가장 시각적으로 구분되는 타일)을 카드에 표시
    const tile = def.tileGrid[0];
    const sd = SHEETS[tile.sheet];
    if (!sd) return;
    const img = new Image();
    img.onload = () => {
      const step = sd.tileW + (sd.spacing || 0);
      ctx.drawImage(img, tile.col * step, tile.row * step, sd.tileW, sd.tileH, 0, 0, size, size);
    };
    img.src = sd.src;
  }, [buildingId, size]);
  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }} />;
}

// ── 공성 마법 쿨다운 카드 ────────────────────────────────────────────────────
function SpellChip({ w, color, spellCooldowns }) {
  const cd = spellCooldowns[w.word] || 0;
  const onCd = cd > 0 && w.cooldown != null;
  const progress = w.cooldown ? cd / w.cooldown : 0;
  return (
    <span style={{
      ...S.chip,
      color: onCd ? '#3a3a4a' : color,
      borderColor: onCd ? '#2a2a3a55' : color + '33',
      position: 'relative', overflow: 'hidden',
      minWidth: 48, textAlign: 'center',
    }}>
      <span style={{ opacity: onCd ? 0.2 : 1, display: 'flex', alignItems: 'center', gap: 3 }}>
        {w.word}
        <span style={{ fontSize: 9, color: color + '55' }}>{w.damage}</span>
      </span>
      {onCd && (
        <>
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#7a7a8a', fontWeight: 700,
          }}>
            {Math.ceil(cd)}s
          </span>
          <span style={{
            position: 'absolute', bottom: 0, left: 0,
            height: 2, background: color + '88',
            width: `${(1 - progress) * 100}%`,
            transition: 'width 0.1s linear',
          }} />
        </>
      )}
    </span>
  );
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
          flex: 1,
          padding: '9px 4px',
          borderRadius: 5,
          border: `1px solid ${on ? '#c8a040' : locked ? '#1e1610' : isHovered ? '#5a3a1a' : '#2e1e0c'}`,
          background: on
            ? 'linear-gradient(135deg, #4a3010 0%, #2e1c08 100%)'
            : isHovered ? 'rgba(90,58,26,0.2)' : 'rgba(0,0,0,0.25)',
          color: on ? '#f0d090' : locked ? '#2e2a22' : isHovered ? '#c8a060' : '#6a5840',
          cursor: locked ? 'default' : 'pointer',
          fontFamily: 'inherit',
          fontWeight: on ? 800 : 400,
          fontSize: 11,
          letterSpacing: on ? 0.3 : 0,
          transition: 'all 0.12s',
          boxShadow: on ? 'inset 0 1px 0 rgba(255,220,100,0.15)' : 'none',
        }}
      >{label}</button>
    );
  };
  return (
    <div style={S.stratPanel}>
      <div style={{ ...S.secTitle, marginBottom: 10 }}>
        전략 설정
        {locked
          ? <span style={{ fontSize: 9, color: '#2e2820', marginLeft: 6 }}>전투 중 고정</span>
          : <span style={{ fontSize: 9, color: '#7a5a30', marginLeft: 6 }}>클릭해서 변경</span>}
      </div>
      {[
        { key: 'wallPos',    label: '⛩ 성벽 위치', opts: [['back','후방'],['mid','중간'],['front','전방']] },
        { key: 'meleeMode',  label: '⚔ 근거리',    opts: [['advance','전진'],['hold','성벽 대기']] },
        { key: 'rangedMode', label: '🏹 원거리',    opts: [['advance','전진'],['behind','성벽 뒤']] },
      ].map(({ key, label, opts }) => (
        <div key={key} style={S.stratRow}>
          <div style={S.stratLabel}>{label}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {opts.map(([val, lbl]) => btn(key, val, lbl))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 빌드 단계 좌측 패널 ────────────────────────────────────────────────────
function BuildSidePanel({ playerArmy }) {
  const discovered = JSON.parse(localStorage.getItem('tcb_discovered') || '[]');
  const hiddenUnlocked = BUILD_WORDS.filter(w => w.hidden && discovered.includes(w.unit));

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
          <BuildingSprite buildingId="wall" size={32} />
          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>성벽</div>
        </div>
      </div>

      {hiddenUnlocked.length > 0 && (
        <>
          <div style={{ ...S.secTitle, color: '#fde04788' }}>✦ 발견한 유닛</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {hiddenUnlocked.map(w => {
              const meta = UNIT_META[w.unit];
              return (
                <div key={w.unit} style={{ ...S.unitCard, borderColor: (meta?.color || '#aaa') + '55', background: (meta?.color || '#aaa') + '0d' }}>
                  <UnitSprite unitId={w.unit} size={32} />
                  <div style={{ fontSize: 9, color: meta?.color, marginTop: 2 }}>{meta?.label}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
                <div key={i} style={{ width: 26, height: 26, border: '1px solid #94a3b830', borderRadius: 3, overflow: 'hidden', background: '#1a1a2a' }}>
                  <BuildingSprite buildingId={item.buildingId} size={26} />
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
      {total === 0 && <div style={{ fontSize: 11, color: '#333' }}>전멸</div>}
    </div>
  );
}

// ── 유닛 HP 카드 로스터 (빌드/전투 공통) ──────────────────────────────────
function UnitRoster({ army, playerUnits, playerBuildings, isBattle }) {
  const items = isBattle
    ? [
        ...playerUnits.map(u => {
          const def = UNIT_DEFS[u.unitId];
          return { key: `u${u.unitId}`, unitId: u.unitId, hp: u.hp, maxHp: u.maxHp || def?.maxHp || 1 };
        }),
        ...playerBuildings.map((b, i) => ({
          key: `b${i}`, buildingId: b.buildingId, hp: b.hp, maxHp: b.maxHp || 400,
        })),
      ]
    : army.map((item, i) => {
        if (item.type === 'unit') {
          const def = UNIT_DEFS[item.unitId];
          return { key: `u${i}`, unitId: item.unitId, hp: def?.maxHp || 1, maxHp: def?.maxHp || 1 };
        }
        const bdef = BUILDING_DEFS[item.buildingId];
        return { key: `b${i}`, buildingId: item.buildingId, hp: bdef?.maxHp || 400, maxHp: bdef?.maxHp || 400 };
      });

  if (!items.length) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignContent: 'flex-start' }}>
      {items.map(item => {
        const isBuilding = !!item.buildingId;
        const color = isBuilding ? '#94a3b8' : (UNIT_META[item.unitId]?.color || '#60a5fa');
        const label = isBuilding ? '성벽' : (UNIT_META[item.unitId]?.label || item.unitId);
        const ratio = Math.max(0, item.hp / item.maxHp);
        const fill  = !isBattle ? color + '55'
          : ratio > 0.5 ? color : ratio > 0.25 ? '#facc15' : '#ef4444';
        return (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: color + '0d', border: `1px solid ${color}22`,
            borderRadius: 4, padding: '3px 6px 3px 3px',
            minWidth: 78, maxWidth: 110,
          }}>
            {isBuilding
              ? <BuildingSprite buildingId={item.buildingId} size={24} />
              : <UnitSprite unitId={item.unitId} size={24} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {label}
              </div>
              <div style={{ height: 3, background: '#1a1a2a', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  width: `${ratio * 100}%`, height: '100%',
                  background: fill,
                  transition: isBattle ? 'width 0.25s' : 'none',
                  borderRadius: 2,
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 단어 목록 패널 (테스트용) ───────────────────────────────────────────────
function WordListPanel({ onClose }) {
  const unitWords    = BUILD_WORDS.filter(w => w.type === 'unit' && !w.hidden);
  const buildingWords = BUILD_WORDS.filter(w => w.type === 'building' && !w.hidden);
  const section = (title, color, items) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 1.5, marginBottom: 4 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {items.map((w, i) => (
          <span key={i} style={{
            fontSize: 12, padding: '2px 8px', borderRadius: 4,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${color}44`,
            color: '#ddd',
          }}>
            {w.word}
            {w.unit && <span style={{ fontSize: 9, color: '#666', marginLeft: 3 }}>({UNIT_META[w.unit]?.label || w.unit})</span>}
            {w.damage && <span style={{ fontSize: 9, color: '#666', marginLeft: 3 }}>{w.damage}</span>}
          </span>
        ))}
      </div>
    </div>
  );
  return (
    <div style={{
      position: 'fixed', top: 60, right: 10, zIndex: 999,
      background: '#0d0a18', border: '1px solid #2a1f4a',
      borderRadius: 8, padding: '12px 16px', width: 340,
      maxHeight: '80vh', overflowY: 'auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: 2 }}>단어 목록 (테스트)</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>
      {section('── 유닛 소환', '#60a5fa', unitWords)}
      {section('── 건물', '#94a3b8', buildingWords)}
      {section('── 대유닛 공격', '#60a5fa', WEAPON_WORDS.filter(w => w.target === 'unit'))}
      {section('── 공성', '#fb923c', WEAPON_WORDS.filter(w => w.target === 'siege'))}
      {section('── 이스터에그', '#a78bfa', EASTER_WORDS)}
    </div>
  );
}

// ── 메인 ───────────────────────────────────────────────────────────────────
export default function GameScreen({ onEnd, multiInfo }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const inputRef  = useRef(null);
  const composingRef = useRef(false);

  const [gs, setGs] = useState({
    phase: 'build', timer: 30,
    playerArmy: [], playerArmyCount: 0, enemyArmyCount: 0,
    playerHp: 500, playerMaxHp: 500, enemyHp: 500, enemyMaxHp: 500,
    playerUnits: [], playerBuildings: [],
    spellCooldowns: {},
  });
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [strategy, setStrategyState] = useState({ wallPos: 'mid', meleeMode: 'advance', rangedMode: 'advance' });
  const [showWordList, setShowWordList] = useState(false);
  const [killFeed, setKillFeed] = useState([]);
  const killIdRef = useRef(0);
  const [discovery, setDiscovery] = useState(null); // { unitId, isNew }
  const sessionDiscoveriesRef = useRef([]); // 이번 판 새로 발견한 히든 유닛

  const setStrategy = s => { setStrategyState(s); engineRef.current?.setStrategy(s); };

  const onStateChange = useCallback(state => {
    if (state.phase === 'over') {
      onEnd({
        ...state,
        sessionDiscoveries: sessionDiscoveriesRef.current.map(uid => ({
          unitId: uid,
          label: UNIT_META[uid]?.label || uid,
          color: UNIT_META[uid]?.color || '#aaa',
        })),
      });
      return;
    }
    if (state.newKills?.length) {
      const now = Date.now();
      setKillFeed(prev => [
        ...prev,
        ...state.newKills.map(k => ({ id: killIdRef.current++, ...k, ts: now })),
      ].slice(-8));
    }
    setGs(prev => ({ ...prev, ...state }));
  }, [onEnd]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = W; canvas.height = H;
    const engine = new GameEngine(canvas, onStateChange);
    engineRef.current = engine;
    engine.start();
    inputRef.current?.focus();

    // 멀티플레이 소켓 연결
    if (multiInfo) {
      const { socket, side } = multiInfo;
      engine.setMultiplayer(side);

      // 상대방 빌드 단어 수신
      socket.on('opponent_build', ({ word }) => {
        engine.handleEnemyBuild(word);
      });

      // 상대방 전투 단어 수신
      socket.on('opponent_battle', ({ word }) => {
        engine.handleEnemyBattle(word);
      });

      socket.on('opponent_disconnected', () => {
        alert('상대방이 연결을 끊었습니다.');
        onEnd({ winner: 'player', reason: 'disconnect' });
      });
    }

    return () => {
      engine.destroy();
      if (multiInfo) {
        const { socket } = multiInfo;
        socket.off('opponent_build');
        socket.off('opponent_battle');
        socket.off('opponent_disconnected');
      }
    };
  }, [onStateChange, multiInfo, onEnd]);

  useEffect(() => {
    if (killFeed.length === 0) return;
    const id = setTimeout(() => {
      const now = Date.now();
      setKillFeed(prev => prev.filter(k => now - k.ts < 3000));
    }, 500);
    return () => clearTimeout(id);
  }, [killFeed]);

  useEffect(() => {
    if (!discovery) return;
    const id = setTimeout(() => setDiscovery(null), 2200);
    return () => clearTimeout(id);
  }, [discovery]);

  const submit = () => {
    const word = input.trim();
    if (!word || composingRef.current) return;
    const result = engineRef.current?.handleInput(word);

    // 멀티플레이: 성공한 입력을 서버로 전송 (쿨타임 중인 경우 제외)
    if (result && result.type !== 'cooldown' && multiInfo) {
      const { socket } = multiInfo;
      const phase = engineRef.current?.phase;
      if (phase === 'build')  socket.sendBuildWord(word);
      if (phase === 'battle') socket.sendBattleWord(word);
    }
    let text, color;
    if (result) {
      if (result.type === 'attack') {
        text = `${result.word}  ${result.damage} 피해`;
        color = result.target === 'siege' ? '#fb923c' : '#60a5fa';
      } else if (result.type === 'unit') {
        const meta = UNIT_META[result.unit];
        if (result.hidden) {
          const discovered = JSON.parse(localStorage.getItem('tcb_discovered') || '[]');
          const isNew = !discovered.includes(result.unit);
          if (isNew) {
            localStorage.setItem('tcb_discovered', JSON.stringify([...discovered, result.unit]));
            sessionDiscoveriesRef.current = [...new Set([...sessionDiscoveriesRef.current, result.unit])];
            setDiscovery({ unitId: result.unit, isNew: true }); // 첫 발견만 이펙트 표시
          }
          text = isNew ? `✦ ${meta?.label || result.unit} 발견!` : `${meta?.label || result.unit} 소환`;
          color = '#fde047';
        } else {
          text = `${meta?.label || result.unit} 소환`;  color = meta?.color || '#4ade80';
        }
      } else if (result.type === 'cooldown') {
        text = `재충전 중 ${Math.ceil(result.remaining)}s`;  color = '#6b7280';
      } else if (result.type === 'easter') {
        text = '???';  color = '#f472b6';
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
          playerUnits, playerBuildings, spellCooldowns = {} } = gs;

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
            : <div style={{ color: '#443322', fontSize: 13, fontWeight: 700 }}>적군 ???</div>}
        </div>
      </div>

      {/* 단어 목록 토글 버튼 */}
      <button
        onClick={() => setShowWordList(v => !v)}
        style={{
          position: 'fixed', top: 12, right: 14, zIndex: 1000,
          fontSize: 11, padding: '4px 10px', borderRadius: 4,
          background: showWordList ? '#7c3aed' : 'transparent',
          border: '1px solid #7c3aed44', color: showWordList ? '#fff' : '#7c3aed',
          cursor: 'pointer',
        }}
      >단어목록</button>
      {showWordList && <WordListPanel onClose={() => setShowWordList(false)} />}

      {/* 캔버스 + 킬 피드 오버레이 */}
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={S.canvas} />
        {/* 히든 유닛 발견 연출 (첫 발견만) */}
        {discovery && (() => {
          const meta = UNIT_META[discovery.unitId];
          return (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.6)',
            }}>
              <div style={{ fontSize: 10, color: '#fde047', letterSpacing: 5, fontWeight: 700, marginBottom: 10, textShadow: '0 0 12px #fde047' }}>
                ✦  히든  유닛  발견  ✦
              </div>
              <div style={{ filter: 'drop-shadow(0 0 16px #fde047)' }}>
                <UnitSprite unitId={discovery.unitId} size={72} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: meta?.color || '#fde047', marginTop: 10, textShadow: `0 0 10px ${meta?.color || '#fde047'}` }}>
                {meta?.label || discovery.unitId}
              </div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 8, letterSpacing: 1 }}>도감에 등록되었습니다</div>
            </div>
          );
        })()}

        {killFeed.length > 0 && (
          <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column-reverse', gap: 4, pointerEvents: 'none' }}>
            {killFeed.map(k => {
              const age = (Date.now() - k.ts) / 3000;
              const meta = UNIT_META[k.unitId];
              const sideColor = k.side === 'player' ? '#f87171' : '#60a5fa';
              const isHidden = k.side === 'enemy' && BUILD_WORDS.find(w => w.unit === k.unitId)?.hidden;
              const discovered = !isHidden || JSON.parse(localStorage.getItem('tcb_discovered') || '[]').includes(k.unitId);
              return (
                <div key={k.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(0,0,0,0.72)', borderRadius: 4,
                  padding: '3px 8px', opacity: Math.max(0, 1 - age),
                  border: `1px solid ${sideColor}44`,
                }}>
                  <span style={{ fontSize: 11, color: sideColor }}>{k.side === 'player' ? '☠' : '✦'}</span>
                  {discovered
                    ? <UnitSprite unitId={k.unitId} size={18} side={k.side} />
                    : <div style={{ width: 18, height: 18, background: '#111', border: '1px solid #333', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#555' }}>?</div>
                  }
                  <span style={{ fontSize: 11, color: discovered ? (meta?.color || '#ccc') : '#444' }}>
                    {discovered ? (meta?.label || k.unitId) : '???'}
                  </span>
                  <span style={{ fontSize: 9, color: '#555' }}>처치</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 패널 */}
      <div style={S.bottom}>

        {/* 좌측: 편성 / 부대 현황 */}
        {phase === 'build'
          ? <BuildSidePanel playerArmy={playerArmy} />
          : <BattleSidePanel playerUnits={playerUnits} playerBuildings={playerBuildings} />}

        {/* 중앙: 입력 */}
        <div style={S.centerCol}>

          {/* 유닛 로스터 — 빌드/전투 공통, 상단 채움 */}
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 6 }}>
            <UnitRoster
              army={playerArmy}
              playerUnits={playerUnits}
              playerBuildings={playerBuildings}
              isBattle={phase === 'battle'}
            />
          </div>

          {/* 마법 칩 / 힌트 */}
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
                <span style={{ fontSize: 10, color: '#fb923c99', marginRight: 6, flexShrink: 0 }}>공성</span>
                {WEAPON_WORDS.filter(w => w.target === 'siege').map(w => (
                  <SpellChip key={w.word} w={w} color="#fb923c" spellCooldowns={spellCooldowns} />
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

          {/* 피드백 + 입력 */}
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
              placeholder={phase === 'build' ? '유닛·건물 이름 입력 후 Enter' : '공격 마법 입력 후 Enter'}
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
    display: 'flex', flex: 1, minHeight: 200,
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
    display: 'flex', flexDirection: 'column',
  },

  stratPanel: {
    width: 280, minWidth: 280, flexShrink: 0,
    padding: '14px 16px', borderLeft: '1px solid #140e1e',
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
    display: 'flex', flexDirection: 'column',
    gap: 5, marginBottom: 10,
  },
  stratLabel: { fontSize: 10, color: '#7a6040', fontWeight: 700, letterSpacing: 0.5 },
};
