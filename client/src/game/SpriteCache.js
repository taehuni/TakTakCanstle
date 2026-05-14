// tilemap_packed.png 기준 (spacing 없음)
export const SHEETS = {
  'tiny-battle': {
    src: '/assets/sprites/kenney_tiny-battle/Tilemap/tilemap_packed.png',
    cols: 18, tileW: 16, tileH: 16, spacing: 0,
  },
  'tiny-town': {
    src: '/assets/sprites/kenney_tiny-town/Tilemap/tilemap_packed.png',
    cols: 12, tileW: 16, tileH: 16, spacing: 0,
  },
  'tiny-creatures': {
    src: '/assets/sprites/tiny-creatures/Tilemap/tilemap_packed.png',
    cols: 10, tileW: 16, tileH: 16, spacing: 0,
  },
  // 던전 시트: 캐릭터(사람) + 무기 포함. 1px 간격 있음
  // 구성: 상단(row 0~2) 던전환경타일 / 중간(row 3~6) 캐릭터 / 하단(row 7~10) 무기·아이템
  'tiny-dungeon': {
    src: '/assets/sprites/tiny-creatures/Tilemap/Kenney_tiny_dungeon.png',
    cols: 12, tileW: 16, tileH: 16, spacing: 1,
  },
  // TinyPackAddOn (Szym games): 아이템·캐릭터·몬스터·무기 확장팩
  // 구성: row 0~3 아이템 / row 4~7 캐릭터 / row 8~11 몬스터 / row 12~15 무기
  'tiny-addon': {
    src: '/assets/sprites/TinyPackAddOn/Sprites-16x16.png',
    cols: 12, tileW: 16, tileH: 16, spacing: 0,
  },
  'grasstop': {
    src: '/assets/sprites/Grasstop.png',
    cols: 6, tileW: 32, tileH: 32, spacing: 0,
  },
  'gandalf-floor': {
    src: '/assets/sprites/GandalfHardcore FREE Platformer Assets/Floor Tiles1.png',
    cols: 3, tileW: 96, tileH: 96, spacing: 0,
  },
  'fp-tiles': {
    src: '/assets/sprites/FreePlatformerNA/Foreground/Tileset.png',
    cols: 10, tileW: 16, tileH: 16, spacing: 0,
  },
};

export class SpriteCache {
  constructor() {
    this.images = {};
    this.failed = new Set();
  }

  async preloadSheets() {
    await Promise.allSettled(
      Object.values(SHEETS).map(s => this.load(s.src))
    );
  }

  // 개별 PNG 경로 목록 미리 로드 (tanks 같은 팩용)
  async preloadSprites(paths) {
    await Promise.allSettled(paths.filter(Boolean).map(p => this.load(p)));
  }

  load(src) {
    if (!src) return Promise.reject();
    if (this.images[src]) return Promise.resolve(this.images[src]);
    if (this.failed.has(src)) return Promise.reject();
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => { this.images[src] = img; resolve(img); };
      img.onerror = () => { this.failed.add(src); reject(); };
      img.src = src;
    });
  }

  // sheet 이름으로 이미지 + 메타 반환
  getSheet(name) {
    const def = SHEETS[name];
    if (!def) return null;
    const img = this.images[def.src];
    if (!img) return null;
    return { img, ...def };
  }

  get(src) {
    return this.images[src] || null;
  }
}
