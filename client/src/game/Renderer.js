import { UNIT_DEFS, BUILDING_DEFS } from '../data/units.js';
import { CASTLE_DEF } from '../data/castle.js';

const W = 1200, H = 500, GROUND_Y = 400, UNIT_Y = 400;

const WALL_POS = {
  back:  { player: 260, enemy: 940 },
  mid:   { player: 380, enemy: 820 },
  front: { player: 540, enemy: 660 },
};

const EFFECT_COLORS = {
  block: '#60a5fa', fire: '#fb923c', lightning: '#fde047',
  ice: '#67e8f9', explosion: '#f87171', magic: '#c084fc',
  egg: '#facc15', heart: '#f472b6',
  holy: '#fef08a', poison: '#86efac', heal: '#4ade80',
  fire_arrow: '#ff6820', fireball: '#ff4500', fire_siege: '#ff5c00',
  arcane: '#fbbf24', dark_magic: '#7c3aed', curse: '#818cf8',
};

const PROJ_COLORS = {
  fire: '#fb923c', lightning: '#fde047', ice: '#67e8f9',
  explosion: '#ef4444', magic: '#c084fc', arrow: '#d4a574',
  egg: '#facc15', holy: '#fef08a', poison: '#86efac',
  fire_arrow: '#ff6820', fireball: '#ff4500', fire_siege: '#ff5c00',
  arcane: '#fbbf24', dark_magic: '#7c3aed', curse: '#818cf8',
};

function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); }
  else { ctx.rect(x, y, w, h); }
}

export class Renderer {
  constructor(canvas, ctx, spriteCache, effectManager = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false; // 픽셀아트 선명하게
    this.sc = spriteCache;
    this.em = effectManager;
    this.stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * (GROUND_Y * 0.7),
      r: Math.random() * 1.2 + 0.3,
    }));
  }

  renderBuild(phase, strategy = {}) {
    this.drawBg();
    this.drawCastle('player');
    this.drawCastle('enemy');
    this.drawWallIndicator(strategy);
    this.drawBuildArmy(phase.playerArmy, 'player', strategy);
    this.drawBuildArmy(phase.enemyArmy, 'enemy', strategy, true);
    this.drawArmyBadge(phase.playerArmy.length, phase.enemyArmy.length);
  }

  drawWallIndicator(strategy) {
    const pos = WALL_POS[strategy.wallPos] || WALL_POS.mid;
    const ctx = this.ctx;
    ctx.save();

    const drawLine = (x, color, label) => {
      // 반투명 배경 글로우
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      // 점선
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y - 100);
      ctx.lineTo(x, GROUND_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      // 라벨
      ctx.fillStyle = color;
      ctx.font = 'bold 10px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, x, GROUND_Y - 102);
    };

    drawLine(pos.player, 'rgba(100,180,255,0.85)', '성벽');
    drawLine(pos.enemy,  'rgba(255,100,100,0.85)', '성벽');
    ctx.restore();
  }

  renderBattle(phase) {
    this.drawBg();
    this.drawCastle('player', phase.playerCastle);
    this.drawCastle('enemy', phase.enemyCastle);
    [...phase.playerBuildings, ...phase.enemyBuildings].forEach(b => this.drawBuilding(b));
    [...phase.playerUnits, ...phase.enemyUnits].forEach(u => this.drawUnit(u));
    phase.projectiles.forEach(p => this.drawProjectile(p));
    phase.effects.forEach(e => this.drawEffect(e));
  }

  drawBg() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const BG = '/assets/sprites/FreePlatformerNA/Background/';

    // 배경 레이어 순서: 하늘+구름 → 원경산 → 근경산+초원 → 전경구름
    // 512×320 → 1200×500 (캔버스 전체 커버)
    const layers = ['CloudsBack','BGBack','BGFront','CloudsFront'];
    let skyLoaded = false;
    for (const name of layers) {
      const img = this.sc.get(`${BG}${name}.png`);
      if (img) { ctx.drawImage(img, 0, 0, W, H); skyLoaded = true; }
    }
    if (!skyLoaded) {
      const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      grad.addColorStop(0, '#4eb8c8'); grad.addColorStop(1, '#a0dce8');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, GROUND_Y);
    }

    // 지면 타일: fp-tiles 16×16, 3배 확대(48px), GROUND_Y에 배치
    // row 0: 상단 풀+흙 타일 / row 1: 흙 내부
    const TS = 48;
    for (let tx = 0; tx < W; tx += TS) {
      if (!this.drawTile('fp-tiles', 0, 1, tx, GROUND_Y, TS, TS)) {
        ctx.fillStyle = '#5a8a3a'; ctx.fillRect(tx, GROUND_Y, TS, TS);
      }
      if (!this.drawTile('fp-tiles', 1, 1, tx, GROUND_Y + TS, TS, TS)) {
        ctx.fillStyle = '#3a5520'; ctx.fillRect(tx, GROUND_Y + TS, TS, TS);
      }
    }
  }

  drawCastle(side, castleData) {
    const ctx = this.ctx;
    const isP = side === 'player';
    const cx  = isP ? 45 : 855;
    const C   = CASTLE_DEF;
    const T   = C.tileSize;

    // 타일 단축 헬퍼 (null이면 컬러 폴백)
    const t = (def, fallback, x, y, w = T, h = T) => {
      const d = (def?.row != null) ? def : (fallback?.row != null ? fallback : null);
      if (!d) return; // null이면 아무것도 안 그림
      if (this.drawTile(d.sheet, d.row, d.col, x, y, w, h)) return;
      // 타일 로드 실패 시 컬러 폴백
      ctx.fillStyle = '#8a8270';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x, y, w, 2);
      ctx.fillRect(x, y, 2, h);
    };

    const GRID = C.grid;
    const ROWS = GRID.length;
    const COLS = Math.max(...GRID.map(r => r.length)); // 가장 긴 행 기준
    const castleW = COLS * T;
    const startX  = isP ? 0 : W - castleW;
    const startY  = GROUND_Y - (ROWS - 1) * T;
    const mH      = Math.round(T * 0.55);
    const gateCx  = startX + Math.floor(castleW / 2);

    const tileMap = {
      // 기본 벽
      'S':   (r, c, x, y) => t(C.stone,   C.stone, x, y),
      'EL':  (r, c, x, y) => t(C.endL,    C.stone, x, y),
      'ER':  (r, c, x, y) => t(C.endR,    C.stone, x, y),
      'ELR': (r, c, x, y) => t(C.endLR,   C.stone, x, y),
      // 망루 위
      'TTL': (r, c, x, y) => t(C.towerTL, C.stone, x, y),
      'TTC': (r, c, x, y) => t(C.towerTC, C.stone, x, y),
      'TTR': (r, c, x, y) => t(C.towerTR, C.stone, x, y),
      // 망루 중간
      'TML': (r, c, x, y) => t(C.towerML, C.stone, x, y),
      'TMC': (r, c, x, y) => t(C.towerMC, C.stone, x, y),
      'TMR': (r, c, x, y) => t(C.towerMR, C.stone, x, y),
      // 망루 아래
      'TBL': (r, c, x, y) => t(C.towerBL, C.stone, x, y),
      'TBC': (r, c, x, y) => t(C.towerBC, C.stone, x, y),
      'TBR': (r, c, x, y) => t(C.towerBR, C.stone, x, y),
      'TCC': (r, c, x, y) => t(C.towerCC, C.stone, x, y),
      'TCCC':(r, c, x, y) => t(C.towerCCC,C.stone, x, y),
      // 흉벽
      'M':   (r, c, x, y) => t(C.merlon,  C.stone, x, y, T, mH),
      // 게이트 (포트컬리스)
      'GL':  (r, c, x, y) => t(C.gate_l,  null, x, y),
      'GR':  (r, c, x, y) => t(C.gate_r,  null, x, y),
      'GUL': (r, c, x, y) => t(C.gate_Ul, null, x, y),
      'GUR': (r, c, x, y) => t(C.gate_Ur, null, x, y),
      // 아치 기단
      'AL':  (r, c, x, y) => t(C.arch_l,  null, x, y),
      'AM':  (r, c, x, y) => t(C.arch_m,  null, x, y),
      'AR':  (r, c, x, y) => t(C.arch_r,  null, x, y),
    };

    // ── 패스 1: ground 레이어 (아래 2줄, 성벽보다 먼저 그려야 뒤에 깔림) ──
    if (C.ground?.row != null) {
      for (let gr = ROWS - 2; gr < ROWS; gr++) {
        const py = startY + (gr - 1) * T;
        for (let c = 0; c < COLS; c++) {
          t(C.ground, null, startX + c * T, py);
        }
      }
    }

    // ── 패스 2: 성벽 그리드 (바닥 위에 덮임) ──
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < GRID[r].length; c++) {
        const cell = GRID[r][c];
        if (!cell || cell === ' ') continue;
        const px = startX + c * T;
        const py = r === 0
          ? startY - mH                      // 흉벽은 타워 위
          : startY + (r - 1) * T;            // 나머지는 row1부터 시작
        tileMap[cell]?.(r, c, px, py);
      }
    }

    // 게이트 폴백 (타일 없을 때만)
    if (!C.gate_l?.row && !C.arch_l?.row) {
      ctx.fillStyle = '#1a1008';
      ctx.beginPath();
      ctx.arc(gateCx, GROUND_Y - 14, 14, Math.PI, 0);
      ctx.rect(gateCx - 14, GROUND_Y - 14, 28, 14);
      ctx.fill();
    }

    // 깃발
    const flagX = isP ? startX + 2 : startX + castleW - 10;
    ctx.fillStyle = '#555';
    ctx.fillRect(flagX, startY - 28, 2, 28);
    ctx.fillStyle = isP ? '#3b82f6' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(flagX + 2, startY - 28);
    ctx.lineTo(flagX + 18, startY - 21);
    ctx.lineTo(flagX + 2,  startY - 14);
    ctx.fill();

    // HP 바
    if (castleData) {
      const ratio = Math.max(0, castleData.hp / castleData.maxHp);
      const bw = 100, bx = gateCx - 50, by = startY - mH - 20;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, by, bw, 10);
      ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#ef4444';
      ctx.fillRect(bx, by, bw * ratio, 10);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, 10);
    }

  }

  // 건설 페이즈: 타입한 유닛을 성 옆에 줄 세워서 표시
  drawBuildArmy(army, side, strategy = {}, silhouette = false) {
    const isP = side === 'player';
    const pos = WALL_POS[strategy.wallPos] || WALL_POS.mid;
    const wallX = isP ? pos.player : pos.enemy;
    let unitIdx = 0, buildIdx = 0;

    for (const def of army) {
      if (def.type === 'unit') {
        const col = unitIdx % 14;
        const row = Math.floor(unitIdx / 14);
        const x = isP ? 115 + col * 19 : 1085 - col * 19;
        const y = UNIT_Y - row * 26;
        this.drawMiniUnit(def.unitId, side, x, y, silhouette);
        unitIdx++;
      } else {
        const bdef = BUILDING_DEFS[def.buildingId];
        if (!bdef) continue;
        const bx = isP ? wallX - buildIdx * 34 : wallX + buildIdx * 34;
        if (bdef.tileGrid?.length) {
          const T = (bdef.tileSize || 16) * (bdef.scale || 2);
          const gridH = T * bdef.tileGrid.length;
          bdef.tileGrid.forEach((tile, i) => {
            this.drawTile(tile.sheet, tile.row, tile.col, bx - T / 2, UNIT_Y - gridH + i * T, T, T);
          });
        } else {
          this.ctx.fillStyle = bdef.color;
          this.ctx.fillRect(bx - 7, UNIT_Y - 22, 14, 22);
          this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
          this.ctx.fillRect(bx - 7, UNIT_Y - 22, 14, 4);
        }
        buildIdx++;
      }
    }
  }

  // sheet의 특정 타일을 잘라서 그림 (flip: 좌우반전)
  drawTile(sheet, tileRow, tileCol, dx, dy, dw, dh, flip = false) {
    if (tileRow === null || tileCol === null) return false;
    const s = this.sc.getSheet(sheet);
    if (!s) return false;
    const step = s.tileW + (s.spacing || 0);
    const sx = tileCol * step;
    const sy = tileRow * step;
    const ctx = this.ctx;
    if (flip) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(s.img, sx, sy, s.tileW, s.tileH, -dx - dw, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.drawImage(s.img, sx, sy, s.tileW, s.tileH, dx, dy, dw, dh);
    }
    return true;
  }

  drawMiniUnit(unitId, side, x, y, silhouette = false) {
    const def = UNIT_DEFS[unitId];
    if (!def) return;
    const w = def.size * 2, h = def.size * 2;
    const bx = x - w / 2, by = y - h;
    const color = side === 'player' ? def.color : def.enemyColor;
    const ctx = this.ctx;
    const flip = side === 'enemy';

    if (silhouette) {
      ctx.save();
      ctx.filter = 'brightness(0)';
      ctx.globalAlpha = 0.65;
    }

    // 캐릭터 그리기
    const directSrc = flip ? (def.enemySprite || def.sprite) : def.sprite;
    let drawn = false;
    if (directSrc) {
      const img = this.sc.get(directSrc);
      if (img) {
        if (def.animFrames) {
          // 빌드 페이즈: 항상 첫 프레임(idle) 표시
          drawn = this.drawAnimFrame(img, def.animFrames, 0, 'idle', bx, by, w, h, flip);
        } else if (flip && !def.enemySprite) {
          ctx.save(); ctx.scale(-1, 1);
          ctx.drawImage(img, -bx - w, by, w, h);
          ctx.restore();
          drawn = true;
        } else {
          ctx.drawImage(img, bx, by, w, h);
          drawn = true;
        }
      }
    }
    if (!drawn) {
      drawn = this.drawTile(def.sheet, def.tileRow, def.tileCol, bx, by, w, h, flip);
    }
    if (!drawn) {
      ctx.fillStyle = silhouette ? '#111' : color;
      ctx.fillRect(bx, by, w, h);
      if (!silhouette) {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(bx + w * 0.25, by + 2, w * 0.5, h * 0.38);
      }
    }

    if (silhouette) {
      ctx.restore();
    } else {
      // 무기는 실루엣 모드가 아닐 때만 그림
      this.drawWeapon(def.weaponSheet, def.weaponRow, def.weaponCol, bx, by, w, h, flip);
    }
  }

  // 스프라이트시트 프레임 애니메이션
  drawAnimFrame(img, animFrames, animTimer, state, dx, dy, dw, dh, flip) {
    const { cols = 2, rows = 2, walkFrames = [0], attackFrame, fps = 6 } = animFrames;
    let frameIdx;
    if (state === 'attack' && attackFrame != null) {
      frameIdx = attackFrame;
    } else if (state === 'idle') {
      frameIdx = walkFrames[0];
    } else {
      frameIdx = walkFrames[Math.floor(animTimer * fps) % walkFrames.length];
    }
    const frameW = img.width  / cols;
    const frameH = img.height / rows;
    const srcX = (frameIdx % cols) * frameW;
    const srcY = Math.floor(frameIdx / cols) * frameH;
    const ctx = this.ctx;
    if (flip) {
      ctx.save();
      ctx.translate(dx + dw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcX, srcY, frameW, frameH, 0, dy, dw, dh);
      ctx.restore();
    } else {1
      ctx.drawImage(img, srcX, srcY, frameW, frameH, dx, dy, dw, dh);
    }
    return true;
  }

  // 무기 오버레이 공통 메서드
  drawWeapon(sheet, row, col, unitX, unitY, unitW, unitH, flip) {
    if (sheet == null || row == null || col == null) return;
    const wSize = unitW * 0.75;
    const overlap = 0.6; // 유닛 안으로 겹치는 비율 (0=완전 바깥, 1=완전 안)
    // 아군/적군 대칭 공식
    const wx = flip
      ? unitX - wSize * (1 - overlap)   // 적군: 유닛 왼쪽 바깥
      : unitX + unitW - wSize * overlap; // 아군: 유닛 오른쪽 바깥
    const wy = unitY + unitH * 0.25;
    this.drawTile(sheet, row, col, wx, wy, wSize, wSize, !flip);
  }

  // 투사체 렌더링
  drawProjectile(p) {
    const ctx = this.ctx;

    // ── 픽셀아트 스프라이트 투사체 ──
    if (this.em?.loaded) {
      if (p.type === 'arrow') {
        const s = this.em.getArrowSrc(0, 1);
        if (s) {
          const angle = Math.atan2(p.vy, p.vx);
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          const dh = 28, dw = dh * (s.sw / s.sh);
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
          return;
        }
      } else if (p.type === 'holy') {
        const s = this.em.getHolyLoopSrc(p.elapsed);
        if (s) {
          const angle = Math.atan2(p.vy, p.vx);
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          const dh = 36, dw = dh * (s.sw / s.sh);
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
          return;
        }
      } else if (p.type === 'fire') {
        const img = this.em.getFrameLoop('round_explosion', p.elapsed, 14, 16);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, p.x - 40, p.y - 40, 80, 80);
          ctx.restore();
          return;
        }
      } else if (p.type === 'explosion') {
        const img = this.em.getFrameLoop('x_plosion', p.elapsed, 14, 10);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, p.x - 36, p.y - 36, 72, 72);
          ctx.restore();
          return;
        }
      } else if (p.type === 'magic') {
        const img = this.em.getFrameLoop('magic_bolt', p.elapsed, 12, 8);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, p.x - 36, p.y - 36, 72, 72);
          ctx.restore();
          return;
        }
      } else if (p.type === 'arcane') {
        // 마법사: 금색 볼트
        const s = this.em.getStripLoop('gold_bolt', p.elapsed, 14);
        if (s) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowBlur = 12; ctx.shadowColor = '#fbbf24';
          const angle = Math.atan2(p.vy, p.vx);
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          const dw = 52, dh = 28;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -dw/2, -dh/2, dw, dh);
          ctx.restore();
          return;
        }
      } else if (p.type === 'dark_magic') {
        // 리치: 보라 링
        const s = this.em.getStripLoop('purple_ring', p.elapsed, 12);
        if (s) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowBlur = 16; ctx.shadowColor = '#7c3aed';
          const sz = 50;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, p.x - sz/2, p.y - sz/2, sz, sz);
          ctx.restore();
          return;
        }
      } else if (p.type === 'curse') {
        // 79.png 보라 소용돌이 (row 1, 8cols, 9rows)
        const s = this.em.getFreeFrameLoop('free79', p.elapsed, 10, 8, 1, 9);
        if (s) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowBlur = 16; ctx.shadowColor = '#818cf8';
          const sz = 52;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, p.x - sz/2, p.y - sz/2, sz, sz);
          ctx.restore();
          return;
        }
      } else if (p.type === 'fire_arrow') {
        const s = this.em.getArrowSrc(0, 1);
        const angle = Math.atan2(p.vy, p.vx);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.shadowBlur = 18; ctx.shadowColor = '#ff6820';
        if (s) {
          const dh = 28, dw = dh * (s.sw / s.sh);
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, -dw/2, -dh/2, dw, dh);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = '#ff6820';
          ctx.beginPath(); ctx.arc(-dh/2 - 4, 0, 7, 0, Math.PI*2); ctx.fill();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#ffcc44';
          ctx.beginPath(); ctx.arc(-dh/2 - 10, 0, 4, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
        return;
      } else if (p.type === 'fireball') {
        // 용 브레스: round_explosion 스프라이트, fire보다 크게
        const img = this.em.getFrameLoop('round_explosion', p.elapsed, 14, 16);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowBlur = 24; ctx.shadowColor = '#ff4500';
          ctx.drawImage(img, p.x - 56, p.y - 56, 112, 112);
          ctx.restore();
          return;
        }
      } else if (p.type === 'fire_siege') {
        const img = this.em.getFrameLoop('round_explosion', p.elapsed, 14, 16);
        if (img) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, p.x-28, p.y-28, 56, 56);
          ctx.restore(); return;
        }
      } else if (p.type === 'ice') {
        // 72.png 파란 크리스탈 (row 2, 8cols, 9rows)
        const s = this.em.getFreeFrameLoop('free72', p.elapsed, 12, 8, 2, 9);
        if (s) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.shadowBlur = 14; ctx.shadowColor = '#67e8f9';
          const sz = 44;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, p.x - sz/2, p.y - sz/2, sz, sz);
          ctx.restore();
          return;
        }
      }
    }

    const color = PROJ_COLORS[p.type] || p.color || '#fff';

    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;

    if (p.type === 'lightning') {
      // 번개 볼트
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(p.x - 4, p.y - 8);
      ctx.lineTo(p.x + 2, p.y);
      ctx.lineTo(p.x - 2, p.y);
      ctx.lineTo(p.x + 4, p.y + 8);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'ice') {
      // 얼음 결정
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(a) * 7, p.y + Math.sin(a) * 7);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 기본: 발광 구체 (fire, explosion, magic)
      const r = p.type === 'explosion' ? 9 : 6;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      // 내부 하이라이트
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawArmyBadge(playerCount, enemyCount = 0) {
    const ctx = this.ctx;
    if (playerCount > 0) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(56, GROUND_Y - 155, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(playerCount, 56, GROUND_Y - 155);
    }
    if (enemyCount > 0) {
      ctx.fillStyle = 'rgba(60,60,60,0.85)';
      ctx.beginPath();
      ctx.arc(W - 56, GROUND_Y - 155, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', W - 56, GROUND_Y - 155);
    }
  }

  drawUnit(unit) {
    const ctx = this.ctx;
    const w = unit.animFrames?.renderW ?? unit.size * unit.scale;
    const h = unit.animFrames?.renderH ?? unit.size * unit.scale;

    // 공중 근접 유닛 다이브+기울기 애니메이션 (지상 타겟만)
    let yOff = unit.yOffset || 0;
    let diveAngle = 0;
    const isDiving = unit.traits?.includes('flying')
      && unit.attackAnimTimer > 0
      && yOff < 0
      && !unit.attackTargetFlying  // 공중 타겟 공격 시 다이브 없음
      && (unit.range || 0) < 40;   // 근접 공중 유닛만

    if (isDiving) {
      const maxT = Math.min(0.4, (unit.cooldown || 1) * 0.35);
      const t    = unit.attackAnimTimer / maxT;     // 1→0
      const dive = Math.sin(t * Math.PI);           // 0→1→0
      yOff       = yOff * (1 - dive);               // -44→0→-44
      // 기울기: 플레이어는 오른쪽(전방), 적은 왼쪽
      diveAngle  = (unit.side === 'player' ? 1 : -1) * dive * 0.5;
    }

    const x = unit.x - w / 2;
    const y = unit.y - h + (unit.walkBob || 0) + yOff;
    const color = unit.side === 'player' ? unit.color : unit.enemyColor;

    const flip = unit.side === 'enemy';

    // 공중 유닛 그림자 (다이브 중엔 그림자 진해짐)
    if (unit.traits?.includes('flying')) {
      const baseY   = unit.yOffset || 0;
      const diveAmt = baseY !== 0 ? (yOff - baseY) / (0 - baseY) : 0; // 0=공중, 1=지면
      const alpha   = 0.12 + diveAmt * 0.25;
      const scaleX  = 0.5 + diveAmt * 0.3;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.ellipse(unit.x, unit.y - 2, w * scaleX, 3 + diveAmt * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 다이브 기울기 transform
    if (diveAngle !== 0) {
      ctx.save();
      ctx.translate(unit.x, unit.y - h / 2 + yOff);
      ctx.rotate(diveAngle);
      ctx.translate(-unit.x, -(unit.y - h / 2 + yOff));
    }

    // 유체화 중: 반투명 + 파란 글로우
    const isPhased = unit.ability === 'phase' && unit.phased;
    if (isPhased) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.shadowBlur = 14;
      ctx.shadowColor = '#a5f3fc';
    }

    // 캐릭터 그리기
    let drawn = false;
    const directSrc = flip ? (unit.enemySprite || unit.sprite) : unit.sprite;
    if (directSrc) {
      const img = this.sc.get(directSrc);
      if (img) {
        if (unit.animFrames) {
          drawn = this.drawAnimFrame(img, unit.animFrames, unit.animTimer, unit.state, x, y, w, h, flip);
        } else if (flip && !unit.enemySprite) {
          ctx.save(); ctx.scale(-1, 1);
          ctx.drawImage(img, -x - w, y, w, h);
          ctx.restore();
          drawn = true;
        } else {
          ctx.drawImage(img, x, y, w, h);
          drawn = true;
        }
      }
    }
    if (!drawn) {
      drawn = this.drawTile(unit.sheet, unit.tileRow, unit.tileCol, x, y, w, h, flip);
    }
    if (!drawn) {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + w * 0.25, y + h * 0.05, w * 0.5, h * 0.38);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + w * 0.3, y + h * 0.15, w * 0.12, h * 0.1);
      ctx.fillRect(x + w * 0.55, y + h * 0.15, w * 0.12, h * 0.1);
    }

    // 무기는 항상 캐릭터 위에 그림
    this.drawWeapon(unit.weaponSheet, unit.weaponRow, unit.weaponCol, x, y, w, h, flip);

    // HP 바
    if (unit.hp < unit.maxHp) {
      const ratio = unit.hp / unit.maxHp;
      ctx.fillStyle = '#333';
      ctx.fillRect(x, y - 5, w, 3);
      ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#ef4444';
      ctx.fillRect(x, y - 5, w * ratio, 3);
    }

    // charm_aura: 분홍 오라 원
    if (unit.ability === 'charm_aura') {
      const range = unit.abilityData?.range || 90;
      ctx.save();
      ctx.globalAlpha = 0.10 + Math.sin(Date.now() / 400) * 0.04;
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(unit.x, unit.y - h / 2, range, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 상태이상 / 어빌리티 시각화
    const debuffs = unit.debuffs || [];
    if (debuffs.some(d => d.source === 'egg')) {
      // 끈적임: 노란 테두리
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 2; ctx.globalAlpha = 0.8;
      ctx.strokeRect(x, y, w, h); ctx.globalAlpha = 1;
    }
    if (debuffs.some(d => d.type === 'charmed')) {
      // 매혹: 분홍 테두리
      ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
      ctx.strokeRect(x, y, w, h); ctx.globalAlpha = 1;
    }
    if (debuffs.some(d => d.type === 'life_steal_reduce')) {
      // 신성 디버프 (피흡 감소): 황금 점선 테두리
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2;
      ctx.setLineDash([3, 2]); ctx.globalAlpha = 0.9;
      ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    if (debuffs.some(d => d.type === 'atk_mult' && d.source === 'shaman')) {
      // 저주 (주술사 디버프): 보라 테두리
      ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
      ctx.strokeRect(x, y, w, h); ctx.globalAlpha = 1;
    }
    if (unit.ability === 'rage' && unit.enraged) {
      // rage 발동: 빨간 글로우 오라
      ctx.save();
      ctx.shadowBlur = 16; ctx.shadowColor = '#ef4444';
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 120) * 0.2;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      ctx.restore();
    }
    if (unit.ability === 'regen') {
      // 재생: 녹색 미세 글로우
      ctx.save();
      ctx.shadowBlur = 8; ctx.shadowColor = '#4ade80';
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4 + Math.sin(Date.now() / 600) * 0.15;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    if (isPhased)    ctx.restore();
    if (diveAngle !== 0) ctx.restore();
  }

  drawCat(cat) {
    const size = 48;
    const x = cat.x - size / 2;
    const y = cat.y - size;
    const bob = Math.sin(Date.now() / 150) * 2;
    this.drawTile(cat.sheet, cat.tileRow, cat.tileCol, x, y + bob, size, size, false);
    // aura 범위 표시 (분홍 반투명 원)
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.12 + Math.sin(Date.now() / 400) * 0.05;
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(cat.x, cat.y - size / 2, cat.auraRange, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBuilding(b) {
    const ctx = this.ctx;

    if (b.tileGrid?.length) {
      // 타일 그리드 렌더링 (성벽 등)1
      const T = (b.tileSize || 16) * (b.scale || 2);
      const totalH = T * b.tileGrid.length;
      const bx = b.x - T / 2;
      const baseY = b.y - totalH;

      for (let i = 0; i < b.tileGrid.length; i++) {
        const tile = b.tileGrid[i];
        this.drawTile(tile.sheet, tile.row, tile.col, bx, baseY + i * T, T, T);
      }

      // HP 바
      if (b.hp < b.maxHp) {
        const ratio = b.hp / b.maxHp;
        ctx.fillStyle = '#333';
        ctx.fillRect(bx, baseY - 6, T, 4);
        ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#ef4444';
        ctx.fillRect(bx, baseY - 6, T * ratio, 4);
      }
      return;
    }

    // 단일 타일 렌더링 (망루 등)
    const w = b.size * b.scale, h = b.size * b.scale;
    const x = b.x - w / 2, y = b.y - h;

    const drawn = this.drawTile(b.sheet, b.tileRow, b.tileCol, x, y, w, h);
    if (!drawn) {
      ctx.fillStyle = b.color;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y, w, 4);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.name, b.x, y - 3);
  }

  drawEffect(e) {
    const ctx = this.ctx;

    // ── 픽셀아트 충돌 이펙트 ──
    if (this.em?.loaded && e.maxTimer) {
      const progress = Math.min(1, 1 - e.timer / e.maxTimer);
      if (e.type === 'fire') {
        const img = this.em.getFrame('round_explosion', progress);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, e.x - 64, e.y - 64, 128, 128);
          ctx.restore();
          return;
        }
      } else if (e.type === 'explosion') {
        const img = this.em.getFrame('x_plosion', progress);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, e.x - 80, e.y - 80, 160, 160);
          ctx.restore();
          return;
        }
      } else if (e.type === 'lightning') {
        const img = this.em.getFrame('lightning_strike', progress);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          // 수직 볼트 — 위에서 아래로 내리꽂히는 느낌
          ctx.drawImage(img, e.x - 36, e.y - 140, 72, 160);
          ctx.restore();
          return;
        }
      } else if (e.type === 'magic') {
        const img = this.em.getFrame('magic_impact', progress);
        if (img) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          // VFX5: 양쪽 볼트 — 가로로 넓게
          ctx.drawImage(img, e.x - 100, e.y - 55, 200, 110);
          ctx.restore();
          return;
        }
      }
    }

    const a = Math.max(0, e.timer / 0.6);
    const color = EFFECT_COLORS[e.type] || '#fff';
    ctx.save();

    if (e.type === 'lightning') {
      // 번개: 볼트 + 플래시
      ctx.globalAlpha = a;
      ctx.shadowBlur = 20; ctx.shadowColor = color;
      ctx.strokeStyle = color; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(e.x,     e.y - 45);
      ctx.lineTo(e.x + 6, e.y - 22);
      ctx.lineTo(e.x - 5, e.y - 10);
      ctx.lineTo(e.x + 4, e.y + 12);
      ctx.stroke();
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(e.x, e.y, 24, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'explosion') {
      // 76.png 오렌지 대형 폭발 (row 0, 10cols, 9rows)
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = this.em.getFreeFrame('free76', progress, 10, 0, 9);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          ctx.shadowBlur = 24; ctx.shadowColor = '#fbbf24';
          const sz = 110;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - sz/2, e.y - sz/2, sz, sz);
          ctx.restore(); return;
        }
      }
      // fallback
      ctx.globalAlpha = a;
      ctx.shadowBlur = 24; ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(e.x, e.y, 10 + (1 - a) * 28, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(e.x, e.y, 18 + (1 - a) * 18, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'ice') {
      // 63.png 파란 별 파티클 (row 2, 7cols, 9rows)
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = this.em.getFreeFrame('free63', progress, 7, 2, 9);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          ctx.shadowBlur = 16; ctx.shadowColor = '#67e8f9';
          const sz = 80;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - sz/2, e.y - sz/2, sz, sz);
          ctx.restore(); return;
        }
      }
      // fallback
      ctx.globalAlpha = a;
      ctx.shadowBlur = 16; ctx.shadowColor = color;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      const r = 8 + (1 - a) * 18;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(angle) * r, e.y + Math.sin(angle) * r);
        ctx.stroke();
      }
      ctx.fillStyle = color; ctx.globalAlpha = a * 0.5;
      ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'magic') {
      // 마법: 회전 링 (fallback — magic_impact는 위에서 처리됨)
      ctx.globalAlpha = a;
      ctx.shadowBlur = 18; ctx.shadowColor = color;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      const rr = 12 + (1 - a) * 16;
      ctx.beginPath(); ctx.arc(e.x, e.y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x, e.y, rr * 0.5, 0, Math.PI * 2); ctx.stroke();

    } else if (e.type === 'arrow_hit') {
      // 화살 피격 애니메이션
      if (this.em?.loaded) {
        const progress = e.maxTimer > 0 ? 1 - e.timer / e.maxTimer : 1;
        const s = this.em.getArrowImpactSrc(progress, 0);
        if (s) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          const sz = 72;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - sz / 2, e.y - sz / 2, sz, sz);
          ctx.restore();
          return;
        }
      }

    } else if (e.type === 'holy') {
      // Holy VFX 01 Impact 스프라이트 (7프레임)
      if (this.em?.loaded) {
        const progress = e.maxTimer > 0 ? 1 - e.timer / e.maxTimer : 1;
        const s = this.em.getHolyImpactSrc(progress);
        if (s) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          const sz = 110;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - sz / 2, e.y - sz / 2, sz, sz);
          ctx.restore();
          return;
        }
      }
      // fallback: 황금 십자 방사
      ctx.globalAlpha = a;
      ctx.shadowBlur = 20; ctx.shadowColor = '#fef08a';
      ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 2.5;
      const hr = 10 + (1 - a) * 22;
      ctx.beginPath(); ctx.arc(e.x, e.y, hr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      const arm = 14 + (1 - a) * 10;
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(ang) * 4, e.y + Math.sin(ang) * 4);
        ctx.lineTo(e.x + Math.cos(ang) * arm, e.y + Math.sin(ang) * arm);
        ctx.stroke();
      }
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'poison') {
      // 독: 보라/초록 거품 방울
      ctx.globalAlpha = a;
      ctx.shadowBlur = 12; ctx.shadowColor = '#86efac';
      const bubblePos = [[-7, -5], [5, -8], [0, 4], [-4, 9], [8, 2]];
      for (const [bx, by] of bubblePos) {
        const r = 3 + Math.abs(bx + by) % 3;
        ctx.fillStyle = Math.abs(bx) % 2 === 0 ? '#86efac' : '#a78bfa';
        ctx.beginPath();
        ctx.arc(e.x + bx * (1 + (1 - a) * 1.5), e.y + by * (1 + (1 - a) * 1.5), r, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (e.type === 'heal') {
      // 힐: 금색 불꽃 스프라이트
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = this.em.getStrip('heal_flame', progress);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          const rise = (1 - Math.max(0, e.timer / e.maxTimer)) * 14;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - 20, e.y - 40 - rise, 40, 40);
          ctx.restore(); return;
        }
      }
      // fallback
      const rise = (1 - a) * 18;
      ctx.globalAlpha = a;
      ctx.shadowBlur = 10; ctx.shadowColor = '#4ade80';
      ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(e.x - 6, e.y - rise); ctx.lineTo(e.x + 6, e.y - rise); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(e.x, e.y - rise - 6); ctx.lineTo(e.x, e.y - rise + 6); ctx.stroke();

    } else if (e.type === 'egg') {
      // 달걀 스플랫: 노른자 원 + 흰자 번짐
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath(); ctx.ellipse(e.x, e.y, 18 + (1-a)*14, 12 + (1-a)*10, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'heart') {
      // 하트: 매혹 스프라이트
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = this.em.getStrip('hearts_spell', progress);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          const rise = progress * 16;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - 24, e.y - 48 - rise, 48, 48);
          ctx.restore(); return;
        }
      }
      // fallback
      ctx.globalAlpha = a;
      ctx.fillStyle = '#f472b6';
      ctx.shadowBlur = 10; ctx.shadowColor = '#f472b6';
      const hs = 1 + (1 - a) * 0.5;
      ctx.save(); ctx.translate(e.x, e.y); ctx.scale(hs, hs);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.bezierCurveTo(-10, -14, -20, -4, 0, 8);
      ctx.bezierCurveTo(20, -4, 10, -14, 0, -4);
      ctx.fill(); ctx.restore();

    } else if (e.type === 'arcane') {
      // 마법사 피격: 금빛 burst
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = this.em.getStrip('gold_bolt', progress);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          ctx.shadowBlur = 18; ctx.shadowColor = '#fbbf24';
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - 44, e.y - 28, 88, 56);
          ctx.restore(); return;
        }
      }
      ctx.globalAlpha = a; ctx.shadowBlur = 18; ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(e.x, e.y, 12 + (1-a)*14, 0, Math.PI*2); ctx.fill();

    } else if (e.type === 'dark_magic') {
      // 리치 피격: 보라 링 → 다크 블롭
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = progress < 0.5
          ? this.em.getStrip('purple_ring', progress * 2)
          : this.em.getStrip('dark_blob', (progress - 0.5) * 2);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          ctx.shadowBlur = 20; ctx.shadowColor = '#7c3aed';
          const sz = progress < 0.5 ? 80 : 88;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - sz/2, e.y - sz/2, sz, sz);
          ctx.restore(); return;
        }
      }
      ctx.globalAlpha = a; ctx.shadowBlur = 22; ctx.shadowColor = '#7c3aed';
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath(); ctx.arc(e.x, e.y, 14 + (1-a)*18, 0, Math.PI*2); ctx.fill();

    } else if (e.type === 'curse') {
      // 77.png 보라 원형 폭발 (row 1, 10cols, 9rows)
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const s = this.em.getFreeFrame('free77', progress, 10, 1, 9);
        if (s) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer);
          ctx.shadowBlur = 20; ctx.shadowColor = '#818cf8';
          const sz = 96;
          ctx.drawImage(s.img, s.sx, s.sy, s.sw, s.sh, e.x - sz/2, e.y - sz/2, sz, sz);
          ctx.restore(); return;
        }
      }
      ctx.globalAlpha = a; ctx.shadowBlur = 14; ctx.shadowColor = '#818cf8';
      ctx.strokeStyle = '#818cf8'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y, 14 + (1-a)*14, 0, Math.PI*2); ctx.stroke();

    } else if (e.type === 'claw') {
      const img = this.em?.images?.beastClaw;
      if (img) {
        const a = Math.max(0, e.timer / e.maxTimer);
        const scale = 0.6 + (1 - a) * 0.5;
        const sz = 110 * scale;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = a;
        if (e.flip) {
          ctx.translate(e.x + sz / 2, e.y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
        } else {
          ctx.drawImage(img, e.x - sz / 2, e.y - sz / 2, sz, sz);
        }
        ctx.restore();
        return;
      }
      // fallback: 슬래시로
    } else if (e.type === 'slash') {
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const frames = this.em.frames.slash;
        if (frames?.length) {
          const fi = Math.min(Math.floor(progress * frames.length), frames.length - 1);
          const img = frames[fi];
          if (img) {
            const sz = 96;
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = Math.max(0, e.timer / e.maxTimer) * 1.4;
            if (e.flip) {
              ctx.translate(e.x + sz / 2, e.y);
              ctx.scale(-1, 1);
              ctx.drawImage(img, -sz / 2, -sz / 2, sz, sz);
            } else {
              ctx.drawImage(img, e.x - sz / 2, e.y - sz / 2, sz, sz);
            }
            ctx.restore();
            return;
          }
        }
      }
      // fallback: 흰 선
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#fff8dc'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.shadowBlur = 10; ctx.shadowColor = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(e.x - 20, e.y - 12); ctx.lineTo(e.x + 20, e.y + 12);
      ctx.stroke();

    } else if (e.type === 'fire_arrow') {
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const img = this.em.getFrame('round_explosion', progress);
        if (img) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, e.x - 48, e.y - 48, 96, 96);
          ctx.restore(); return;
        }
      }
      ctx.globalAlpha = a; ctx.shadowBlur = 14; ctx.shadowColor = '#ff6820';
      ctx.fillStyle = '#ff6820';
      ctx.beginPath(); ctx.arc(e.x, e.y, 10 + (1-a)*14, 0, Math.PI*2); ctx.fill();

    } else if (e.type === 'fireball') {
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const img = this.em.getFrame('round_explosion', progress);
        if (img) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, e.x - 110, e.y - 110, 220, 220);
          ctx.restore(); return;
        }
      }
      ctx.globalAlpha = a; ctx.shadowBlur = 32; ctx.shadowColor = '#ff4500';
      ctx.fillStyle = '#ff4500';
      ctx.beginPath(); ctx.arc(e.x, e.y, 18 + (1-a)*34, 0, Math.PI*2); ctx.fill();

    } else if (e.type === 'fire_siege') {
      if (this.em?.loaded && e.maxTimer) {
        const progress = Math.min(1, 1 - e.timer / e.maxTimer);
        const img = this.em.getFrame('round_explosion', progress);
        if (img) {
          ctx.save(); ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, e.x - 90, e.y - 56, 180, 112);
          ctx.restore(); return;
        }
      }
      ctx.globalAlpha = a; ctx.shadowBlur = 22; ctx.shadowColor = '#ff5c00';
      ctx.fillStyle = '#ff5c00';
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, 24 + (1-a)*30, 14 + (1-a)*16, 0, 0, Math.PI*2);
      ctx.fill();

    } else {
      // fire / arrow / block / 기본: 발광 원
      ctx.globalAlpha = a;
      ctx.shadowBlur = 16; ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(e.x, e.y, 14 + (1 - a) * 22, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  }
}
