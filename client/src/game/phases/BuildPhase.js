import { BUILD_WORDS } from '../../data/words.js';
import { UNIT_DEFS } from '../../data/units.js';

// AI 가중치: 강한 유닛일수록 높은 확률로 선택
const AI_WEIGHTS = BUILD_WORDS.map(w => {
  if (w.type === 'building') return { w, weight: 2 }; // 성벽도 가끔 세움
  const def = UNIT_DEFS[w.unit];
  if (!def) return { w, weight: 1 };
  // 스탯 합산으로 가중치 결정
  const score = (def.attack || 0) + (def.hp || 0) / 10 + (def.speed || 0) / 5;
  return { w, weight: Math.max(1, Math.floor(score / 8)) };
});
const AI_TOTAL_WEIGHT = AI_WEIGHTS.reduce((s, x) => s + x.weight, 0);

function pickWeightedWord() {
  let r = Math.random() * AI_TOTAL_WEIGHT;
  for (const { w, weight } of AI_WEIGHTS) {
    r -= weight;
    if (r <= 0) return w;
  }
  return AI_WEIGHTS[AI_WEIGHTS.length - 1].w;
}

export class BuildPhase {
  static BUILD_WORDS = BUILD_WORDS;

  constructor(engine) {
    this.engine = engine;
    this.timer = 30;
    this.playerArmy = [];
    this.enemyArmy = [];
    this.wordsTyped = 0;
    this.startTime = 0;
    this.aiTimer = 0;
    this.aiInterval = 1.5;
    this.aiEnabled = true;
  }

  start() {
    this.startTime  = performance.now();
    this._startedAt = Date.now();
  }

  update(dt) {
    this.timer = Math.max(0, 30 - (Date.now() - this._startedAt) / 1000);
    if (this.timer <= 0) { this.engine.startBattle(); return; }

    if (this.aiEnabled) {
      this.aiTimer += dt;
      if (this.aiTimer >= this.aiInterval) {
        this.aiTimer = 0;
        this.aiInterval = 1.0 + Math.random() * 1.0; // 1.0~2.0초 (기존 2.0~3.5s)
        this.aiType();
      }
    }
  }

  handleInput(word) {
    const match = BUILD_WORDS.find(w => w.word === word);
    if (!match) return false;
    this.spawn('player', match);
    this.wordsTyped++;
    return match;
  }

  spawn(side, def) {
    const army = side === 'player' ? this.playerArmy : this.enemyArmy;
    army.push(def.type === 'unit'
      ? { type: 'unit', unitId: def.unit }
      : { type: 'building', buildingId: def.building }
    );
  }

  aiType() {
    // 가중치 기반 선택 — 강한 유닛 선호
    const w = pickWeightedWord();
    this.spawn('enemy', w);
  }

  getArmy() { return { player: this.playerArmy, enemy: this.enemyArmy }; }

  get wpm() {
    const m = (performance.now() - this.startTime) / 60000;
    return m > 0 ? Math.round(this.wordsTyped / m) : 0;
  }
}
