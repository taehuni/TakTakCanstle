import { UNIT_DEFS } from '../../data/units.js';
import { calcDamage } from '../../data/combat.js';

const RANGED_THRESHOLD = 40;

export class Unit {
  constructor({ unitId, side, x, y }) {
    const def = UNIT_DEFS[unitId];
    Object.assign(this, def);
    this.unitId   = unitId;
    this.side     = side;
    this.x        = x;
    this.y        = y;
    this.hp       = def.hp;
    this.dead     = false;
    this.state    = 'walk';
    this.attackCooldown = 0;
    this.animTimer      = 0;
    this.walkBob        = 0;

    // 버프/디버프
    this.speedBuff = 1;  // aura 등으로 설정
    this.atkBuff   = 1;
    this.debuffs   = []; // [{ type:'atk_mult', mult:0.6, timer:5, source:'shaman' }]

    // ── ability 상태 초기화 ──────────────────────
    if (this.ability === 'phase') {
      this.phased     = true;   // 유체화 중 = 물리무적 + 벽통과
      this.hasAttacked = false;
    }
    if (this.ability === 'rage') {
      this.enraged = false;
    }
    if (this.ability === 'revive') {
      this.revived      = false;
      this.reviving     = false;
      this.reviveTimer  = 0;
    }
    if (this.ability === 'charge') {
      this.hasCharged = false;
    }
  }

  // ── 유효 공격력 (버프/디버프/rage 반영) ─────────
  get effectiveAtk() {
    let atk = this.attack * this.atkBuff;
    if (this.ability === 'rage' && this.enraged) atk *= (this.abilityData?.atkMult || 2);
    for (const d of this.debuffs) {
      if (d.type === 'atk_mult') atk *= d.mult;
    }
    return Math.floor(atk);
  }

  // ── 유효 이동속도 ────────────────────────────────
  get effectiveSpeed() {
    let spd = this.speed * this.speedBuff;
    if (this.ability === 'rage' && this.enraged) spd *= (this.abilityData?.spdMult || 1.5);
    return spd;
  }

  // ── 피해 수신 (phase 무적 / 면역 체크) ───────────
  takeDamage(amount, dmgType = 'physical') {
    if (this.dead || this.reviving) return 0;
    // 유체화 중 → 물리/관통 무효
    if (this.phased && (dmgType === 'physical' || dmgType === 'pierce')) return 0;
    this.hp -= amount;
    return amount;
  }

  update(dt, battle) {
    if (this.dead) return;

    // ── 부활 대기 중 ──────────────────────────────
    if (this.reviving) {
      this.reviveTimer -= dt;
      if (this.reviveTimer <= 0) {
        this.hp       = Math.floor(this.maxHp * (this.abilityData?.hpRatio || 0.4));
        this.reviving = false;
        this.revived  = true;
        this.state    = 'walk';
      }
      return;
    }

    // ── 사망 판정 (HP ≤ 0) ────────────────────────
    if (this.hp <= 0) {
      if (this.ability === 'revive' && !this.revived) {
        this.hp        = 0;
        this.reviving  = true;
        this.reviveTimer = this.abilityData?.delay || 1.5;
        this.state     = 'dying';
        return;
      }
      this.dead = true;
      return;
    }

    // ── rage: 분노 발동 체크 ──────────────────────
    if (this.ability === 'rage' && !this.enraged) {
      if (this.hp / this.maxHp <= (this.abilityData?.threshold || 0.3)) {
        this.enraged = true;
        battle.effects.push({ x: this.x, y: this.y - 20, type: 'explosion', timer: 0.5, maxTimer: 0.5 });
      }
    }

    // ── 디버프 타이머 감소 ────────────────────────
    this.debuffs = this.debuffs.filter(d => (d.timer -= dt) > 0);

    this.animTimer += dt;
    this.walkBob = this.state === 'walk' ? Math.sin(this.animTimer * 12) * 2 : 0;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const enemies        = this.side === 'player' ? battle.enemyUnits     : battle.playerUnits;
    const enemyBuildings = this.side === 'player' ? battle.enemyBuildings  : battle.playerBuildings;
    const castle         = this.side === 'player' ? battle.enemyCastle     : battle.playerCastle;
    const castleX        = this.side === 'player' ? 1155 : 45;
    const dir            = this.side === 'player' ? 1 : -1;

    // ── kamikaze: 근접 시 자폭 ────────────────────
    if (this.ability === 'kamikaze') {
      const triggerRange = this.abilityData?.triggerRange || 50;
      const aoeRange     = this.abilityData?.aoeRange || 90;
      let triggered = false;
      for (const e of enemies)        { if (!e.dead && Math.abs(this.x - e.x) < triggerRange) { triggered = true; break; } }
      for (const b of enemyBuildings) { if (!b.dead && Math.abs(this.x - b.x) < triggerRange) { triggered = true; break; } }
      if (Math.abs(this.x - castleX) < triggerRange) triggered = true;

      if (triggered) {
        const dmg = this.attack;
        const allTargets = [...enemies, ...enemyBuildings];
        for (const t of allTargets) {
          if (!t.dead && Math.abs(this.x - t.x) < aoeRange) {
            const d = calcDamage(dmg, 'fire', t.def || 0, t.mdef || 0, t.traits || []);
            t.takeDamage ? t.takeDamage(d, 'fire') : (t.hp -= d);
            if (t.hp <= 0 && !t.dead) t.dead = true;
          }
        }
        if (Math.abs(this.x - castleX) < aoeRange) castle.hp -= Math.floor(dmg * 0.5);
        battle.effects.push({ x: this.x, y: this.y - 30, type: 'explosion', timer: 0.9, maxTimer: 0.9 });
        this.dead = true;
        return;
      }
    }

    // ── 타겟 탐색 ─────────────────────────────────
    let unitTarget = null, minDist = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.abs(this.x - e.x);
      if (d < minDist) { minDist = d; unitTarget = e; }
    }

    // 유체화 중(ghost)에는 건물 무시
    let buildTarget = null;
    if (!this.phased) {
      for (const b of enemyBuildings) {
        if (b.dead) continue;
        if (Math.abs(this.x - b.x) <= this.range) { buildTarget = b; break; }
      }
    }

    if (unitTarget && minDist <= this.range) {
      this.state = 'attack';
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.cooldown;
        // phase: 첫 공격 시 유체화 해제
        if (this.phased) {
          this.phased = true; // still phased until actual contact
        }
        this.doAttack(unitTarget, null, null, battle);
      }
    } else if (buildTarget) {
      this.state = 'attack';
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.cooldown;
        this.doAttack(null, null, buildTarget, battle);
      }
    } else if (Math.abs(this.x - castleX) <= this.range) {
      this.state = 'attack';
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.cooldown;
        this.doAttack(null, castle, null, battle, castleX);
      }
    } else {
      this.state = 'walk';

      if (this.side === 'player' && battle.strategy && !this.phased) {
        const ownWalls = battle.playerBuildings.filter(b => !b.dead);
        if (ownWalls.length > 0) {
          const frontX = ownWalls.reduce((max, w) => w.x > max ? w.x : max, -Infinity);
          if (this.range >= RANGED_THRESHOLD && battle.strategy.rangedMode === 'behind') {
            if (this.x >= frontX - 24) return;
          } else if (this.range < RANGED_THRESHOLD && battle.strategy.meleeMode === 'hold') {
            if (this.x >= frontX + 36) return;
          }
        }
      }

      this.x += dir * this.effectiveSpeed * dt;
    }
  }

  doAttack(unitTarget, castle, building, battle, castleX) {
    const isRanged = this.range >= RANGED_THRESHOLD;

    // ── 유체화 해제 ────────────────────────────────
    if (this.ability === 'phase' && this.phased) {
      this.phased = false;
      battle.effects.push({ x: this.x, y: this.y - 20, type: 'magic', timer: 0.5, maxTimer: 0.5 });
    }

    // ── curse: 데미지 없이 디버프만 ───────────────
    if (this.dmgType === 'curse') {
      if (unitTarget && !unitTarget.dead) {
        const alreadyCursed = unitTarget.debuffs?.some(d => d.source === 'shaman');
        if (!alreadyCursed) {
          unitTarget.debuffs = unitTarget.debuffs || [];
          unitTarget.debuffs.push({
            type: 'atk_mult',
            mult: this.abilityData?.curseMult || 0.6,
            timer: this.abilityData?.curseDuration || 5,
            source: 'shaman',
          });
          battle.effects.push({ x: unitTarget.x, y: unitTarget.y - 20, type: 'magic', timer: 0.5, maxTimer: 0.5 });
        }
      }
      if (isRanged && unitTarget) {
        battle.addCombatProjectile({
          fromX: this.x + (this.side === 'player' ? 12 : -12),
          fromY: this.y - 20,
          toX: unitTarget.x, toY: unitTarget.y - 20,
          unitId: this.unitId, side: this.side,
          color: '#818cf8',
          onHit: () => {},
        });
      }
      return;
    }

    // ── charge: 첫 공격 보너스 ──────────────────────
    let atkOverride = this.effectiveAtk;
    if (this.ability === 'charge' && !this.hasCharged) {
      atkOverride = Math.floor(atkOverride * (this.abilityData?.mult || 1.3));
      this.hasCharged = true;
    }

    const applyHit = (target, dmgMult = 1) => {
      if (!target || target.dead) return 0;
      const raw = Math.floor(atkOverride * dmgMult);
      const d   = calcDamage(raw, this.dmgType, target.def || 0, target.mdef || 0, target.traits || []);
      const actual = target.takeDamage ? target.takeDamage(d, this.dmgType) : d;
      if (target.hp !== undefined) target.hp -= (target.takeDamage ? 0 : actual);
      if (target.hp <= 0 && !target.dead) target.dead = true;

      // life_steal
      if (this.ability === 'life_steal' && actual > 0) {
        const heal = Math.floor(actual * (this.abilityData?.stealRate || 0.35));
        this.hp = Math.min(this.maxHp, this.hp + heal);
      }
      return actual;
    };

    if (isRanged) {
      const toX = unitTarget ? unitTarget.x : (building ? building.x : castleX);
      const toY = unitTarget ? unitTarget.y - 20 : this.y - 30;
      battle.addCombatProjectile({
        fromX: this.x + (this.side === 'player' ? 12 : -12),
        fromY: this.y - 20,
        toX, toY,
        targetRef: unitTarget || null,
        unitId: this.unitId, side: this.side,
        color: this.side === 'player' ? this.color : this.enemyColor,
        onHit: () => {
          if (unitTarget)  applyHit(unitTarget);
          else if (building) applyHit(building, this.buildingDmgMulti || 1);
          else if (castle) castle.hp -= Math.floor(atkOverride * 0.8);
        },
      });
    } else {
      if (unitTarget)  applyHit(unitTarget);
      else if (building) applyHit(building, this.buildingDmgMulti || 1);
      else if (castle) castle.hp -= atkOverride;
    }
  }
}
