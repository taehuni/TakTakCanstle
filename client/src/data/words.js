export const BUILD_WORDS = [
  // 인간
  { word: '검사',   type: 'unit', unit: 'swordsman' },
  { word: '궁수',   type: 'unit', unit: 'archer'    },
  { word: '기사',   type: 'unit', unit: 'knight'    },
  { word: '마법사', type: 'unit', unit: 'wizard'    },
  { word: '투석기', type: 'unit', unit: 'catapult'  },
  // 언데드
  { word: '해골',       type: 'unit', unit: 'skeleton' },
  { word: '유령',       type: 'unit', unit: 'ghost'    },
  { word: '좀비',       type: 'unit', unit: 'zombie'   },
  { word: '뱀파이어',   type: 'unit', unit: 'vampire'  },
  // 고블린
  { word: '고블린',   type: 'unit', unit: 'goblin'  },
  { word: '폭탄병',   type: 'unit', unit: 'bomber'  },
  // 오크
  { word: '오크',   type: 'unit', unit: 'orc'    },
  { word: '샤먼',   type: 'unit', unit: 'shaman' },
  // 건물
  { word: '성벽', type: 'building', building: 'wall' },
];

// 유닛명 + 건물명 + 무기단어 합산 → 2~4글자 다양하게
export const BATTLE_WORDS = [
  '검사', '궁수', '기사', '마법사', '투석기', '성벽',
  '화염', '번개', '얼음', '폭발', '마법진', '불화살', '독화살', '화염구',
];

export const WEAPON_WORDS = [
  // 대유닛 — 적 유닛 최전선 타겟
  { word: '화염',   damage: 22, effect: 'fire',      target: 'unit'     },
  { word: '얼음',   damage: 18, effect: 'ice',       target: 'unit'     },
  { word: '불화살', damage: 25, effect: 'fire',      target: 'unit'     },
  { word: '독화살', damage: 20, effect: 'arrow',     target: 'unit'     },

  // 대건물 — 적 성벽 집중 타격 (공성)
  { word: '화공',   damage: 40, effect: 'fire',      target: 'building' },
  { word: '파쇄',   damage: 60, effect: 'explosion', target: 'building' },
  { word: '공성',   damage: 80, effect: 'magic',     target: 'building' },

  // 대성 — 적 성 직격
  { word: '번개',   damage: 45, effect: 'lightning', target: 'castle'   },
  { word: '폭발',   damage: 55, effect: 'explosion', target: 'castle'   },
  { word: '마법진', damage: 40, effect: 'magic',     target: 'castle'   },
  { word: '화염구', damage: 50, effect: 'fire',      target: 'castle'   },
];
