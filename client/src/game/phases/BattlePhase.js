import { BATTLE_WORDS, WEAPON_WORDS } from '../../data/words.js';
import { Unit } from '../entities/Unit.js';
import { Building } from '../entities/Building.js';
import { Projectile } from '../entities/Projectile.js';
import { UNIT_DEFS } from '../../data/units.js';

const PLAYER_CASTLE_X = 45;
const ENEMY_CASTLE_X  = 1155;
const PLAYER_SPAWN_X  = 175;
const ENEMY_SPAWN_X   = 1025;
const UNIT_Y          = 400;

const WALL_POS = {
  back:  { player: 260, enemy: 940 },
  mid:   { player: 380, enemy: 820 },
  front: { player: 540, enemy: 660 },
};

const PROJ_COLORS = {
  fire: '#fb923c', lightning: '#fde047', ice: '#67e8f9',
  explosion: '#ef4444', magic: '#c084fc', arrow: '#d4a574',
};

const mkFx = (x, y, type, timer) => ({ x, y, type, timer, maxTimer: timer });

export class BattlePhase {
  constructor(engine, army, strategy = {}) {
    this.engine   = engine;
    this.timer    = 120;
    this.strategy = strategy;
    const pos = WALL_POS[strategy.wallPos] || WALL_POS.mid;
    this.playerWallX = pos.player;
    this.enemyWallX  = pos.enemy;

    this.playerUnits     = [];
    this.enemyUnits      = [];
    this.playerBuildings = [];
    this.enemyBuildings  = [];

    this.playerCastle = { hp: 500, maxHp: 500 };
    this.enemyCastle  = { hp: 500, maxHp: 500 };

    this.flyingWords  = [];
    this.projectiles  = [];
    this.effects      = [];

    this.wordTimer    = 0;
    this.wordInterval = 3.5;
    this.wordsTyped   = 0;
    this.blockedWords = 0;

    this.initArmy(army);
  }

  initArmy(army) {
    let pi = 0, ei = 0;
    army.player.forEach(def => {
      if (def.type === 'unit') {
        const count = UNIT_DEFS[def.unitId]?.ability === 'double_spawn' ? 2 : 1;
        for (let s = 0; s < count; s++) {
          this.playerUnits.push(new Unit({ unitId: def.unitId, side: 'player', x: PLAYER_SPAWN_X + pi * 10, y: UNIT_Y }));
          pi++;
        }
      } else {
        this.playerBuildings.push(new Building({ buildingId: def.buildingId, side: 'player', x: this.playerWallX - this.playerBuildings.length * 34, y: UNIT_Y }));
      }
    });
    army.enemy.forEach(def => {
      if (def.type === 'unit') {
        const count = UNIT_DEFS[def.unitId]?.ability === 'double_spawn' ? 2 : 1;
        for (let s = 0; s < count; s++) {
          this.enemyUnits.push(new Unit({ unitId: def.unitId, side: 'enemy', x: ENEMY_SPAWN_X - ei * 10, y: UNIT_Y }));
          ei++;
        }
      } else {
        this.enemyBuildings.push(new Building({ buildingId: def.buildingId, side: 'enemy', x: this.enemyWallX + this.enemyBuildings.length * 34, y: UNIT_Y }));
      }
    });
  }

  update(dt) {
    this.timer -= dt;

    // ── aura 버프 매 프레임 초기화 후 재적용 ──────
    [...this.playerUnits, ...this.enemyUnits].forEach(u => { u.speedBuff = 1; u.atkBuff = 1; });
    for (const u of [...this.playerUnits, ...this.enemyUnits]) {
      if (u.dead || u.ability !== 'aura') continue;
      const allies = u.side === 'player' ? this.playerUnits : this.enemyUnits;
      const { range = 150, speedMult = 1.3, atkMult = 1.2 } = u.abilityData || {};
      for (const ally of allies) {
        if (!ally.dead && ally !== u && Math.abs(ally.x - u.x) <= range) {
          ally.speedBuff = Math.max(ally.speedBuff, speedMult);
          ally.atkBuff   = Math.max(ally.atkBuff,   atkMult);
        }
      }
    }

    [...this.playerUnits, ...this.enemyUnits].forEach(u => u.update(dt, this));
    [...this.playerBuildings, ...this.enemyBuildings].forEach(b => b.update(dt, this));

    this.playerUnits     = this.playerUnits.filter(u => !u.dead);
    this.enemyUnits      = this.enemyUnits.filter(u => !u.dead);
    this.playerBuildings = this.playerBuildings.filter(b => !b.dead);
    this.enemyBuildings  = this.enemyBuildings.filter(b => !b.dead);

    // 투사체 이동
    this.projectiles.forEach(p => p.update(dt));
    this.projectiles = this.projectiles.filter(p => !p.done);

    // 날아오는 단어
    this.wordTimer += dt;
    if (this.wordTimer >= this.wordInterval) {
      this.wordTimer = 0;
      this.spawnWord();
    }
    for (let i = this.flyingWords.length - 1; i >= 0; i--) {
      const fw = this.flyingWords[i];
      fw.x -= fw.speed * dt;
      if (fw.x < 120) {
        this.playerCastle.hp -= fw.damage;
        this.effects.push(mkFx(90, UNIT_Y - 30, 'explosion', 0.6));
        this.flyingWords.splice(i, 1);
      }
    }

    this.effects = this.effects.filter(e => (e.timer -= dt) > 0);

    this.playerCastle.hp = Math.max(0, this.playerCastle.hp);
    this.enemyCastle.hp  = Math.max(0, this.enemyCastle.hp);

    if (this.enemyCastle.hp <= 0) this.engine.endGame('player');
    else if (this.playerCastle.hp <= 0 || this.timer <= 0) this.engine.endGame('enemy');
  }

  handleInput(word) {
    // 날아오는 단어 차단
    const fw = this.flyingWords.find(w => w.word === word);
    if (fw) {
      this.flyingWords = this.flyingWords.filter(w => w !== fw);
      this.effects.push(mkFx(fw.x, fw.y, 'block', 0.5));
      this.wordsTyped++;
      this.blockedWords++;
      return { type: 'block', word };
    }

    // 무기 단어
    const wep = WEAPON_WORDS.find(w => w.word === word);
    if (wep) {
      const { damage, effect, target } = wep;

      if (target === 'unit') {
        // ── 대유닛: 최전선 적 유닛 호밍 ──
        const alive = this.enemyUnits.filter(u => !u.dead);
        if (alive.length > 0) {
          const tgt = alive.reduce((a, b) => a.x < b.x ? a : b);
          this.projectiles.push(new Projectile({
            x: PLAYER_SPAWN_X, y: UNIT_Y - 40,
            targetX: tgt.x, targetY: tgt.y - 20,
            targetRef: tgt, speed: 360,
            color: PROJ_COLORS[effect] || '#fff', type: effect,
            onHit: () => {
              if (!tgt.dead) {
                tgt.hp -= damage;
                if (tgt.hp <= 0) tgt.dead = true;
                this.effects.push(mkFx(tgt.x, tgt.y - 20, effect, 0.6));
              }
            },
          }));
        } else {
          this.enemyCastle.hp -= Math.floor(damage * 0.5);
          this.effects.push(mkFx(ENEMY_CASTLE_X - 30, UNIT_Y - 50, effect, 0.5));
        }

      } else if (target === 'building') {
        // ── 대건물: 적 성벽 집중 타격 ──
        const aliveWalls = this.enemyBuildings.filter(b => !b.dead);
        if (aliveWalls.length > 0) {
          // 플레이어 쪽에서 가장 가까운 적 성벽 (x 최소)
          const tgt = aliveWalls.reduce((a, b) => a.x < b.x ? a : b);
          this.projectiles.push(new Projectile({
            x: PLAYER_SPAWN_X, y: UNIT_Y - 50,
            targetX: tgt.x, targetY: tgt.y - 48,
            speed: 280,
            color: PROJ_COLORS[effect] || '#d97706', type: effect,
            onHit: () => {
              if (!tgt.dead) {
                tgt.hp -= damage;
                if (tgt.hp <= 0) tgt.dead = true;
                this.effects.push(mkFx(tgt.x, tgt.y - 48, effect, 0.9));
              }
            },
          }));
        } else {
          // 성벽 없으면 성에 30% 피해
          this.enemyCastle.hp -= Math.floor(damage * 0.3);
          this.effects.push(mkFx(ENEMY_CASTLE_X - 30, UNIT_Y - 50, effect, 0.5));
        }

      } else {
        // ── 대성: 번개는 즉발, 나머지는 투사체 ──
        if (effect === 'lightning') {
          this.enemyCastle.hp -= damage;
          this.effects.push(mkFx(ENEMY_CASTLE_X - 30, UNIT_Y - 60, 'lightning', 0.6));
          this.effects.push(mkFx(ENEMY_CASTLE_X - 30, UNIT_Y - 60, 'explosion', 0.4));
        } else {
          this.projectiles.push(new Projectile({
            x: 100,
            y: UNIT_Y - 30 - Math.random() * 20,
            targetX: ENEMY_CASTLE_X - 30,
            targetY: UNIT_Y - 50,
            speed: 380 + Math.random() * 80,
            color: PROJ_COLORS[effect] || '#fff',
            type: effect,
            onHit: () => {
              this.enemyCastle.hp -= damage;
              this.effects.push(mkFx(ENEMY_CASTLE_X - 30, UNIT_Y - 50, effect, 0.7));
            },
          }));
        }
      }

      this.wordsTyped++;
      return { type: 'attack', word, damage, target };
    }

    return false;
  }

  // 유닛 전투 투사체 추가
  addCombatProjectile({ fromX, fromY, toX, toY, unitId, side, color, onHit }) {
    const typeMap = { archer: 'arrow', wizard: 'magic', catapult: 'explosion' };
    const type = typeMap[unitId] || 'arrow';
    const speed = unitId === 'catapult' ? 110 : unitId === 'wizard' ? 220 : 280;
    this.projectiles.push(new Projectile({
      x: fromX, y: fromY,
      targetX: toX, targetY: toY,
      speed, color, type, onHit,
    }));
  }

  spawnWord() {
    const word = BATTLE_WORDS[Math.floor(Math.random() * BATTLE_WORDS.length)];
    this.flyingWords.push({
      word,
      x: 1130,
      y: 160 + Math.random() * 160,
      damage: word.length * 5,
      speed: 38 + Math.random() * 25,
    });
  }
}
