const BASE_EXP   = '/assets/effect/wills_pixel_explosions_sample';
const BASE_BOLT  = '/assets/effect/Pixel Art Skill Animations - Lightning';
const BASE_HOLY  = '/assets/effect/Holy VFX 01-02/Holy VFX 01';
const BASE_ARROW = '/assets/effect';
const BASE_MAGIC = '/assets/effect/free-pixel-magic-sprite-effects-pack/1 Magic';
const BASE_SLASH = '/assets/effect/Slash Export';
const BASE_FREE  = '/assets/effect/Free';

export class EffectManager {
  constructor() {
    this.frames  = {};
    this.images  = {};
    this.strips  = {};
    this.loaded  = false;
  }

  async preload() {
    const load = src => new Promise(res => {
      const img = new Image();
      img.onload  = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

    const pad = n => String(n).padStart(4, '0');

    const pad2 = n => String(n).padStart(2, '0');

    const [
      rFrames, xFrames, ltStrike, magicBolt, magicImpact,
      arrowsSheet, arrowImpactSheet,
      holyLoopSheet, holyImpactSheet,
      // ── 새 마법 스프라이트 팩 ──
      m1, m2, m3, m4, m5, m6, m7, m9,
      // ── 슬래시 (근접 공격) ──
      slashFrames,
      // ── 주술사 저주 ──
      m4_2,
      free77, free79, free63, free72, free76,
      beastClaw,
    ] = await Promise.all([
      Promise.all(Array.from({ length: 69 }, (_, i) =>
        load(`${BASE_EXP}/round_explosion/PNG/frame${pad(i + 2)}.png`))),
      Promise.all(Array.from({ length: 64 }, (_, i) =>
        load(`${BASE_EXP}/X_plosion/PNG/frame${pad(i)}.png`))),
      Promise.all(Array.from({ length: 5 }, (_, i) =>
        load(`${BASE_BOLT}/VFX3/Frames/lightning_skill3_frame${i + 1}.png`))),
      Promise.all(Array.from({ length: 5 }, (_, i) =>
        load(`${BASE_BOLT}/VFX4/Frames/lightning_skill4_frame${i + 1}.png`))),
      Promise.all(Array.from({ length: 4 }, (_, i) =>
        load(`${BASE_BOLT}/VFX5/Frames/lightning_skill5_frame${i + 1}.png`))),
      load(`${BASE_ARROW}/Arrows_pack.png`),
      load(`${BASE_ARROW}/Arrow_impact_pack.png`),
      load(`${BASE_HOLY}/Holy VFX 01 Repeatable.png`),
      load(`${BASE_HOLY}/Holy VFX 01 Impact.png`),
      // 마법 팩
      load(`${BASE_MAGIC}/1.png`),
      load(`${BASE_MAGIC}/2.png`),
      load(`${BASE_MAGIC}/3.png`),
      load(`${BASE_MAGIC}/4.png`),
      load(`${BASE_MAGIC}/5.png`),
      load(`${BASE_MAGIC}/6.png`),
      load(`${BASE_MAGIC}/7.png`),
      load(`${BASE_MAGIC}/9.png`),
      // 슬래시 (type 1 = 수평 대각)
      Promise.all(Array.from({ length: 35 }, (_, i) =>
        load(`${BASE_SLASH}/1 - ${pad2(i)}.png`))),
      // 주술사 저주 파티클
      load(`${BASE_MAGIC}/4_2.png`),
      // 야수 발톱 이펙트
      load('/assets/beast.png'),
      // Free 팩
      load(`${BASE_FREE}/77.png`),  // 원형 폭발 — 주술사 피격
      load(`${BASE_FREE}/79.png`),  // 소용돌이 — 주술사 투사체
      load(`${BASE_FREE}/63.png`),  // 별 파티클 — 얼음 피격
      load(`${BASE_FREE}/72.png`),  // 크리스탈 — 얼음 투사체
      load(`${BASE_FREE}/76.png`),  // 대형 폭발 — explosion 강화
    ]);

    this.frames.round_explosion  = rFrames.filter(Boolean);
    this.frames.x_plosion        = xFrames.filter(Boolean);
    this.frames.lightning_strike = ltStrike.filter(Boolean);
    this.frames.magic_bolt       = magicBolt.filter(Boolean);
    this.frames.magic_impact     = magicImpact.filter(Boolean);
    this.frames.slash            = slashFrames.filter(Boolean);

    this.images.arrows      = arrowsSheet;
    this.images.arrowImpact = arrowImpactSheet;
    this.images.holyLoop    = holyLoopSheet;
    this.images.holyImpact  = holyImpactSheet;

    // 스트립: frames = width / height (정사각 프레임 가정)
    const mkStrip = (img, framesOverride) => {
      if (!img) return null;
      const frames = framesOverride ?? Math.max(1, Math.round(img.width / img.height));
      return { img, frames };
    };
    this.strips.fire_burst   = mkStrip(m1, 8);
    this.strips.purple_ring  = mkStrip(m2, 8);
    this.strips.gold_bolt    = mkStrip(m3);
    this.strips.hearts_spell = mkStrip(m4, 8);
    this.strips.heal_flame   = mkStrip(m5, 4);
    this.strips.blue_slash   = mkStrip(m6);
    this.strips.green_curse  = mkStrip(m7);
    this.strips.dark_blob    = mkStrip(m9, 5);
    this.strips.hex_burst    = mkStrip(m4_2, 4);
    // Free 팩: 9색상 행 구조 (보라 = row 1)
    // 흰 배경 제거: 밝은 픽셀을 투명하게 처리
    if (beastClaw) {
      const oc  = document.createElement('canvas');
      oc.width  = beastClaw.width;
      oc.height = beastClaw.height;
      const oc2 = oc.getContext('2d');
      oc2.drawImage(beastClaw, 0, 0);
      const id  = oc2.getImageData(0, 0, oc.width, oc.height);
      const d   = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const whiteness = Math.min(d[i], d[i+1], d[i+2]) / 255;
        d[i+3] = Math.round(d[i+3] * (1 - whiteness));
      }
      oc2.putImageData(id, 0, 0);
      this.images.beastClaw = oc;
    }
    this.images.free77 = free77;  // 원형 폭발 (주술사 피격), 10cols
    this.images.free79 = free79;  // 소용돌이 (주술사 투사체), 8cols
    this.images.free63 = free63;  // 별 파티클 (얼음 피격), 7cols
    this.images.free72 = free72;  // 크리스탈 (얼음 투사체), 8cols
    this.images.free76 = free76;  // 대형 폭발, 10cols

    this.loaded = true;
  }

  // ── 프레임 배열용 (기존) ──────────────────────────
  getFrame(key, progress) {
    const frames = this.frames[key];
    if (!frames?.length) return null;
    const idx = Math.min(Math.floor(progress * frames.length), frames.length - 1);
    return frames[idx];
  }

  getFrameLoop(key, elapsed, fps = 14, loopCount = 14) {
    const frames = this.frames[key];
    if (!frames?.length) return null;
    const count = Math.min(loopCount, frames.length);
    return frames[Math.floor(elapsed * fps) % count];
  }

  // ── 스트립 슬라이서 ───────────────────────────────
  // progress 0→1 (한번 재생)
  getStrip(key, progress) {
    const s = this.strips[key];
    if (!s) return null;
    const fw = s.img.width / s.frames;
    const fi = Math.min(Math.floor(progress * s.frames), s.frames - 1);
    return { img: s.img, sx: fi * fw, sy: 0, sw: fw, sh: s.img.height };
  }

  // elapsed 기반 루프 (투사체 비행 중)
  getStripLoop(key, elapsed, fps = 12) {
    const s = this.strips[key];
    if (!s) return null;
    const fw = s.img.width / s.frames;
    const fi = Math.floor(elapsed * fps) % s.frames;
    return { img: s.img, sx: fi * fw, sy: 0, sw: fw, sh: s.img.height };
  }

  // ── 멀티행 스프라이트시트 (Free 팩 등) ────────────
  // totalRows: 색상 행 수, colorRow: 사용할 행 index
  getFreeFrame(imgKey, progress, cols, colorRow, totalRows) {
    const img = this.images[imgKey];
    if (!img) return null;
    const fw = img.width  / cols;
    const fh = img.height / totalRows;
    const fi = Math.min(Math.floor(progress * cols), cols - 1);
    return { img, sx: fi * fw, sy: colorRow * fh, sw: fw, sh: fh };
  }

  getFreeFrameLoop(imgKey, elapsed, fps, cols, colorRow, totalRows) {
    const img = this.images[imgKey];
    if (!img) return null;
    const fw = img.width  / cols;
    const fh = img.height / totalRows;
    const fi = Math.floor(elapsed * fps) % cols;
    return { img, sx: fi * fw, sy: colorRow * fh, sw: fw, sh: fh };
  }

  // ── 화살 스프라이트 ───────────────────────────────
  getArrowSrc(row = 0, col = 1) {
    const img = this.images.arrows;
    if (!img) return null;
    const cw = img.width  / 3;
    const ch = img.height / 4;
    return { img, sx: col * cw, sy: row * ch, sw: cw, sh: ch };
  }

  getArrowImpactSrc(progress, row = 0, cols = 5) {
    const img = this.images.arrowImpact;
    if (!img) return null;
    const cw = img.width  / cols;
    const ch = img.height / 4;
    const fi = Math.min(Math.floor(progress * cols), cols - 1);
    return { img, sx: fi * cw, sy: row * ch, sw: cw, sh: ch };
  }

  // ── Holy VFX ─────────────────────────────────────
  getHolyLoopSrc(elapsed, totalFrames = 8) {
    const img = this.images.holyLoop;
    if (!img) return null;
    const fw = img.width / totalFrames;
    const fi = Math.floor(elapsed * 14) % totalFrames;
    return { img, sx: fi * fw, sy: 0, sw: fw, sh: img.height };
  }

  getHolyImpactSrc(progress, totalFrames = 7) {
    const img = this.images.holyImpact;
    if (!img) return null;
    const fw = img.width / totalFrames;
    const fi = Math.min(Math.floor(progress * totalFrames), totalFrames - 1);
    return { img, sx: fi * fw, sy: 0, sw: fw, sh: img.height };
  }
}
