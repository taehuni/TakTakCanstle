import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import MainMenu from './components/MainMenu.jsx';
import GameScreen from './components/GameScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import MatchmakingScreen from './components/MatchmakingScreen.jsx';
import DogamScreen from './components/DogamScreen.jsx';
import RankScreen from './components/RankScreen.jsx';
import AuthScreen from './components/AuthScreen.jsx';
import CustomRoomScreen from './components/CustomRoomScreen.jsx';
import HowToPlayModal from './components/HowToPlayModal.jsx';
import LiveRankSidebar from './components/LiveRankSidebar.jsx';
import { submitScore, getUserRank, updateUserRank, calcLpChange } from './data/rankService.js';

function calcScore(stats, won) {
  const base = (stats.wpm || 0) * 2 + (stats.wordsTyped || 0) * 4 + (stats.kills || 0) * 3;
  return Math.round(base + (won ? 50 : 0));
}

// ── 대각선 픽셀 캐릭터 배경 ──────────────────────────────
function PatternBackground() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // 베이스 배경색
    ctx.fillStyle = '#0f1a50';
    ctx.fillRect(0, 0, W, H);

    // 스프라이트시트 2장 로드
    const dungeon = new Image(); // spacing 1px → col*17, row*17
    const addon   = new Image(); // spacing 0px → col*16, row*16
    let doneCount = 0;

    const draw = () => {
      // 사용할 스프라이트 목록
      // dungeon: 검사(7,3) 궁수(7,1) 기사(8,0) 마법사(7,0)
      // addon:   몬스터 row8~9
      const SPRITES = [
        { img: dungeon, sx: 3*17, sy: 7*17 },  // 검사
        { img: addon,   sx: 0*16, sy: 8*16 },  // 몬스터A
        { img: dungeon, sx: 1*17, sy: 7*17 },  // 궁수
        { img: addon,   sx: 3*16, sy: 8*16 },  // 몬스터B
        { img: dungeon, sx: 0*17, sy: 8*17 },  // 기사
        { img: addon,   sx: 1*16, sy: 9*16 },  // 몬스터C
        { img: dungeon, sx: 0*17, sy: 7*17 },  // 마법사
        { img: addon,   sx: 4*16, sy: 9*16 },  // 몬스터D
      ];

      const SCALE   = 3;          // 16px → 48px
      const SIZE    = 16 * SCALE;
      const CELL_W  = 120;
      const CELL_H  = 104;

      ctx.globalAlpha = 0.10;

      const rows = Math.ceil(H / CELL_H) + 2;
      const cols = Math.ceil(W / CELL_W) + 3;

      for (let row = -1; row < rows; row++) {
        const xOff = (row % 2 !== 0) ? CELL_W / 2 : 0;
        for (let col = -1; col < cols; col++) {
          const x = col * CELL_W + xOff;
          const y = row * CELL_H;
          const s = SPRITES[Math.abs((row * 3 + col) % SPRITES.length)];
          ctx.drawImage(s.img, s.sx, s.sy, 16, 16, x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);
        }
      }
    };

    const onLoad = () => { doneCount++; if (doneCount >= 2) draw(); };
    dungeon.onload  = onLoad;
    dungeon.onerror = onLoad;
    addon.onload    = onLoad;
    addon.onerror   = onLoad;

    dungeon.src = '/assets/sprites/tiny-creatures/Tilemap/Kenney_tiny_dungeon.png';
    addon.src   = '/assets/sprites/TinyPackAddOn/Sprites-16x16.png';
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        imageRendering: 'pixelated',
      }}
    />
  );
}

// ────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]       = useState('menu');
  const [gameKey, setGameKey]     = useState(0);
  const [result, setResult]       = useState(null);
  const [multiInfo, setMultiInfo] = useState(null);
  const [user, setUser]           = useState(undefined);
  const [showAuth, setShowAuth]     = useState(false);
  const [showHowTo, setShowHowTo]   = useState(false);
  const [rematchStatus, setRematchStatus] = useState(null); // null | 'waiting' | 'opponent_ready' | 'disconnected'
  const pendingAction             = useRef(null);
  const bgmRef                    = useRef(null);
  const [muted, setMuted]         = useState(false);

  // BGM: 게임 화면에서만 재생
  useEffect(() => {
    if (!bgmRef.current) {
      const bgm = new Audio('/assets/sound/(LOOP-READY) Track 8 - Upper Quarter_3.mp3');
      bgm.loop   = true;
      bgm.volume = 0.35;
      bgmRef.current = bgm;
    }
    const bgm = bgmRef.current;
    if (screen === 'game' && !muted) {
      bgm.play().catch(() => {});
    } else {
      bgm.pause();
    }
    return () => bgm.pause();
  }, [screen, muted]);

  useEffect(() => {
    return onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        setShowAuth(false);
        if (pendingAction.current) {
          pendingAction.current();
          pendingAction.current = null;
        }
      }
    });
  }, []);

  const requireAuth = (action) => {
    if (user) { action(); return; }
    pendingAction.current = action;
    setShowAuth(true);
  };

  const playerName = user?.displayName || '익명';

  const [matchMode, setMatchMode] = useState('normal'); // 'normal' | 'ranked'

  const goGame      = () => requireAuth(() => { setGameKey(k => k + 1); setScreen('game'); });
  const goMulti     = () => requireAuth(() => { setMatchMode('normal'); setScreen('matchmaking'); });
  const goRanked    = () => requireAuth(() => { setMatchMode('ranked'); setScreen('matchmaking'); });
  const goCustom    = () => requireAuth(() => setScreen('custom'));
  const goDogam     = () => { setScreen('dogam'); };
  const goRank      = () => { setScreen('rank'); };
  const onMatched   = (info) => { setMultiInfo(info); setGameKey(k => k + 1); setScreen('game'); };
  const handleEnd   = async (r) => {
    const won   = r.winner === 'player';
    const score = calcScore(r.stats || {}, won);
    const isRanked = multiInfo?.mode === 'ranked';

    // 즉시 결과 화면으로 전환 (검은 화면 방지)
    setResult({ ...r, score, lpChange: null, newLp: null, isRanked });
    setRematchStatus(null);
    setScreen('result');

    // LP 갱신은 백그라운드에서 처리 후 결과 화면 업데이트
    if (isRanked && user?.uid) {
      try {
        const rankData = await getUserRank(user.uid).catch(() => ({ lp: 0 }));
        const myLp  = rankData.lp || 0;
        const oppLp = multiInfo?.opponentLp ?? myLp;
        const lpChange = calcLpChange(myLp, oppLp, won);
        const newLp = await updateUserRank(user.uid, playerName, lpChange, won);
        setResult(prev => ({ ...prev, lpChange, newLp }));
      } catch (e) {
        console.error('[LP 업데이트 실패]', e);
      }
    } else if (!isRanked) {
      submitScore({ uid: user?.uid, name: playerName, score, won, ...r.stats }).catch(() => {});
    }
  };

  const handleReplay = () => {
    if (multiInfo) {
      multiInfo.socket.emit('rematch_request');
      setRematchStatus('waiting');
    } else {
      goGame();
    }
  };

  // 결과 화면에서 멀티플레이 재매칭 소켓 리스너
  useEffect(() => {
    if (!multiInfo || screen !== 'result') return;
    const { socket } = multiInfo;

    const onReady = () => {
      setRematchStatus(null);
      setGameKey(k => k + 1);
      setScreen('game');
    };
    const onOpponentWants = () => {
      setRematchStatus(s => s === 'waiting' ? 'waiting' : 'opponent_ready');
    };
    const onDisconnected = () => setRematchStatus('disconnected');

    socket.on('rematch_ready',          onReady);
    socket.on('opponent_wants_rematch', onOpponentWants);
    socket.on('opponent_disconnected',  onDisconnected);
    return () => {
      socket.off('rematch_ready',          onReady);
      socket.off('opponent_wants_rematch', onOpponentWants);
      socket.off('opponent_disconnected',  onDisconnected);
    };
  }, [multiInfo, screen]);

  return (
    <div style={{
      width: '100vw', minHeight: '100vh',
      background: '#0f1a50',
      overflowX: 'hidden',
      overflowY: screen === 'menu' ? 'auto' : 'hidden',
    }}>
      {/* 항상 배경 패턴 표시 */}
      <PatternBackground />

      {/* 전역 뮤트 버튼 (메뉴·게임 화면) */}
      {(screen === 'menu' || screen === 'game') && (
        <button
          onClick={() => setMuted(m => !m)}
          title={muted ? '소리 켜기' : '소리 끄기'}
          style={{
            position: 'fixed', top: 12, left: 14, zIndex: 2000,
            fontSize: 16, width: 34, height: 34,
            borderRadius: 6, cursor: 'pointer',
            background: muted ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.07)',
            border: `1px solid ${muted ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.15)'}`,
            color: muted ? '#f87171' : '#aaa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >{muted ? '🔇' : '🔊'}</button>
      )}

      <div style={{
        display: 'flex',
        alignItems: screen === 'game' ? 'flex-start' : 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
      }}>
        {user === undefined
          ? <div style={{ color: '#555', fontSize: 14 }}>로딩 중...</div>
          : <>
              {screen === 'menu'        && <><MainMenu onStart={goGame} onMulti={goMulti} onRanked={goRanked} onCustom={goCustom} onDogam={goDogam} onRank={goRank} onHowTo={() => setShowHowTo(true)} user={user} onLogin={() => setShowAuth(true)} onLogout={() => signOut(auth)} /><LiveRankSidebar /></>}
              {screen === 'matchmaking' && <MatchmakingScreen onMatched={onMatched} onBack={() => setScreen('menu')} mode={matchMode} userId={user?.uid} />}
              {screen === 'game'        && <GameScreen key={gameKey} onEnd={handleEnd} multiInfo={multiInfo} />}
              {screen === 'result'      && <ResultScreen result={result} onReplay={handleReplay} onMenu={() => setScreen('menu')} onDogam={goDogam} onRank={goRank} rematchStatus={rematchStatus} isMulti={!!multiInfo} />}
              {screen === 'custom'      && <CustomRoomScreen onMatched={onMatched} onBack={() => setScreen('menu')} />}
              {screen === 'dogam'       && <DogamScreen onBack={() => setScreen('menu')} />}
              {screen === 'rank'        && <RankScreen onBack={() => setScreen('menu')} currentUid={user?.uid} />}
              {showAuth  && <AuthScreen onClose={() => setShowAuth(false)} />}
              {showHowTo && <HowToPlayModal onClose={() => setShowHowTo(false)} />}
            </>
        }
      </div>
    </div>
  );
}
