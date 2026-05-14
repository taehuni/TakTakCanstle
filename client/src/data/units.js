const TANKS = '/assets/sprites/kenney_tanks/PNG/Default size';

// ── 공통 기본값 (생략 시 적용) ───────────────────────────────────────────
// def: 0, mdef: 0, dmgType: 'physical', traits: [], ability: null

export const UNIT_DEFS = {

  // ══════════════════════════════════════════════
  //  인간 진영
  // ══════════════════════════════════════════════

  swordsman: {
    id: 'swordsman', name: '검사',
    hp: 40, maxHp: 40,
    attack: 6, speed: 55, range: 24, cooldown: 1.2,
    def: 2, mdef: 0, dmgType: 'physical', traits: [],
    ability: 'charge',
    abilityData: { mult: 1.3 },        // 첫 공격 1.3배
    sheet: 'tiny-dungeon', tileRow: 7, tileCol: 3,
    weaponSheet: 'tiny-dungeon', weaponRow: 8, weaponCol: 10,
    color: '#4a9eff', enemyColor: '#ff5555',
    size: 16, scale: 3,
  },

  archer: {
    id: 'archer', name: '궁수',
    hp: 25, maxHp: 25,
    attack: 9, speed: 65, range: 130, cooldown: 1.6,
    def: 0, mdef: 0, dmgType: 'pierce', traits: [],
    ability: null,
    sheet: 'tiny-dungeon', tileRow: 7, tileCol: 1,
    weaponSheet: 'tiny-addon', weaponRow: 2, weaponCol: 6,
    color: '#4dff91', enemyColor: '#ff7070',
    size: 16, scale: 3,
  },

  knight: {
    id: 'knight', name: '기사',
    hp: 90, maxHp: 90,
    attack: 14, speed: 40, range: 28, cooldown: 1.8,
    def: 12, mdef: 2, dmgType: 'physical', traits: ['armored'],
    ability: null,
    sheet: 'tiny-dungeon', tileRow: 8, tileCol: 0,
    weaponSheet: 'tiny-addon', weaponRow: 13, weaponCol: 10,
    color: '#ffe566', enemyColor: '#ff8866',
    size: 16, scale: 3,
  },

  wizard: {
    id: 'wizard', name: '마법사',
    hp: 30, maxHp: 30,
    attack: 22, speed: 35, range: 180, cooldown: 2.5,
    def: 0, mdef: 8, dmgType: 'magical', traits: [],
    ability: null,
    sheet: 'tiny-dungeon', tileRow: 7, tileCol: 0,
    weaponSheet: 'tiny-dungeon', weaponRow: 10, weaponCol: 10,
    color: '#c084fc', enemyColor: '#fc84c0',
    size: 16, scale: 3,
  },

  catapult: {
    id: 'catapult', name: '투석기',
    hp: 60, maxHp: 60,
    attack: 40, speed: 22, range: 250, cooldown: 4.0,
    def: 3, mdef: 0, dmgType: 'true', traits: [],
    buildingDmgMulti: 3.0,
    ability: null,
    sheet: 'tiny-dungeon', tileRow: null, tileCol: null,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#fb923c', enemyColor: '#fb234c',
    size: 24, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  언데드 진영
  // ══════════════════════════════════════════════

  skeleton: {
    id: 'skeleton', name: '해골',
    hp: 20, maxHp: 20,
    attack: 8, speed: 50, range: 24, cooldown: 1.0,
    def: 4, mdef: 0, dmgType: 'physical', traits: ['undead', 'swarm'],
    ability: 'double_spawn',           // 소환 시 2마리 동시 등장
    abilityData: {},
    sheet: 'tiny-dungeon', tileRow: 5, tileCol: 3,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#e2e2e2', enemyColor: '#c0a0a0',
    size: 16, scale: 3,
  },

  ghost: {
    id: 'ghost', name: '유령',
    hp: 45, maxHp: 45,
    attack: 18, speed: 30, range: 30, cooldown: 2.0,
    def: 0, mdef: 15, dmgType: 'magical', traits: ['undead', 'spirit'],
    ability: 'phase',                  // 첫 공격 전까지 무적 + 벽 통과
    abilityData: {},
    sheet: 'tiny-dungeon', tileRow: 6, tileCol: 0,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#a5f3fc', enemyColor: '#f0abfc',
    size: 16, scale: 3,
  },

  zombie: {
    id: 'zombie', name: '좀비',
    hp: 55, maxHp: 55,
    attack: 10, speed: 22, range: 24, cooldown: 1.5,
    def: 6, mdef: 0, dmgType: 'physical', traits: ['undead'],
    ability: 'revive',                 // 사망 후 1.5초 뒤 HP 40% 부활 (1회)
    abilityData: { delay: 1.5, hpRatio: 0.4 },
    sheet: 'tiny-addon', tileRow: 10, tileCol: 0,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#86efac', enemyColor: '#fca5a5',
    size: 16, scale: 3,
  },

  vampire: {
    id: 'vampire', name: '뱀파이어',
    hp: 50, maxHp: 50,
    attack: 20, speed: 55, range: 28, cooldown: 1.4,
    def: 3, mdef: 5, dmgType: 'physical', traits: ['undead'],
    ability: 'life_steal',             // 가한 피해의 35% 를 HP 회복
    abilityData: { stealRate: 0.35 },
    sheet: 'tiny-addon', tileRow: 9, tileCol: 0,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#f472b6', enemyColor: '#fb7185',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  고블린 진영
  // ══════════════════════════════════════════════

  goblin: {
    id: 'goblin', name: '고블린',
    hp: 60, maxHp: 60,
    attack: 12, speed: 55, range: 24, cooldown: 1.3,
    def: 3, mdef: 3, dmgType: 'physical', traits: [],
    ability: 'aura',                   // 150px 내 아군 SPD+30%, ATK+20%
    abilityData: { range: 150, speedMult: 1.3, atkMult: 1.2 },
    sheet: 'tiny-addon', tileRow: 8, tileCol: 2,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#a3e635', enemyColor: '#fbbf24',
    size: 16, scale: 3,
  },

  bomber: {
    id: 'bomber', name: '폭탄병',
    hp: 30, maxHp: 30,
    attack: 50, speed: 60, range: 24, cooldown: 99,
    def: 0, mdef: 0, dmgType: 'fire', traits: ['swarm'],
    ability: 'kamikaze',               // 적 사정거리 내 진입 시 자폭 AoE
    abilityData: { triggerRange: 50, aoeRange: 90 },
    sheet: 'tiny-addon', tileRow: 8, tileCol: 4,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#fb923c', enemyColor: '#f97316',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  오크 진영
  // ══════════════════════════════════════════════

  orc: {
    id: 'orc', name: '오크',
    hp: 100, maxHp: 100,
    attack: 16, speed: 35, range: 28, cooldown: 1.8,
    def: 8, mdef: 3, dmgType: 'physical', traits: ['armored'],
    ability: 'rage',                   // HP 30% 이하 → ATK×2, SPD×1.5
    abilityData: { threshold: 0.3, atkMult: 2.0, spdMult: 1.5 },
    sheet: 'tiny-addon', tileRow: 8, tileCol: 6,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#4ade80', enemyColor: '#fb923c',
    size: 16, scale: 3,
  },

  shaman: {
    id: 'shaman', name: '샤먼',
    hp: 40, maxHp: 40,
    attack: 0, speed: 30, range: 170, cooldown: 3.0,
    def: 2, mdef: 10, dmgType: 'curse', traits: [],
    ability: 'curse',                  // 적 ATK -40% (5초) 주기적 저주
    abilityData: { curseMult: 0.6, curseDuration: 5.0 },
    sheet: 'tiny-addon', tileRow: 9, tileCol: 6,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#818cf8', enemyColor: '#c084fc',
    size: 16, scale: 3,
  },

  // ── SF 시즌용 탱크 ──────────────────────────────────────
  tank: {
    id: 'tank', name: '전차',
    hp: 120, maxHp: 120,
    attack: 25, speed: 45, range: 200, cooldown: 2.5,
    def: 15, mdef: 5, dmgType: 'physical', traits: ['armored'],
    ability: null,
    sheet: null, tileRow: null, tileCol: null,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    sprite:      `${TANKS}/tanks_tankGreen1.png`,
    enemySprite: `${TANKS}/tanks_tankDesert1.png`,
    color: '#4ade80', enemyColor: '#fb923c',
    size: 64, scale: 1,
  },
};

export const BUILDING_DEFS = {
  wall: {
    id: 'wall', name: '성벽',
    hp: 400, maxHp: 400,
    attack: 0, range: 0, cooldown: 0,
    def: 20, mdef: 10, dmgType: null, traits: ['building'],
    sheet: null, tileRow: null, tileCol: null,
    tileGrid: [
      { sheet: 'tiny-town',    row: 8, col: 6  },
      { sheet: 'tiny-dungeon', row: 4, col: 10 },
      { sheet: 'tiny-dungeon', row: 4, col: 10 },
    ],
    tileSize: 16, scale: 2,
    color: '#78716c',
    size: 16,
  },
};
