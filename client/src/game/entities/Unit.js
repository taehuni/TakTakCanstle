import { UNIT_DEFS } from '../../data/units.js';
import { calcDamage, roleMultiplier } from '../../data/combat.js';

const RANGED_THRESHOLD = 40;
let _uidCounter = 0;

export class Unit {
  constructor({ unitId, side, x, y, teamCol }) {
    const def = UNIT_DEFS[unitId];
    Object.assign(this, def);
    this.uid      = _uidCounter++;
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
    this.facingLeft = (side === 'enemy'); // 스프라이트 방향: true=왼쪽, false=오른쪽

    // 버프/디버프
    this.speedBuff = 1;
    this.atkBuff   = 1;
    this.debuffs   = [];
    this.attackAnimTimer = 0; // [{ type:'atk_mult', mult:0.6, timer:5, source:'shaman' }]

    // 색상 변형 선택 — teamCol 있으면 팀 공유, 없으면 개별 랜덤
    if (Array.isArray(def.tileColRange)) {
      const idx = teamCol != null
        ? teamCol % def.tileColRange.length
        : Math.floor(Math.random() * def.tileColRange.length);
      this.tileCol = def.tileColRange[idx];
    }

    // ── ability 상태 초기화 ──────────────────────
    if (this.ability === 'phase') {
      this.phased = true; // 유체화 중 = 완전무적 + 벽통과, 선공격 시 해제
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
    if (this.ability === 'blink') {
      this._hasBlinked = false;
    }
    if (this.ability === 'poison') {
      // 독 DoT 틱은 debuffs로 관리
    }
    if (this.ability === 'devour') {
      // 처치 시 HP 회복 — doAttack에서 처리
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
    for (const d of this.debuffs) {
      if (d.type === 'spd_mult') spd *= d.mult;
    }
    return spd;
  }

  // ── 피해 수신 ────────────────────────────────────
  takeDamage(amount, dmgType = 'physical') {
    if (this.dead || this.reviving) return 0;
    if (this.phased) return 0; // 유체화 중 완전 무적
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

    // ── regen: HP 재생 ───────────────────────────
    if (this.ability === 'regen') {
      this.hp = Math.min(this.maxHp, this.hp + (this.abilityData?.regenRate || 3) * dt);
    }

    // ── 독 DoT 틱 처리 (0.5초마다) ──────────────
    for (const d of this.debuffs) {
      if (d.type === 'poison_dot') {
        d.tickTimer = (d.tickTimer ?? 0.5) - dt;
        if (d.tickTimer <= 0) {
          d.tickTimer = 0.5;
          const poisonDmg = calcDamage(d.dmg, 'poison', this.def || 0, this.mdef || 0, this.traits || []);
          this.hp -= poisonDmg;
        }
      }
    }

    // ── 디버프 타이머 감소 ────────────────────────
    this.debuffs = this.debuffs.filter(d => (d.timer -= dt) > 0);

    // ── 매혹: 인간 진영이 고양이에 홀려 행동 불가 ──
    if (this.debuffs.some(d => d.type === 'charmed')) {
      this.state = 'idle';
      this.animTimer += dt;
      return;
    }

    this.animTimer += dt;
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= dt;
      this.state = 'attack';
    }
    this.walkBob = this.state === 'walk' ? Math.sin(this.animTimer * 12) * 2 : 0;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const enemies        = this.side === 'player' ? battle.enemyUnits     : battle.playerUnits;
    const enemyBuildings = this.side === 'player' ? battle.enemyBuildings  : battle.playerBuildings;
    const castle         = this.side === 'player' ? battle.enemyCastle     : battle.playerCastle;
    const castleX        = this.side === 'player' ? 1155 : 45;
    const dir = this.side === 'player' ? 1 : -1;

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
        const maxTargets = this.abilityData?.maxTargets ?? 3;
        const allTargets = [...enemies, ...enemyBuildings]
          .filter(t => !t.dead && Math.abs(this.x - t.x) < aoeRange)
          .sort((a, b) => Math.abs(this.x - a.x) - Math.abs(this.x - b.x)) // 가까운 순
          .slice(0, maxTargets);
        for (const t of allTargets) {
          const d = calcDamage(dmg, 'fire', t.def || 0, t.mdef || 0, t.traits || []);
          t.takeDamage ? t.takeDamage(d, 'fire') : (t.hp -= d);
          if (t.hp <= 0 && !t.dead) t.dead = true;
        }
        if (Math.abs(this.x - castleX) < aoeRange) castle.hp -= Math.floor(dmg * 0.5);
        battle.effects.push({ x: this.x, y: this.y - 30, type: 'explosion', timer: 0.9, maxTimer: 0.9 });
        this.dead = true;
        return;
      }
    }

    // ── 타겟 탐색 ─────────────────────────────────
    let unitTarget = null, minDist = Infinity;
    const isRangedUnit  = this.range >= RANGED_THRESHOLD;
    const isFlyingAttacker = this.traits?.includes('flying');

    for (const e of enemies) {
      if (e.dead || e.phased) continue;
      if (e.traits?.includes('flying') && !isRangedUnit && !isFlyingAttacker) continue;
      const d = Math.abs(this.x - e.x);
      if (d < minDist) { minDist = d; unitTarget = e; }
    }

    // 유체화/공중 유닛은 건물 무시
    let buildTarget = null;
    const isFlyingSelf = this.traits?.includes('flying');
    if (!this.phased && !isFlyingSelf) {
      for (const b of enemyBuildings) {
        if (b.dead) continue;
        if (Math.abs(this.x - b.x) <= this.range) { buildTarget = b; break; }
      }
    }

    // ── 바라보는 방향 결정 ──────────────────────────
    if (unitTarget && minDist <= this.range) {
      this.facingLeft = unitTarget.x < this.x;
    } else if (buildTarget) {
      this.facingLeft = buildTarget.x < this.x;
    } else if (Math.abs(this.x - castleX) <= this.range) {
      this.facingLeft = castleX < this.x;
    } else {
      this.facingLeft = dir < 0;
    }

    // ── blink: 블링크 완료 후 근접 추적 공격 ─────────
    if (this.ability === 'blink' && this._hasBlinked) {
      if (unitTarget) {
        this.facingLeft = unitTarget.x < this.x;
        const MELEE = 32;
        if (minDist <= MELEE) {
          if (this.attackCooldown <= 0) {
            this.attackCooldown = this.cooldown;
            this.attackAnimTimer = Math.min(0.4, this.cooldown * 0.35);
            this.state = 'attack';
            this.doAttack(unitTarget, null, null, battle);
          } else if (this.attackAnimTimer <= 0) {
            this.state = 'idle';
          }
        } else if (minDist <= 300) {
          // 300px 이내 적만 추격
          this.state = 'walk';
          const chaseDir = unitTarget.x > this.x ? 1 : -1;
          this.x += chaseDir * this.effectiveSpeed * dt;
        } else {
          // 너무 멀면 성 방향으로 전진
          this.state = 'walk';
          this.x += dir * this.effectiveSpeed * dt;
        }
      } else {
        // 적 없으면 성 방향으로 전진
        this.state = 'walk';
        this.x += dir * this.effectiveSpeed * dt;
      }
      return;
    }

    if (unitTarget && minDist <= this.range) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.cooldown;
        this.attackAnimTimer = Math.min(0.4, this.cooldown * 0.35);
        this.attackTargetFlying = !!(unitTarget?.traits?.includes('flying'));
        this.state = 'attack';
        this.doAttack(unitTarget, null, null, battle);
      } else if (this.attackAnimTimer <= 0) {
        this.state = 'idle';
      }
    } else if (buildTarget) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.cooldown;
        this.attackAnimTimer = Math.min(0.4, this.cooldown * 0.35);
        this.state = 'attack';
        this.doAttack(null, null, buildTarget, battle);
      } else if (this.attackAnimTimer <= 0) {
        this.state = 'idle';
      }
    } else if (Math.abs(this.x - castleX) <= this.range) {
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.cooldown;
        this.attackAnimTimer = Math.min(0.4, this.cooldown * 0.35);
        this.state = 'attack';
        this.doAttack(null, castle, null, battle, castleX);
      } else if (this.attackAnimTimer <= 0) {
        this.state = 'idle';
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

      // 근접 유닛 한정: 가까운 적이 등 뒤에 있으면 돌아서서 추격
      const REACT_RANGE = 80;
      if (unitTarget && this.range < RANGED_THRESHOLD && minDist <= REACT_RANGE) {
        const chaseDir = unitTarget.x > this.x ? 1 : -1;
        this.x += chaseDir * this.effectiveSpeed * dt;
      } else {
        this.x += dir * this.effectiveSpeed * dt;
      }
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
          battle.effects.push({ x: unitTarget.x, y: unitTarget.y - 20, type: 'curse', timer: 0.5, maxTimer: 0.5 });
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
      const roleMult = roleMultiplier(this.role, target.role);
      const raw = Math.floor(atkOverride * dmgMult * roleMult);
      const d   = calcDamage(raw, this.dmgType, target.def || 0, target.mdef || 0, target.traits || []);
      const actual = target.takeDamage ? target.takeDamage(d, this.dmgType) : d;
      if (target.hp !== undefined) target.hp -= (target.takeDamage ? 0 : actual);
      if (target.hp <= 0 && !target.dead) target.dead = true;

      // life_steal — holy 디버프(life_steal_reduce) 적용
      if (this.ability === 'life_steal' && actual > 0) {
        let stealRate = this.abilityData?.stealRate || 0.35;
        const reduceDebuff = this.debuffs?.find(d => d.type === 'life_steal_reduce');
        if (reduceDebuff) stealRate *= reduceDebuff.mult;
        const heal = Math.floor(actual * stealRate);
        if (heal > 0) {
          this.hp = Math.min(this.maxHp, this.hp + heal);
          battle.effects.push({ x: this.x, y: this.y - 35, type: 'heart', timer: 0.6, maxTimer: 0.6 });
        }
      }

      // poison: 적중 시 독 DoT 부여
      if (this.ability === 'poison' && target && !target.dead) {
        target.debuffs = target.debuffs || [];
        const existing = target.debuffs.find(d => d.source === this.unitId + '_poison');
        if (existing) {
          existing.timer = this.abilityData?.poisonDuration || 4;
        } else {
          target.debuffs.push({
            type: 'poison_dot',
            dmg: Math.ceil(this.attack * (this.abilityData?.poisonRate || 0.25)),
            timer: this.abilityData?.poisonDuration || 4,
            tickTimer: 0.5,
            source: this.unitId + '_poison',
          });
        }
        battle.effects.push({ x: target.x, y: target.y - 20, type: 'poison', timer: 0.5, maxTimer: 0.5 });
      }

      // holy: 적중 시 life_steal 효율 감소 디버프 (사제/성기사 → 뱀파이어/흑기사 카운터)
      if (this.dmgType === 'holy' && target.ability === 'life_steal' && !target.dead) {
        target.debuffs = target.debuffs || [];
        const existing = target.debuffs.find(d => d.type === 'life_steal_reduce');
        if (existing) {
          existing.timer = 4;
        } else {
          target.debuffs.push({ type: 'life_steal_reduce', mult: 0.4, timer: 4, source: 'holy' });
        }
        battle.effects.push({ x: target.x, y: target.y - 20, type: 'magic', timer: 0.5, maxTimer: 0.5 });
      }

      return actual;
    };

    if (!isRanged && unitTarget && !unitTarget.dead) {
      const effectType = 'slash';
      battle.effects.push({
        x: unitTarget.x, y: unitTarget.y - 20,
        type: effectType, timer: 0.4, maxTimer: 0.4,
        flip: this.side === 'enemy',
      });
    }

    // ── blink: 전투 시작 시 단 한 번 적 진영 맨 뒤로 순간이동 ──
    if (this.ability === 'blink' && !this._hasBlinked && unitTarget && !unitTarget.dead) {
      const dir = this.side === 'player' ? 1 : -1;
      const allEnemies = this.side === 'player' ? battle.enemyUnits : battle.playerUnits;
      let backX = unitTarget.x;
      for (const e of allEnemies) {
        if (e.dead || e.phased) continue;
        if (this.side === 'player' && e.x > backX) backX = e.x;
        if (this.side === 'enemy'  && e.x < backX) backX = e.x;
      }
      const landX = backX + dir * 28;
      battle.effects.push({ x: this.x, y: this.y - 30, type: 'blink_out', timer: 0.5, maxTimer: 0.5 });
      this.x = landX;
      battle.effects.push({ x: this.x, y: this.y - 30, type: 'blink_in', timer: 0.5, maxTimer: 0.5 });
      this._hasBlinked = true;
      const nearest = allEnemies
        .filter(e => !e.dead && !e.phased)
        .sort((a, b) => Math.abs(this.x - a.x) - Math.abs(this.x - b.x))[0];
      if (nearest) {
        applyHit(nearest);
        battle.effects.push({ x: nearest.x, y: nearest.y - 20, type: 'slash', timer: 0.4, maxTimer: 0.4, flip: this.side === 'enemy' });
      }
      return;
    }

    // ── blink: 순간이동 완료 후 근접 공격 ──
    if (this.ability === 'blink' && this._hasBlinked && unitTarget && !unitTarget.dead) {
      applyHit(unitTarget);
      battle.effects.push({ x: unitTarget.x, y: unitTarget.y - 20, type: 'slash', timer: 0.4, maxTimer: 0.4, flip: this.side === 'enemy' });
      return;
    }

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
