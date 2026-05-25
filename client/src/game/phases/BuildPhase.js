import { BUILD_WORDS } from '../../data/words.js';

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
    this.aiInterval = 2.5;
    this.aiEnabled = true;
  }

  start() {
    this.startTime = performance.now();
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) { this.engine.startBattle(); return; }

    if (this.aiEnabled) {
      this.aiTimer += dt;
      if (this.aiTimer >= this.aiInterval) {
        this.aiTimer = 0;
        this.aiInterval = 2.0 + Math.random() * 1.5;
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
    const w = BUILD_WORDS[Math.floor(Math.random() * BUILD_WORDS.length)];
    this.spawn('enemy', w);
  }

  getArmy() { return { player: this.playerArmy, enemy: this.enemyArmy }; }

  get wpm() {
    const m = (performance.now() - this.startTime) / 60000;
    return m > 0 ? Math.round(this.wordsTyped / m) : 0;
  }
}
