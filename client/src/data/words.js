export const BUILD_WORDS = [
  // ── 공개 힌트 단어 (게임 시작 시 표시) ──
  { word: '검사',     type: 'unit', unit: 'swordsman'   },
  { word: '궁수',     type: 'unit', unit: 'archer'      },
  { word: '기사',     type: 'unit', unit: 'knight'      },
  { word: '성벽',     type: 'building', building: 'wall' },

  // ── 히든 단어 (직접 입력 시도로만 발견) ──
  // 인간
  { word: '마법사',   type: 'unit', unit: 'wizard',       hidden: true },
  { word: '성기사',   type: 'unit', unit: 'paladin',      hidden: true },
  { word: '도적',     type: 'unit', unit: 'rogue',        hidden: true },
  { word: '사제',     type: 'unit', unit: 'priest',       hidden: true },
  // 언데드
  { word: '해골',     type: 'unit', unit: 'skeleton',     hidden: true },
  { word: '유령',     type: 'unit', unit: 'ghost',        hidden: true },
  { word: '좀비',     type: 'unit', unit: 'zombie',       hidden: true },
  { word: '뱀파이어', type: 'unit', unit: 'vampire',      hidden: true },
  { word: '리치',     type: 'unit', unit: 'lich',         hidden: true },
  { word: '흑기사',   type: 'unit', unit: 'death_knight', hidden: true },
  { word: '박쥐',     type: 'unit', unit: 'bat',          hidden: true },
  // 고블린
  { word: '고블린',   type: 'unit', unit: 'goblin',       hidden: true },
  { word: '폭탄병',   type: 'unit', unit: 'bomber',       hidden: true },
  // 오크
  { word: '오크',     type: 'unit', unit: 'orc',          hidden: true },
  { word: '주술사',   type: 'unit', unit: 'shaman',       hidden: true },
  { word: '광전사',   type: 'unit', unit: 'berserker',    hidden: true },
  { word: '족장',     type: 'unit', unit: 'warchief',     hidden: true },
  // 공용
  { word: '고양이',   type: 'unit', unit: 'cat',          hidden: true },
];

// UI에 노출되지 않는 숨겨진 단어 — 전투 중 입력 시 특수 효과 발동
export const EASTER_WORDS = [
  { word: '달걀', effect: 'egg' },  // 최전선 적 1명 — 끈적임 (이속/공속 감소 3초)
];

export const WEAPON_WORDS = [
  // 대유닛 — 최전선 유닛 타겟, 유닛 없으면 성에 50% 피해
  { word: '화염',   damage: 16, effect: 'fire',       target: 'unit' },
  { word: '얼음',   damage: 14, effect: 'ice',        target: 'unit' },
  { word: '불화살', damage: 20, effect: 'fire_arrow', target: 'unit' },
  { word: '독화살', damage: 16, effect: 'arrow',      target: 'unit' },

  // 공성 — 성벽 있으면 성벽 타격, 없으면 성 직격
  { word: '번개',   damage: 28, effect: 'lightning',  target: 'siege', cooldown:  8 },
  { word: '폭발',   damage: 42, effect: 'explosion',  target: 'siege', cooldown: 12 },
  { word: '마법진', damage: 34, effect: 'magic',      target: 'siege', cooldown: 10 },
  { word: '화염구', damage: 38, effect: 'fireball',   target: 'siege', cooldown: 11 },
];
