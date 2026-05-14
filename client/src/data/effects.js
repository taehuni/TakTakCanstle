// ──────────────────────────────────────────────────────
// 마법/이펙트 정의
//
// sprite: { sheet, row, col } 설정하면 해당 타일을 투사체 이미지로 사용
// sprite: null 이면 Canvas 직접 드로잉 (기본값)
//
// 예시:
//   fire: { color: '#fb923c', sprite: { sheet: 'tiny-battle', row: 3, col: 5 } }
// ──────────────────────────────────────────────────────

export const EFFECT_DEFS = {
  fire:      { color: '#fb923c', sprite: null },
  lightning: { color: '#fde047', sprite: null },
  ice:       { color: '#67e8f9', sprite: null },
  explosion: { color: '#ef4444', sprite: null },
  magic:     { color: '#c084fc', sprite: null },
  arrow:     { color: '#d4a574', sprite: null },
  block:     { color: '#60a5fa', sprite: null },
};

// ── 상태이상 정의 ─────────────────────────────────────
// speedMult: 이속 배율 (1.0 = 정상, 0.4 = 60% 감속)
// atkMult:   공격 쿨다운 소모 배율 (1.0 = 정상, 0.5 = 공속 절반)
// duration:  지속 시간 (초)

export const STATUS_DEFS = {
  slow: { speedMult: 0.4, atkMult: 0.5, duration: 3.0 },
};
