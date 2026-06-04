import { BuildPhase } from './phases/BuildPhase.js';
import { BattlePhase } from './phases/BattlePhase.js';
import { Renderer } from './Renderer.js';
import { SpriteCache } from './SpriteCache.js';
import { EffectManager } from './EffectManager.js';

export class GameEngine {
  constructor(canvas, onStateChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onStateChange = onStateChange;
    this.phase = 'build';
    this.buildPhase = null;
    this.battlePhase = null;
    this.renderer = null;
    this.spriteCache = new SpriteCache();
    this.effectManager = new EffectManager();
    this.raf = null;
    this.lastTime = 0;
    this.stateTimer = 0;
    this.strategy = { wallPos: 'mid', meleeMode: 'advance', rangedMode: 'advance' };
    this._pendingEnemyBuilds = [];
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  setMultiplayer(side) {
    this.multiSide = side; // 'p1' | 'p2'
    // 멀티플레이에서는 AI 타이핑 끔
    if (this.buildPhase) this.buildPhase.aiEnabled = false;
  }

  // 상대방 빌드 단어 처리
  handleEnemyBuild(word) {
    if (this.phase !== 'build') return;
    if (!this.buildPhase) {
      // 스프라이트 로딩 중 도착한 단어는 큐에 보관
      this._pendingEnemyBuilds.push(word);
      return;
    }
    this._spawnEnemyBuild(word);
  }

  _spawnEnemyBuild(word) {
    const { BUILD_WORDS } = this.buildPhase.constructor;
    const match = BUILD_WORDS?.find(w => w.word === word);
    if (match) this.buildPhase.spawn('enemy', match);
  }

  // 상대방 전투 단어 처리
  handleEnemyBattle(word) {
    if (this.phase !== 'battle') return;
    this.battlePhase.handleEnemyInput(word);
  }

  async start() {
    this.destroyed = false;
    // 탭이 다시 활성화될 때 rAF dt 점프 방지
    this._visHandler = () => {
      if (!document.hidden) this.lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', this._visHandler);
    await this.spriteCache.preloadSheets();
    if (this.destroyed) return;
    // 개별 PNG 방식 스프라이트 미리 로드
    const { UNIT_DEFS, BUILDING_DEFS } = await import('../data/units.js');
    const unitPaths = Object.values({ ...UNIT_DEFS, ...BUILDING_DEFS })
      .flatMap(d => [d.sprite, d.enemySprite])
      .filter(Boolean);

    const BG_BASE = '/assets/sprites/FreePlatformerNA/Background/';
    const bgPaths = ['CloudsBack','BGBack','BGFront','CloudsFront']
      .map(n => `${BG_BASE}${n}.png`);

    await Promise.all([
      this.spriteCache.preloadSprites([...unitPaths, ...bgPaths]),
      this.effectManager.preload(),
    ]);
    this.renderer = new Renderer(this.canvas, this.ctx, this.spriteCache, this.effectManager);
    this.buildPhase = new BuildPhase(this);
    if (this.multiSide) this.buildPhase.aiEnabled = false;
    this.buildPhase.start();
    // 로딩 중 큐에 쌓인 상대방 빌드 단어 처리
    for (const word of this._pendingEnemyBuilds) this._spawnEnemyBuild(word);
    this._pendingEnemyBuilds = [];
    this.emit();
    this.raf = requestAnimationFrame(this.loop.bind(this));
  }

  loop(ts) {
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    this.update(dt);
    this.render();

    // React 상태는 ~15fps로 throttle
    this.stateTimer += dt;
    if (this.stateTimer >= 0.066) { this.emit(); this.stateTimer = 0; }

    if (this.phase !== 'over') {
      this.raf = requestAnimationFrame(this.loop.bind(this));
    }
  }

  update(dt) {
    if (this.phase === 'build')   this.buildPhase.update(dt);
    if (this.phase === 'battle')  this.battlePhase.update(dt);
  }

  render() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.phase === 'build')   this.renderer.renderBuild(this.buildPhase, this.strategy);
    if (this.phase === 'battle')  this.renderer.renderBattle(this.battlePhase);
  }

  emit() {
    if (this.phase === 'build') {
      this.onStateChange({
        phase: 'build',
        timer: Math.ceil(this.buildPhase.timer),
        playerArmy: [...this.buildPhase.playerArmy],
        playerArmyCount: this.buildPhase.playerArmy.length,
        enemyArmyCount: this.buildPhase.enemyArmy.length,
      });
    } else if (this.phase === 'battle') {
      const b = this.battlePhase;
      this.onStateChange({
        phase: 'battle',
        timer: Math.ceil(b.timer),
        playerHp: b.playerCastle.hp,
        playerMaxHp: b.playerCastle.maxHp,
        enemyHp: b.enemyCastle.hp,
        enemyMaxHp: b.enemyCastle.maxHp,
        playerUnits: b.playerUnits.map(u => ({ unitId: u.unitId, hp: u.hp, maxHp: u.maxHp })),
        playerBuildings: b.playerBuildings.map(bl => ({ buildingId: bl.buildingId, hp: bl.hp, maxHp: bl.maxHp })),
        newKills: b.newKills.splice(0),
        spellCooldowns: { ...b.spellCooldowns },
      });
    }
  }

  handleInput(word) {
    if (this.phase === 'build')  return this.buildPhase.handleInput(word);
    if (this.phase === 'battle') return this.battlePhase.handleInput(word);
    return false;
  }

  startBattle() {
    if (this.phase !== 'build') return;
    this.phase = 'battle';
    this.battlePhase = new BattlePhase(this, this.buildPhase.getArmy(), this.strategy);
    this.emit();
  }

  endGame(winner) {
    if (this.phase === 'over') return;
    this.phase = 'over';
    cancelAnimationFrame(this.raf);
    const bp = this.buildPhase, bat = this.battlePhase;
    this.onStateChange({
      phase: 'over',
      winner,
      stats: {
        wordsTyped: (bp?.wordsTyped || 0) + (bat?.wordsTyped || 0),
        wpm:        bp?.wpm || 0,
        unitsBuilt: bp?.playerArmy.length || 0,
        kills:      bat?.kills || 0,
      },
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this._visHandler) document.removeEventListener('visibilitychange', this._visHandler);
  }
}
