const BASE_EXP  = '/assets/effect/wills_pixel_explosions_sample';
const BASE_BOLT = '/assets/effect/Pixel Art Skill Animations - Lightning';

export class EffectManager {
  constructor() {
    this.frames = {};
    this.loaded = false;
  }

  async preload() {
    const load = src => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = src;
    });

    const pad = n => String(n).padStart(4, '0');

    const [rFrames, xFrames, ltStrike, magicBolt, magicImpact] = await Promise.all([
      Promise.all(Array.from({ length: 69 }, (_, i) =>
        load(`${BASE_EXP}/round_explosion/PNG/frame${pad(i + 2)}.png`))),
      Promise.all(Array.from({ length: 64 }, (_, i) =>
        load(`${BASE_EXP}/X_plosion/PNG/frame${pad(i)}.png`))),
      // VFX3: 번개 피격 — 수직 볼트 (번개 내리꽂힘, 5프레임)
      Promise.all(Array.from({ length: 5 }, (_, i) =>
        load(`${BASE_BOLT}/VFX3/Frames/lightning_skill3_frame${i + 1}.png`))),
      // VFX4: 마법 투사체 비행 — 수직 충전 볼트 (5프레임)
      Promise.all(Array.from({ length: 5 }, (_, i) =>
        load(`${BASE_BOLT}/VFX4/Frames/lightning_skill4_frame${i + 1}.png`))),
      // VFX5: 마법 피격 — 양쪽 볼트+노란 코어 (4프레임)
      Promise.all(Array.from({ length: 4 }, (_, i) =>
        load(`${BASE_BOLT}/VFX5/Frames/lightning_skill5_frame${i + 1}.png`))),
    ]);

    this.frames.round_explosion  = rFrames.filter(Boolean);
    this.frames.x_plosion        = xFrames.filter(Boolean);
    this.frames.lightning_strike = ltStrike.filter(Boolean);
    this.frames.magic_bolt       = magicBolt.filter(Boolean);
    this.frames.magic_impact     = magicImpact.filter(Boolean);
    this.loaded = true;
  }

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
}
