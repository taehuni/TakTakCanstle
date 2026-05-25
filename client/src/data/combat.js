// 역할(role) 상성표 — 공격자 role → 피격자 role : 배율
// 새 유닛 추가 시 role만 지정하면 자동 적용
export const ROLE_CHART = {
  infantry: { mage:    1.75 },  // 검사 계열 ▶ 마법사 계열
  mage:     { heavy:   1.50 },  // 마법사 계열 ▶ 기사 계열 (TRAIT_MULT magical×armored 1.3과 중첩)
  heavy:    { ranged:  1.75,    // 기사 계열 ▶ 궁수 계열
              siege:   1.75 },  // 기사 계열 ▶ 투석기 계열
  ranged:   { infantry: 1.75 }, // 궁수 계열 ▶ 검사 계열
};

export function roleMultiplier(attackerRole, targetRole) {
  return ROLE_CHART[attackerRole]?.[targetRole] ?? 1;
}

// 공격 유형 × 방어 특성 배율표
const TRAIT_MULT = {
  physical: { armored: 0.85, spirit: 0    },
  pierce:   { armored: 0.60, spirit: 0    },
  magical:  { armored: 1.30, undead: 1.30, spirit: 1.50 },
  fire:     { undead:  1.50, swarm:  1.50, spirit: 0.30 },
  holy:     { undead:  2.00, spirit: 2.50 },   // 신성: 언데드/영체 특효
  poison:   { armored: 1.20, undead: 0.60 },   // 독: 중장갑 특효, 언데드 저항
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
  } else if (type === 'magical' || type === 'fire' || type === 'holy') {
    dmg = dmg * (1 - Math.min(mdef, 80) / 100);
  } else if (type === 'poison') {
    dmg = Math.max(1, dmg - Math.floor(def * 0.5)); // 독: 방어력 절반만 적용
  }
  // true: 방어 무시

  const mults = TRAIT_MULT[type] || {};
  for (const trait of traits) {
    if (mults[trait] !== undefined) dmg *= mults[trait];
  }

  return Math.max(0, Math.floor(dmg));
}
