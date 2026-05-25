const BASE_EXP   = '/assets/effect/wills_pixel_explosions_sample';
const BASE_BOLT  = '/assets/effect/Pixel Art Skill Animations - Lightning';
const BASE_HOLY  = '/assets/effect/Holy VFX 01-02/Holy VFX 01';
const BASE_ARROW = '/assets/effect';

export class EffectManager {
  constructor() {
    this.frames = {};
    this.images = {};   // 원본 Image 객체 (스프라이트시트)
    this.loaded = false;
  }

  async preload() {
    const load = src => new Promise(res => {
      const img = new Image();
      img.onload  = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

    const pad = n => String(n).padStart(4, '0');

    const [
      rFrames, xFrames, ltStrike, magicBolt, magicImpact,
      arrowsSheet, arrowImpactSheet,
      holyLoopSheet, holyImpactSheet,
    ] = await Promise.all([
      // ── 기존 픽셀 폭발 ──
      Promise.all(Array.from({ length: 69 }, (_, i) =>
        load(`${BASE_EXP}/round_explosion/PNG/frame${pad(i + 2)}.png`))),
      Promise.all(Array.from({ length: 64 }, (_, i) =>
        load(`${BASE_EXP}/X_plosion/PNG/frame${pad(i)}.png`))),
      // VFX3: 번개 피격
      Promise.all(Array.from({ length: 5 }, (_, i) =>
        load(`${BASE_BOLT}/VFX3/Frames/lightning_skill3_frame${i + 1}.png`))),
      // VFX4: 마법 투사체 비행
      Promise.all(Array.from({ length: 5 }, (_, i) =>
        load(`${BASE_BOLT}/VFX4/Frames/lightning_skill4_frame${i + 1}.png`))),
      // VFX5: 마법 피격
      Promise.all(Array.from({ length: 4 }, (_, i) =>
        load(`${BASE_BOLT}/VFX5/Frames/lightning_skill5_frame${i + 1}.png`))),

      // ── 화살 스프라이트시트 ──
      // Arrows_pack.png: 3col × 4row (row0=일반, row1=파랑, row2=초록, row3=빨강)
      load(`${BASE_ARROW}/Arrows_pack.png`),
      // Arrow_impact_pack.png: 5col × 4row 피격 애니메이션
      load(`${BASE_ARROW}/Arrow_impact_pack.png`),

      // ── Holy VFX ──
      // Holy VFX 01 Repeatable: 8프레임 가로 스트립 (투사체 비행 루프)
      load(`${BASE_HOLY}/Holy VFX 01 Repeatable.png`),
      // Holy VFX 01 Impact: 7프레임 가로 스트립 (피격 이펙트)
      load(`${BASE_HOLY}/Holy VFX 01 Impact.png`),
    ]);

    this.frames.round_explosion  = rFrames.filter(Boolean);
    this.frames.x_plosion        = xFrames.filter(Boolean);
    this.frames.lightning_strike = ltStrike.filter(Boolean);
    this.frames.magic_bolt       = magicBolt.filter(Boolean);
    this.frames.magic_impact     = magicImpact.filter(Boolean);

    this.images.arrows      = arrowsSheet;
    this.images.arrowImpact = arrowImpactSheet;
    this.images.holyLoop    = holyLoopSheet;
    this.images.holyImpact  = holyImpactSheet;

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

  // ── 화살 스프라이트 (스프라이트시트 슬라이스) ────
  // row: 0=일반, 1=파랑(ice), 2=초록, 3=빨강
  // col: 0=small, 1=mid, 2=large
  getArrowSrc(row = 0, col = 1) {
    const img = this.images.arrows;
    if (!img) return null;
    const cw = img.width  / 3;
    const ch = img.height / 4;
    return { img, sx: col * cw, sy: row * ch, sw: cw, sh: ch };
  }

  // 화살 피격 애니메이션 프레임 (row: 화살 타입, progress: 0→1)
  getArrowImpactSrc(progress, row = 0, cols = 5) {
    const img = this.images.arrowImpact;
    if (!img) return null;
    const cw = img.width  / cols;
    const ch = img.height / 4;
    const fi = Math.min(Math.floor(progress * cols), cols - 1);
    return { img, sx: fi * cw, sy: row * ch, sw: cw, sh: ch };
  }

  // Holy 투사체 비행 루프 (8프레임)
  getHolyLoopSrc(elapsed, totalFrames = 8) {
    const img = this.images.holyLoop;
    if (!img) return null;
    const fw = img.width / totalFrames;
    const fi = Math.floor(elapsed * 14) % totalFrames;
    return { img, sx: fi * fw, sy: 0, sw: fw, sh: img.height };
  }

  // Holy 피격 이펙트 (7프레임)
  getHolyImpactSrc(progress, totalFrames = 7) {
    const img = this.images.holyImpact;
    if (!img) return null;
    const fw = img.width / totalFrames;
    const fi = Math.min(Math.floor(progress * totalFrames), totalFrames - 1);
    return { img, sx: fi * fw, sy: 0, sw: fw, sh: img.height };
  }
}
