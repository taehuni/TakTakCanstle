export const BUILD_WORDS = [
  // 인간
  { word: '검사',     type: 'unit', unit: 'swordsman'   },
  { word: '궁수',     type: 'unit', unit: 'archer'      },
  { word: '기사',     type: 'unit', unit: 'knight'      },
  { word: '마법사',   type: 'unit', unit: 'wizard'      },
  { word: '성기사',   type: 'unit', unit: 'paladin'     },
  { word: '도적',     type: 'unit', unit: 'rogue'       },
  { word: '사제',     type: 'unit', unit: 'priest'      },
  // 언데드
  { word: '해골',     type: 'unit', unit: 'skeleton'    },
  { word: '유령',     type: 'unit', unit: 'ghost'       },
  { word: '좀비',     type: 'unit', unit: 'zombie'      },
  { word: '뱀파이어', type: 'unit', unit: 'vampire'     },
  { word: '리치',     type: 'unit', unit: 'lich'        },
  { word: '흑기사',   type: 'unit', unit: 'death_knight'},
  { word: '박쥐',     type: 'unit', unit: 'bat'         },
  // 고블린
  { word: '고블린',   type: 'unit', unit: 'goblin'      },
  { word: '폭탄병',   type: 'unit', unit: 'bomber'      },
  // 오크
  { word: '오크',     type: 'unit', unit: 'orc'         },
  { word: '주술사',   type: 'unit', unit: 'shaman'      },
  // 공용
  { word: '고양이',   type: 'unit', unit: 'cat'         },
  // 건물
  { word: '성벽',   type: 'building', building: 'wall' },
];

// UI에 노출되지 않는 숨겨진 단어 — 전투 중 입력 시 특수 효과 발동
export const EASTER_WORDS = [
  { word: '달걀', effect: 'egg' },  // 최전선 적 1명 — 끈적임 (이속/공속 감소 3초)
];

export const WEAPON_WORDS = [
  // 대유닛 — 적 유닛 최전선 타겟
  { word: '화염',   damage: 16, effect: 'fire',      target: 'unit'     },
  { word: '얼음',   damage: 14, effect: 'ice',       target: 'unit'     },
  { word: '불화살', damage: 20, effect: 'fire',      target: 'unit'     },
  { word: '독화살', damage: 16, effect: 'arrow',     target: 'unit'     },

  // 대건물 — 적 성벽 집중 타격 (공성)
  { word: '화공',   damage: 32, effect: 'fire',      target: 'building' },
  { word: '파쇄',   damage: 50, effect: 'explosion', target: 'building' },
  { word: '공성',   damage: 65, effect: 'magic',     target: 'building' },

  // 대성 — 적 성 직격
  { word: '번개',   damage: 25, effect: 'lightning', target: 'castle'   },
  { word: '폭발',   damage: 38, effect: 'explosion', target: 'castle'   },
  { word: '마법진', damage: 30, effect: 'magic',     target: 'castle'   },
  { word: '화염구', damage: 34, effect: 'fire',      target: 'castle'   },
];
