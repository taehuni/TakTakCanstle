export class Projectile {
  constructor({ x, y, targetX, targetY, targetRef, speed, color, type, onHit }) {
    this.x = x; this.y = y;
    this.targetRef = targetRef || null;
    this.tx = targetX;
    this.ty = targetY;
    this.speed = speed;
    this.color = color;
    this.type = type || 'default';
    this.onHit = onHit;
    this.done = false;
    this.elapsed = 0;
    this._calcDir();
  }

  _calcDir() {
    const dx = this.tx - this.x, dy = this.ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  update(dt) {
    if (this.targetRef) {
      if (this.targetRef.dead) { this.done = true; return; } // 타겟 소멸 시 제거
      this.tx = this.targetRef.x;
      this.ty = this.targetRef.y - 20;
      this._calcDir(); // 호밍: 매 프레임 방향 재계산
    }
    this.elapsed += dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const dx = this.tx - this.x, dy = this.ty - this.y;
    if (dx * dx + dy * dy < 100) { this.onHit?.(); this.done = true; }
  }
}
