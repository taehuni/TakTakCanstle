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
};

const PROJ_COLORS = {
  fire: '#fb923c', lightning: '#fde047', ice: '#67e8f9',
  explosion: '#ef4444', magic: '#c084fc', arrow: '#d4a574',
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
    this.drawBuildArmy(phase.enemyArmy, 'enemy', strategy);
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
    phase.flyingWords.forEach(fw => this.drawFlyingWord(fw));
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
  drawBuildArmy(army, side, strategy = {}) {
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
        this.drawMiniUnit(def.unitId, side, x, y);
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

  drawMiniUnit(unitId, side, x, y) {
    const def = UNIT_DEFS[unitId];
    if (!def) return;
    const w = def.size * 2, h = def.size * 2;
    const bx = x - w / 2, by = y - h;
    const color = side === 'player' ? def.color : def.enemyColor;
    const ctx = this.ctx;
    const flip = side === 'enemy';

    // 캐릭터 그리기
    const directSrc = flip ? (def.enemySprite || def.sprite) : def.sprite;
    let drawn = false;
    if (directSrc) {
      const img = this.sc.get(directSrc);
      if (img) {
        if (flip && !def.enemySprite) {
          ctx.save(); ctx.scale(-1, 1);
          ctx.drawImage(img, -bx - w, by, w, h);
          ctx.restore();
        } else {
          ctx.drawImage(img, bx, by, w, h);
        }
        drawn = true;
      }
    }
    if (!drawn) {
      drawn = this.drawTile(def.sheet, def.tileRow, def.tileCol, bx, by, w, h, flip);
    }
    if (!drawn) {
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(bx + w * 0.25, by + 2, w * 0.5, h * 0.38);
    }

    // 무기는 항상 캐릭터 위에 그림
    this.drawWeapon(def.weaponSheet, def.weaponRow, def.weaponCol, bx, by, w, h, flip);
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
      if (p.type === 'fire') {
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
      }
    }

    const color = PROJ_COLORS[p.type] || p.color || '#fff';

    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = color;

    if (p.type === 'arrow') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x - 12, p.y);
      ctx.lineTo(p.x + 4, p.y);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(p.x + 8, p.y);
      ctx.lineTo(p.x, p.y - 4);
      ctx.lineTo(p.x, p.y + 4);
      ctx.fill();
    } else if (p.type === 'lightning') {
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

  drawArmyBadge(playerCount, enemyCount) {
    const ctx = this.ctx;
    const draw = (x, count, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, GROUND_Y - 155, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(count, x, GROUND_Y - 155);
    };
    if (playerCount > 0) draw(56, playerCount, '#3b82f6');
    if (enemyCount > 0)  draw(1144, enemyCount, '#ef4444');
  }

  drawUnit(unit) {
    const ctx = this.ctx;
    const w = unit.size * unit.scale;
    const h = unit.size * unit.scale;
    const x = unit.x - w / 2;
    const y = unit.y - h + (unit.walkBob || 0); // 걷기 bob 적용
    const color = unit.side === 'player' ? unit.color : unit.enemyColor;

    const flip = unit.side === 'enemy';

    // 캐릭터 그리기
    let drawn = false;
    const directSrc = flip ? (unit.enemySprite || unit.sprite) : unit.sprite;
    if (directSrc) {
      const img = this.sc.get(directSrc);
      if (img) {
        if (flip && !unit.enemySprite) {
          ctx.save(); ctx.scale(-1, 1);
          ctx.drawImage(img, -x - w, y, w, h);
          ctx.restore();
        } else {
          ctx.drawImage(img, x, y, w, h);
        }
        drawn = true;
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
  }

  drawBuilding(b) {
    const ctx = this.ctx;

    if (b.tileGrid?.length) {
      // 타일 그리드 렌더링 (성벽 등)
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

  drawFlyingWord(fw) {
    const ctx = this.ctx;
    ctx.font = 'bold 15px "Noto Sans KR", sans-serif';
    const tw = ctx.measureText(fw.word).width;
    const pad = 7, bw = tw + pad * 2, bh = 26;
    const bx = fw.x - bw / 2, by = fw.y - bh / 2;

    ctx.fillStyle = 'rgba(180, 20, 20, 0.88)';
    ctx.beginPath();
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();

    ctx.strokeStyle = '#ff9090';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fw.word, fw.x, fw.y);
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
      // 폭발: 이중 원 + 파편
      ctx.globalAlpha = a;
      ctx.shadowBlur = 24; ctx.shadowColor = '#fbbf24';
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(e.x, e.y, 10 + (1 - a) * 28, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(e.x, e.y, 18 + (1 - a) * 18, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'ice') {
      // 얼음: 결정 방사형
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
      ctx.fillStyle = color;
      ctx.globalAlpha = a * 0.5;
      ctx.beginPath(); ctx.arc(e.x, e.y, 7, 0, Math.PI * 2); ctx.fill();

    } else if (e.type === 'magic') {
      // 마법: 회전 링
      ctx.globalAlpha = a;
      ctx.shadowBlur = 18; ctx.shadowColor = color;
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      const rr = 12 + (1 - a) * 16;
      ctx.beginPath(); ctx.arc(e.x, e.y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(e.x, e.y, rr * 0.5, 0, Math.PI * 2); ctx.stroke();

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
