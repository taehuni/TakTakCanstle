import { useEffect, useRef } from 'react';
import { Renderer } from '../game/Renderer.js';
import { SpriteCache } from '../game/SpriteCache.js';

function HeroCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width  = 1200;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    const sc  = new SpriteCache();
    sc.preloadSheets().then(() => {
      const renderer = new Renderer(canvas, ctx, sc);
      const scene = {
        playerArmy: [
          { type: 'unit',     unitId:     'knight'    },
          { type: 'unit',     unitId:     'swordsman' },
          { type: 'unit',     unitId:     'archer'    },
          { type: 'unit',     unitId:     'wizard'    },
          { type: 'unit',     unitId:     'catapult'  },
          { type: 'building', buildingId: 'wall'      },
          { type: 'building', buildingId: 'wall'      },
        ],
        enemyArmy: [
          { type: 'unit',     unitId:     'swordsman' },
          { type: 'unit',     unitId:     'archer'    },
          { type: 'unit',     unitId:     'wizard'    },
          { type: 'unit',     unitId:     'catapult'  },
          { type: 'building', buildingId: 'wall'      },
          { type: 'building', buildingId: 'wall'      },
        ],
      };
      renderer.renderBuild(scene, { wallPos: 'mid' });
    });
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ display: 'block', imageRendering: 'pixelated', width: '100%', height: '100%' }}
    />
  );
}

export default function MainMenu({ onStart, onMulti, onRanked, onCustom, onDogam, onRank, onHowTo, user, onLogin, onLogout }) {
  return (
    <div style={S.page}>

      {/* ── 네비게이션 ── */}
      <nav style={S.nav}>
        <div style={S.navLogo}>
          <span style={S.navLogoMark}>⌨</span>
          <span style={S.navLogoName}>탁탁성</span>
          <span style={S.navLogoSub}>TAKTAK CASTLE</span>
        </div>
        <div style={S.navCenter}>
          <span style={S.navLinkActive} onClick={onDogam}>유닛 도감</span>
          <span style={S.navLinkActive} onClick={onRank}>랭킹</span>
        </div>
        <div style={S.navRight}>
          <span style={S.navCompBadge}>🏆 데이콘 웹 미니게임 챌린지 출품작</span>
          {user
            ? <>
                <span style={S.navUser}>👤 {user.displayName}</span>
                <button style={S.navLogoutBtn} onClick={onLogout}>로그아웃</button>
              </>
            : <button style={S.navLoginBtn} onClick={onLogin}>로그인</button>
          }
          <button style={S.navPlayBtn} onClick={onStart}>바로 플레이</button>
        </div>
      </nav>

      {/* ── 히어로 섹션 ── */}
      <div style={S.hero}>
        <div style={S.heroBg} />
        <div style={S.heroGlow1} />
        <div style={S.heroGlow2} />
        <div style={S.heroCanvas}><HeroCanvas /></div>
        <div style={S.heroFade} />
        <div style={S.heroContent}>
          <div style={S.heroPill}>⚔ 타자 기반 실시간 전략 게임</div>
          <h1 style={S.heroTitle}>탁탁성</h1>
          <p style={S.heroDesc}>
            단어를 빠르게 입력해 군대를 소환하고<br />
            마법으로 적의 성을 <span style={S.heroHighlight}>박살내라</span>
          </p>
          <div style={S.heroBtns}>
            <button style={S.heroPlayBtn} onClick={onStart}>▶ 싱글 플레이</button>
            <button style={S.heroPlayBtn} onClick={onMulti}>🌐 일반 대전</button>
            <button style={{ ...S.heroPlayBtn, background: 'linear-gradient(135deg,#b45309,#92400e)', boxShadow: '0 4px 32px rgba(180,83,9,0.5)' }} onClick={onRanked}>⚔ 랭크 게임</button>
            <button style={S.heroCustomBtn} onClick={onCustom}>🎮 커스텀</button>
            <button style={S.heroHowBtn} onClick={onHowTo}>게임 방법 보기</button>
          </div>
          <div style={S.heroMeta}>
            <span style={S.heroMetaItem}>⌨ 한국어 타자</span>
            <span style={S.heroMetaDot}>·</span>
            <span style={S.heroMetaItem}>⚒ 5종 유닛</span>
            <span style={S.heroMetaDot}>·</span>
            <span style={S.heroMetaItem}>🏰 공성 전술</span>
            <span style={S.heroMetaDot}>·</span>
            <span style={S.heroMetaItem}>🎮 무료 플레이</span>
          </div>
        </div>
      </div>

      {/* ── 핵심 특징 4칸 ── */}
      <div style={S.features}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ ...S.featCard, borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
            <div style={{ ...S.featIcon, background: f.color + '22', border: `1.5px solid ${f.color}55` }}>
              {f.icon}
            </div>
            <div style={{ ...S.featTitle, color: f.color }}>{f.title}</div>
            <div style={S.featDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* ── 유닛 쇼케이스 ── */}
      <div style={S.showcase}>
        <div style={S.showcaseInner}>
          <div style={{ ...S.sectionHeader, paddingBottom: 16 }}>
            <div style={S.sectionEyebrow}>SUMMON</div>
            <h2 style={S.sectionTitle}>일단 쳐 봐라</h2>
            <p style={{ ...S.sectionDesc, marginTop: 12, fontSize: 16 }}>
              강력한 게 소환될지도 모른다
            </p>
            <p style={{ ...S.sectionDesc, marginTop: 8, color: '#a8c8e0' }}>
              어떤 단어든 — 그게 소환 주문이 될 수 있다
            </p>
          </div>
        </div>
      </div>

      {/* ── 마법 발견 + 조작법 2열 ── */}
      <div style={S.infoRow}>
        <div style={S.infoBox}>
          <div style={S.sectionEyebrow}>SPELLS</div>
          <h2 style={{ ...S.sectionTitle, fontSize: 22, marginBottom: 36 }}>혹시 그 단어가...</h2>
          <div style={S.discoveryCards}>
            {DISCOVERY.map((d, i) => (
              <div key={i} style={{ ...S.discoveryCard, borderColor: d.color + '45', background: d.color + '0c' }}>
                <span style={{ ...S.discoveryIcon, color: d.color }}>{d.icon}</span>
                <div>
                  <div style={{ ...S.discoveryHint, color: d.color }}>{d.hint}</div>
                  <div style={S.discoveryMystery}>{d.mystery}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={S.discoveryFooter}>
            창의성을 실험해 보라 —<br />
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>어떤 단어가 성벽을 무너뜨릴지는 직접 타이핑해서 발견하라</span>
          </p>
        </div>

        <div style={S.infoBox}>
          <div style={S.sectionEyebrow}>HOW TO PLAY</div>
          <h2 style={{ ...S.sectionTitle, fontSize: 22, marginBottom: 36 }}>조작법</h2>
          <div style={S.controlList}>
            {CONTROLS.map((c, i) => (
              <div key={i} style={S.controlItem}>
                <div style={{ ...S.controlKey, color: c.color, borderColor: c.color + '60', background: c.color + '15' }}>
                  {c.key}
                </div>
                <div style={S.controlText}>
                  <div style={S.controlTitle}>{c.title}</div>
                  <div style={S.controlDesc}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 하단 CTA ── */}
      <div style={S.ctaSection}>
        <div style={S.ctaBg} />
        <div style={S.ctaGlow} />
        <div style={S.ctaContent}>
          <h2 style={S.ctaTitle}>키보드를 들어라</h2>
          <p style={S.ctaDesc}>탁탁 — 성이 무너진다</p>
          <button style={S.ctaBtn} onClick={onStart}>무료로 플레이하기</button>
        </div>
      </div>

      {/* ── 푸터 ── */}
      <footer style={S.footer}>
        <div style={S.footerLogo}>⌨ 탁탁성</div>
        <div style={S.footerText}>© 2025 탁탁성 · 데이콘 월간 해커톤 웹 미니게임 챌린지 출품작</div>
      </footer>
    </div>
  );
}

/* ── 데이터 ─────────────────────────────────────────────────────────── */

const FEATURES = [
  { icon: '⌨', color: '#38bdf8', title: '한국어 타자', desc: '유닛 이름을 빠르게 입력해 실시간으로 군대를 건설하세요.' },
  { icon: '🏰', color: '#fbbf24', title: '성벽 전략',  desc: '성벽 위치와 유닛 포지션을 전술적으로 설정하세요.' },
  { icon: '⚔',  color: '#f87171', title: '실시간 전투', desc: '마법 단어로 공격하고 날아오는 단어를 막아 성을 지키세요.' },
  { icon: '💥', color: '#fb923c', title: '공성 마법',  desc: '알 수 없는 주문으로 적의 성벽과 본성을 무너뜨리세요.' },
];

const UNITS = [
  { id: 'swordsman', label: '검사',   word: '검사',   icon: '⚔', color: '#60a5fa', stat: '근거리 전투원' },
  { id: 'archer',    label: '궁수',   word: '궁수',   icon: '🏹', color: '#4ade80', stat: '원거리 사수' },
  { id: 'knight',    label: '기사',   word: '기사',   icon: '🛡', color: '#fbbf24', stat: '중장갑 돌격' },
  { id: 'wizard',    label: '마법사', word: '마법사', icon: '🔮', color: '#c084fc', stat: '원거리 마법' },
  { id: 'wall',      label: '성벽',   word: '성벽',   icon: '🏯', color: '#94a3b8', stat: 'HP 400 방어벽' },
];


const DISCOVERY = [
  { icon: '🔥', color: '#fb923c', hint: '불과 관련된 단어라면',     mystery: '적 유닛이 타오를지도 모른다...' },
  { icon: '⚡', color: '#fde047', hint: '자연의 힘을 담은 단어라면', mystery: '적의 성이 한 방에 무너질지도...' },
  { icon: '💣', color: '#f87171', hint: '파괴와 공성을 뜻하는 단어라면', mystery: '성벽도 버티지 못할 것이다...' },
];

const CONTROLS = [
  { key: 'Enter',    color: '#4ade80', title: '소환 / 발동', desc: '단어 입력 후 Enter로 즉시 효과 발동' },
  { key: '건설단계', color: '#fbbf24', title: '군대 편성',   desc: '30초 안에 원하는 유닛·성벽을 조합' },
  { key: '전략패널', color: '#c084fc', title: '포지션 설정', desc: '성벽 위치, 근/원거리 진형 자유 조정' },
];

/* ── 스타일 ─────────────────────────────────────────────────────────── */
const S = {
  page: {
    width: 1200,
    display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(180deg, #0e1848 0%, #101e58 25%, #0c1a50 55%, #0e1c54 80%, #0c1848 100%)',
    color: '#e2e8f8',
    position: 'relative',
  },

  /* 네비 */
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 36px', height: 64,
    background: 'rgba(10,16,52,0.92)',
    borderBottom: '1px solid rgba(56,189,248,0.15)',
    backdropFilter: 'blur(20px)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogoMark: { fontSize: 22, color: '#fbbf24' },
  navLogoName: { fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: 1 },
  navLogoSub: { fontSize: 9, color: '#a0b8d0', letterSpacing: 4, marginLeft: 4, marginTop: 2 },
  navCenter: { display: 'flex', gap: 8 },
  navLink: { fontSize: 13, color: '#b8d4ec', letterSpacing: 0.5, padding: '6px 14px' },
  navLinkActive: {
    fontSize: 13, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer',
    padding: '7px 18px', borderRadius: 7,
    color: '#e2e8f8',
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.3)',
    transition: 'all 0.15s',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },
  navUser: { fontSize: 12, color: '#c0d8f0', letterSpacing: 0.3 },
  navLoginBtn: {
    padding: '7px 16px', background: 'rgba(124,92,191,0.2)',
    border: '1px solid rgba(124,92,191,0.4)', borderRadius: 7,
    color: '#c084fc', fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  navLogoutBtn: {
    padding: '7px 14px', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7,
    color: '#c0d8f0', fontSize: 12, cursor: 'pointer',
  },
  navCompBadge: {
    fontSize: 11, color: '#fbbf24', background: 'rgba(251,191,36,0.12)',
    border: '1px solid rgba(251,191,36,0.35)', borderRadius: 20, padding: '4px 12px',
  },
  navPlayBtn: {
    padding: '9px 22px',
    background: 'linear-gradient(135deg, #1d6cb8, #1550a0)',
    border: '1px solid rgba(56,189,248,0.4)', borderRadius: 8,
    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 2px 14px rgba(29,108,184,0.4)',
  },

  /* 히어로 */
  hero: { position: 'relative', height: 560, overflow: 'hidden' },
  heroBg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(140deg, #1a3c9e 0%, #1230a0 40%, #0e2480 70%, #0c1e70 100%)',
  },
  heroGlow1: {
    position: 'absolute', width: 650, height: 650, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, transparent 60%)',
    top: -200, left: 0, pointerEvents: 'none',
  },
  heroGlow2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(251,191,36,0.18) 0%, transparent 60%)',
    bottom: -100, right: 80, pointerEvents: 'none',
  },
  heroCanvas: { position: 'absolute', inset: 0, opacity: 0.55 },
  heroFade: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(to bottom, rgba(18,48,160,0.0) 0%, rgba(14,36,128,0.3) 45%, rgba(12,28,100,0.82) 78%, rgba(10,24,80,0.98) 100%)',
  },
  heroContent: {
    position: 'absolute', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 20, gap: 12,
  },
  heroPill: {
    fontSize: 11, color: '#38bdf8', background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.35)', borderRadius: 20,
    padding: '5px 16px', letterSpacing: 1.5, fontWeight: 700,
  },
  heroTitle: {
    fontSize: 96, fontWeight: 900, letterSpacing: 6, lineHeight: 1, margin: 0,
    background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 35%, #f59e0b 65%, #fb923c 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    animation: 'shimmer 3s linear infinite',
    filter: 'drop-shadow(0 0 36px rgba(251,191,36,0.5))',
  },
  heroDesc: {
    fontSize: 17, color: '#c0d8f8', lineHeight: 1.7, textAlign: 'center', margin: 0,
  },
  heroHighlight: { color: '#f87171', fontWeight: 700 },
  heroBtns: { display: 'flex', gap: 14, marginTop: 8 },
  heroPlayBtn: {
    padding: '16px 44px',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    border: 'none', borderRadius: 10,
    color: '#1a0800', fontSize: 17, fontWeight: 900, cursor: 'pointer',
    letterSpacing: 1, boxShadow: '0 4px 32px rgba(251,191,36,0.5)',
  },
  heroCustomBtn: {
    padding: '16px 44px',
    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #5b21b6 100%)',
    border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 17, fontWeight: 900, cursor: 'pointer',
    letterSpacing: 1, boxShadow: '0 4px 32px rgba(168,85,247,0.6)',
  },
  heroHowBtn: {
    padding: '16px 36px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10,
    color: '#c8dcfa', fontSize: 15, cursor: 'pointer',
  },
  heroMeta: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 },
  heroMetaItem: { fontSize: 12, color: '#b8d4ec' },
  heroMetaDot: { color: '#a0c0d8', fontSize: 12 },

  /* 특징 카드 */
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
    background: 'rgba(0,0,0,0.25)',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  featCard: {
    padding: '32px 28px',
    background: 'rgba(255,255,255,0.025)',
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  featIcon: {
    width: 46, height: 46, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
  },
  featTitle: { fontSize: 15, fontWeight: 800, letterSpacing: 0.5 },
  featDesc:  { fontSize: 13, color: '#c0d8f0', lineHeight: 1.7 },

  /* 쇼케이스 */
  showcase: {
    padding: '64px 0',
    background: 'rgba(255,255,255,0.02)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  showcaseInner: { maxWidth: 1100, margin: '0 auto', padding: '0 50px' },
  sectionHeader: { textAlign: 'center', marginBottom: 40 },
  sectionEyebrow: { fontSize: 10, color: '#fbbf24', fontWeight: 700, letterSpacing: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: 1, marginBottom: 8, margin: 0 },
  sectionDesc: { fontSize: 14, color: '#c0d8f0', marginTop: 8 },
  unitGrid: { display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 },
  unitCard: {
    padding: '20px 12px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid',
    borderRadius: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
  },
  unitEmoji: {
    width: 48, height: 48, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
  },
  unitName: { fontSize: 14, fontWeight: 800 },
  unitWordBadge: {
    fontSize: 12, border: '1px solid', borderRadius: 6,
    padding: '3px 10px', fontWeight: 700, letterSpacing: 1,
  },
  unitStat: { fontSize: 11, color: '#90b0c8', textAlign: 'center', lineHeight: 1.4 },

  /* 정보 2열 */
  infoRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  infoBox: {
    padding: '72px 52px 48px',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.15)',
  },

  /* 마법 발견 */
  discoveryCards: { display: 'flex', flexDirection: 'column', gap: 10 },
  discoveryCard: {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    padding: '14px 18px', borderRadius: 10, border: '1px solid',
  },
  discoveryIcon: { fontSize: 22, lineHeight: 1, paddingTop: 2, flexShrink: 0 },
  discoveryHint: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  discoveryMystery: { fontSize: 12, color: '#b8d4ec', lineHeight: 1.5 },
  discoveryFooter: { marginTop: 24, fontSize: 13, color: '#b8d4ec', lineHeight: 1.8 },

  controlList: { display: 'flex', flexDirection: 'column', gap: 14 },
  controlItem: { display: 'flex', alignItems: 'flex-start', gap: 14 },
  controlKey: {
    fontSize: 11, padding: '6px 12px', borderRadius: 6, border: '1px solid',
    fontWeight: 700, flexShrink: 0, minWidth: 64, textAlign: 'center', letterSpacing: 0.5,
  },
  controlText: { display: 'flex', flexDirection: 'column', gap: 2 },
  controlTitle: { fontSize: 14, fontWeight: 700, color: '#e2e8f8' },
  controlDesc:  { fontSize: 12, color: '#b8d4ec', lineHeight: 1.5 },

  /* 하단 CTA */
  ctaSection: {
    position: 'relative', padding: '90px 0', textAlign: 'center', overflow: 'hidden',
  },
  ctaBg: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, #1230a8 0%, #0e2896 50%, #1230a8 100%)',
  },
  ctaGlow: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(251,191,36,0.12) 0%, transparent 65%)',
  },
  ctaContent: { position: 'relative' },
  ctaTitle: {
    fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: 3,
    margin: '0 0 10px', textShadow: '0 0 40px rgba(56,189,248,0.3)',
  },
  ctaDesc: { fontSize: 16, color: '#a0c0d8', marginBottom: 32, letterSpacing: 1 },
  ctaBtn: {
    padding: '18px 56px',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    border: 'none', borderRadius: 12,
    color: '#1a0800', fontSize: 18, fontWeight: 900, cursor: 'pointer',
    letterSpacing: 1, boxShadow: '0 8px 40px rgba(251,191,36,0.45)',
  },

  /* 푸터 */
  footer: {
    padding: '24px 48px',
    borderTop: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(0,0,0,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  footerLogo: { fontSize: 16, fontWeight: 900, color: '#7090a8', letterSpacing: 1 },
  footerText: { fontSize: 11, color: '#a0c0d8', letterSpacing: 0.5 },
};
