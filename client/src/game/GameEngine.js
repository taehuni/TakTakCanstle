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
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async start() {
    this.destroyed = false;
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
    this.buildPhase.start();
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
        wordsTyped:   (bp?.wordsTyped  || 0) + (bat?.wordsTyped  || 0),
        wpm:          bp?.wpm  || 0,
        unitsBuilt:   bp?.playerArmy.length || 0,
        blockedWords: bat?.blockedWords || 0,
      },
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
  }
}
