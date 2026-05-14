import { BUILDING_DEFS } from '../../data/units.js';

export class Building {
  constructor({ buildingId, side, x, y }) {
    const def = BUILDING_DEFS[buildingId];
    Object.assign(this, def);
    this.buildingId = buildingId;
    this.side = side;
    this.x = x;
    this.y = y;
    this.hp = def.hp;
    this.dead = false;
    this.attackCooldown = 0;
  }

  update(dt, battle) {
    if (this.dead || this.attack === 0) return;
    if (this.attackCooldown > 0) { this.attackCooldown -= dt; return; }

    const enemies = this.side === 'player' ? battle.enemyUnits : battle.playerUnits;
    const target = enemies.find(e => !e.dead && Math.abs(this.x - e.x) <= this.range);
    if (target) {
      target.hp -= this.attack;
      this.attackCooldown = this.cooldown;
      if (target.hp <= 0) target.dead = true;
    }
  }
}
