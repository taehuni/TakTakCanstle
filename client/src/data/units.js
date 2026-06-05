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
    def: 2, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'human', traits: [],
    ability: 'charge', abilityData: { mult: 1.3 },
    sheet: 'tiny-dungeon', tileRow: 7, tileCol: 3,
    weaponSheet: 'tiny-dungeon', weaponRow: 8, weaponCol: 10,
    color: '#4a9eff', enemyColor: '#ff5555',
    size: 16, scale: 3,
  },

  archer: {
    id: 'archer', name: '궁수',
    hp: 25, maxHp: 25,
    attack: 9, speed: 65, range: 130, cooldown: 1.6,
    def: 0, mdef: 0, dmgType: 'pierce', role: 'ranged', faction: 'human', traits: [],
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
    def: 12, mdef: 2, dmgType: 'physical', role: 'heavy', faction: 'human', traits: ['armored'],
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
    def: 0, mdef: 8, dmgType: 'magical', role: 'mage', faction: 'human', traits: [],
    ability: null,
    sheet: 'tiny-dungeon', tileRow: 7, tileCol: 0,
    weaponSheet: 'tiny-dungeon', weaponRow: 10, weaponCol: 10,
    color: '#c084fc', enemyColor: '#fc84c0',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  언데드 진영
  // ══════════════════════════════════════════════

  skeleton: {
    id: 'skeleton', name: '해골',
    hp: 20, maxHp: 20,
    attack: 8, speed: 50, range: 24, cooldown: 1.0,
    def: 4, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'undead', traits: ['undead', 'swarm'],
    ability: 'double_spawn',           // 소환 시 2마리 동시 등장
    abilityData: {},
    sheet: 'tiny-addon', tileRow: 10, tileCol: 2,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#e2e2e2', enemyColor: '#c0a0a0',
    size: 16, scale: 3,
  },

  ghost: {
    id: 'ghost', name: '유령',
    hp: 45, maxHp: 45,
    attack: 18, speed: 30, range: 30, cooldown: 2.0,
    def: 0, mdef: 15, dmgType: 'magical', role: 'spirit', faction: 'undead', traits: ['undead', 'spirit'],
    ability: 'phase',                  // 첫 공격 전까지 무적 + 벽 통과
    abilityData: {},
    sheet: 'tiny-dungeon', tileRow: 10, tileCol: 1,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#a5f3fc', enemyColor: '#f0abfc',
    size: 16, scale: 3,
  },

  zombie: {
    id: 'zombie', name: '좀비',
    hp: 55, maxHp: 55,
    attack: 10, speed: 22, range: 24, cooldown: 1.5,
    def: 6, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'undead', traits: ['undead'],
    ability: 'revive',                 // 사망 후 1.5초 뒤 HP 40% 부활 (1회)
    abilityData: { delay: 1.5, hpRatio: 0.4 },
    sheet: 'tiny-creatures', tileRow: 0, tileCol: 0,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#86efac', enemyColor: '#fca5a5',
    size: 16, scale: 3,
  },

  vampire: {
    id: 'vampire', name: '뱀파이어',
    hp: 50, maxHp: 50,
    attack: 20, speed: 55, range: 28, cooldown: 1.4,
    def: 3, mdef: 5, dmgType: 'physical', role: 'infantry', faction: 'undead', traits: ['undead'],
    ability: 'life_steal',             // 가한 피해의 20% 를 HP 회복 (독/신성에 취약)
    abilityData: { stealRate: 0.20 },
    sheet: 'tiny-creatures', tileRow: 0, tileCol: 2,
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
    def: 3, mdef: 3, dmgType: 'physical', role: 'infantry', faction: 'goblin', traits: [],
    ability: 'aura',                   // 150px 내 아군 SPD+30%, ATK+20%
    abilityData: { range: 150, speedMult: 1.3, atkMult: 1.2 },
    sheet: 'tiny-addon', tileRow: 9, tileCol: 2,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#a3e635', enemyColor: '#fbbf24',
    size: 16, scale: 3,
  },

  bomber: {
    id: 'bomber', name: '폭탄병',
    hp: 30, maxHp: 30,
    attack: 50, speed: 60, range: 24, cooldown: 99,
    def: 0, mdef: 0, dmgType: 'fire', role: 'explosive', faction: 'goblin', traits: ['swarm'],
    ability: 'kamikaze',               // 적 사정거리 내 진입 시 자폭 AoE
    abilityData: { triggerRange: 50, aoeRange: 90 },
    sheet: 'tiny-creatures', tileRow: 0, tileCol: 3,
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
    def: 8, mdef: 3, dmgType: 'physical', role: 'heavy', faction: 'orc', traits: ['armored'],
    ability: 'rage',                   // HP 30% 이하 → ATK×2, SPD×1.5
    abilityData: { threshold: 0.3, atkMult: 2.0, spdMult: 1.5 },
    sheet: 'tiny-addon', tileRow: 9, tileCol: 5,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#4ade80', enemyColor: '#fb923c',
    size: 16, scale: 3,
  },

  shaman: {
    id: 'shaman', name: '주술사',
    hp: 40, maxHp: 40,
    attack: 0, speed: 30, range: 170, cooldown: 3.0,
    def: 2, mdef: 10, dmgType: 'curse', role: 'mage', faction: 'orc', traits: [],
    ability: 'curse',                  // 적 ATK -40% (5초) 주기적 저주
    abilityData: { curseMult: 0.6, curseDuration: 5.0 },
    sheet: 'tiny-dungeon', tileRow: 9, tileCol: 3,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#818cf8', enemyColor: '#c084fc',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  인간 추가 유닛
  // ══════════════════════════════════════════════

  paladin: {
    id: 'paladin', name: '성기사',
    hp: 85, maxHp: 85,
    attack: 11, speed: 36, range: 26, cooldown: 1.6,
    def: 10, mdef: 8, dmgType: 'holy', role: 'heavy', faction: 'human', traits: ['armored'],
    ability: 'heal_aura', abilityData: { range: 120, healRate: 5 },
    sheet: 'tiny-addon', tileRow: 4, tileCol: 3,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#fde68a', enemyColor: '#fca5a5',
    size: 16, scale: 3,
  },

  rogue: {
    id: 'rogue', name: '도적',
    hp: 32, maxHp: 32,
    attack: 13, speed: 95, range: 24, cooldown: 1.0,
    def: 1, mdef: 0, dmgType: 'pierce', role: 'infantry', faction: 'human', traits: [],
    ability: 'charge', abilityData: { mult: 1.8 },
    sheet: 'tiny-addon', tileRow: 6, tileCol: 2,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#94a3b8', enemyColor: '#f87171',
    size: 16, scale: 3,
  },

  crossbowman: {
    id: 'crossbowman', name: '석궁병',
    hp: 28, maxHp: 28,
    attack: 14, speed: 55, range: 160, cooldown: 2.0,
    def: 0, mdef: 0, dmgType: 'pierce', role: 'ranged', faction: 'human', traits: [],
    ability: null,
    sheet: 'tiny-addon', tileRow: 4, tileCol: 4,
    weaponSheet: 'tiny-addon', weaponRow: 13, weaponCol: 4,
    color: '#7dd3fc', enemyColor: '#fca5a5',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  언데드 추가 유닛
  // ══════════════════════════════════════════════

  lich: {
    id: 'lich', name: '리치',
    hp: 50, maxHp: 50,
    attack: 30, speed: 28, range: 200, cooldown: 3.0,
    def: 0, mdef: 18, dmgType: 'magical', role: 'mage', faction: 'undead', traits: ['undead', 'spirit'],
    ability: null,
    sheet: 'tiny-addon', tileRow: 11, tileCol: 11,
    weaponSheet: 'tiny-dungeon', weaponRow: 10, weaponCol: 10,
    color: '#c4b5fd', enemyColor: '#f0abfc',
    size: 16, scale: 3,
  },

  death_knight: {
    id: 'death_knight', name: '흑기사',
    hp: 100, maxHp: 100,
    attack: 18, speed: 38, range: 28, cooldown: 1.7,
    def: 14, mdef: 4, dmgType: 'physical', role: 'heavy', faction: 'undead', traits: ['undead', 'armored'],
    ability: 'life_steal',
    abilityData: { stealRate: 0.18 },
    sheet: 'tiny-addon', tileRow: 11, tileCol: 10,
    weaponSheet: 'tiny-addon', weaponRow: 13, weaponCol: 10,
    color: '#6366f1', enemyColor: '#a78bfa',
    size: 16, scale: 3,
  },

  bat: {
    id: 'bat', name: '박쥐',
    hp: 12, maxHp: 12,
    attack: 6, speed: 100, range: 22, cooldown: 0.8,
    def: 0, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'undead', traits: ['undead', 'swarm', 'flying'],
    ability: 'triple_spawn',
    abilityData: {},
    yOffset: -36,
    sheet: 'tiny-addon', tileRow: 8, tileCol: 9,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#a78bfa', enemyColor: '#c084fc',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  고블린 추가 유닛
  // ══════════════════════════════════════════════

  wolf_rider: {
    id: 'wolf_rider', name: '기마병',
    hp: 50, maxHp: 50,
    attack: 14, speed: 105, range: 26, cooldown: 1.4,
    def: 3, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'goblin', traits: [],
    ability: 'charge',
    abilityData: { mult: 1.5 },
    sheet: 'tiny-addon', tileRow: 8, tileCol: 0,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#86efac', enemyColor: '#fde68a',
    size: 16, scale: 3,
  },

  troll: {
    id: 'troll', name: '트롤',
    hp: 130, maxHp: 130,
    attack: 16, speed: 25, range: 30, cooldown: 2.2,
    def: 10, mdef: 0, dmgType: 'physical', role: 'heavy', faction: 'goblin', traits: [],
    ability: 'regen',
    abilityData: { regenRate: 5 },
    sheet: 'tiny-dungeon', tileRow: 9, tileCol: 1,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#4ade80', enemyColor: '#86efac',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  오크 추가 유닛
  // ══════════════════════════════════════════════

  berserker: {
    id: 'berserker', name: '광전사',
    hp: 60, maxHp: 60,
    attack: 22, speed: 55, range: 26, cooldown: 1.2,
    def: 4, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'orc', traits: [],
    ability: 'rage',
    abilityData: { threshold: 0.5, atkMult: 1.8, spdMult: 1.4 },
    sheet: 'tiny-dungeon', tileRow: 9, tileCol: 1,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#f97316', enemyColor: '#fb923c',
    size: 16, scale: 3,
  },

  warchief: {
    id: 'warchief', name: '족장',
    hp: 110, maxHp: 110,
    attack: 15, speed: 32, range: 30, cooldown: 1.9,
    def: 9, mdef: 5, dmgType: 'physical', role: 'heavy', faction: 'orc', traits: ['armored'],
    ability: 'aura',
    abilityData: { range: 180, speedMult: 1.25, atkMult: 1.35 },
    sheet: 'tiny-creatures', tileRow: 1, tileCol: 1,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#22c55e', enemyColor: '#4ade80',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  인간 추가 유닛 2
  // ══════════════════════════════════════════════

  priest: {
    id: 'priest', name: '사제',
    hp: 35, maxHp: 35,
    attack: 14, speed: 38, range: 160, cooldown: 2.2,
    def: 1, mdef: 12, dmgType: 'holy', role: 'mage', faction: 'human', traits: [],
    ability: 'heal_aura', abilityData: { range: 110, healRate: 4 },
    sheet: 'tiny-dungeon', tileRow: 7, tileCol: 2,
    weaponSheet: 'tiny-dungeon', weaponRow: 10, weaponCol: 10,
    color: '#fef9c3', enemyColor: '#fca5a5',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  고양이 (전 진영 공용, 인간 진영 상성)
  // ══════════════════════════════════════════════

  cat: {
    id: 'cat', name: '고양이',
    hp: 28, maxHp: 28,
    attack: 4, speed: 80, range: 28, cooldown: 2.0,
    def: 0, mdef: 4, dmgType: 'magical', role: 'spirit', faction: 'feline', traits: [],
    ability: 'charm_aura',
    abilityData: { range: 90 },
    sheet: 'tiny-addon', tileRow: 8, tileCol: 4,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#f9a8d4', enemyColor: '#f472b6',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════
  //  야수 진영
  wolf: {
    id: 'wolf', name: '늑대',
    hp: 45, maxHp: 45,
    attack: 16, speed: 90, range: 26, cooldown: 1.1,
    def: 1, mdef: 0, dmgType: 'physical', role: 'infantry', faction: 'beast', traits: [],
    ability: 'charge',
    abilityData: { mult: 1.8 },
    sheet: 'tiny-creatures', tileRow: 9, tileCol: 3,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#94a3b8', enemyColor: '#cbd5e1',
    size: 16, scale: 3,
  },

  bear: {
    id: 'bear', name: '곰',
    hp: 130, maxHp: 130,
    attack: 22, speed: 28, range: 32, cooldown: 2.0,
    def: 10, mdef: 0, dmgType: 'physical', role: 'heavy', faction: 'beast', traits: ['armored'],
    ability: 'rage',
    abilityData: { threshold: 0.4, atkMult: 2.2, spdMult: 1.6 },
    sheet: 'tiny-creatures', tileRow: 16, tileCol: 3,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#a16207', enemyColor: '#ca8a04',
    size: 16, scale: 3,
  },

  // ══════════════════════════════════════════════

  eagle: {
    id: 'eagle', name: '독수리',
    hp: 30, maxHp: 30,
    attack: 18, speed: 90, range: 30, cooldown: 1.4,
    def: 0, mdef: 0, dmgType: 'pierce', role: 'infantry', faction: 'beast', traits: ['flying'],
    ability: 'charge',
    abilityData: { mult: 1.6 },
    sheet: 'tiny-creatures', tileRow: 13, tileCol: 4,
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#fde047', enemyColor: '#fb923c',
    size: 16, scale: 3,
    yOffset: -44,
  },

  // ══════════════════════════════════════════════
  //  용 진영
  // ══════════════════════════════════════════════

  dragon: {
    id: 'dragon', name: '용',
    hp: 150, maxHp: 150,
    attack: 32, speed: 38, range: 180, cooldown: 2.8,
    def: 8, mdef: 6, dmgType: 'fire', role: 'mage', faction: 'dragon', traits: ['flying'],
    ability: 'rage',
    abilityData: { threshold: 0.4, atkMult: 2.0, spdMult: 1.3 },
    sheet: 'tiny-creatures', tileRow: 3, tileCol: 0, tileColRange: [0, 1, 2, 3, 4],
    weaponSheet: null, weaponRow: null, weaponCol: null,
    color: '#fb923c', enemyColor: '#f87171',
    size: 16, scale: 3,
    yOffset: -44,
  },

  // ── SF 시즌용 탱크 ──────────────────────────────────────
  tank: {
    id: 'tank', name: '전차',
    hp: 120, maxHp: 120,
    attack: 25, speed: 45, range: 200, cooldown: 2.5,
    def: 15, mdef: 5, dmgType: 'physical', role: 'heavy', faction: 'human', traits: ['armored'],
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
