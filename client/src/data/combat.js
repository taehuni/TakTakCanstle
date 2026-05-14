// 공격 유형 × 방어 특성 배율표
const TRAIT_MULT = {
  physical: { armored: 0.85, spirit: 0    },
  pierce:   { armored: 0.60, spirit: 0    },
  magical:  { armored: 1.30, undead: 1.30, spirit: 1.50 },
  fire:     { undead:  1.50, swarm:  1.50, spirit: 0.30 },
  true:     { swarm:   1.50 },
  curse:    {},
};

/**
 * 최종 피해 계산
 * @param {number} atk        공격력
 * @param {string} dmgType    'physical'|'pierce'|'magical'|'fire'|'true'|'curse'
 * @param {number} def        방어력 (물리 감소)
 * @param {number} mdef       마법방어력 % (0~80)
 * @param {string[]} traits   방어 측 특성 배열
 */
export function calcDamage(atk, dmgType, def = 0, mdef = 0, traits = []) {
  if (dmgType === 'curse') return 0;

  let dmg = atk;
  const type = dmgType || 'physical';

  if (type === 'physical' || type === 'pierce') {
    dmg = Math.max(1, dmg - def);
  } else if (type === 'magical' || type === 'fire') {
    dmg = dmg * (1 - Math.min(mdef, 80) / 100);
  }
  // true: 방어 무시

  const mults = TRAIT_MULT[type] || {};
  for (const trait of traits) {
    if (mults[trait] !== undefined) dmg *= mults[trait];
  }

  return Math.max(0, Math.floor(dmg));
}
