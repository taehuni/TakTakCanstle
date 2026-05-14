// ──────────────────────────────────────────────────────
// 성 타일 설정 (tiny-town 기준 row/col, 0-indexed)
//
// 그리드 코드 참조표:
//   S          = stone     기본 돌벽
//   EL / ER    = endL/R    왼쪽/오른쪽 마감벽
//   TTL TTC TTR = towerT*  망루 위쪽 (왼/중/오)
//   TML TMC TMR = towerM*  망루 가운데 (왼/중/오)
//   TBL TBC TBR = towerB*  망루 아래 (왼/중/오)
//   M          = merlon    흉벽
//   GL / GR    = gate_l/r  게이트 철창
//   GUL / GUR  = gate_Ul/r 게이트 철창 위 장식
//   AL AM AR   = arch_*    아치 (왼/중/오)
//   ' '        = 빈칸 (아무것도 안 그림)
// ──────────────────────────────────────────────────────

export const CASTLE_DEF = {
  // 기본 벽
  stone:    { sheet: 'tiny-town',    row: 10, col: 6  },  // 기본 돌벽
  endL:     { sheet: 'tiny-dungeon', row:  4, col: 9  },  // 왼쪽 마감벽
  endR:     { sheet: 'tiny-dungeon', row:  4, col: 11 },  // 오른쪽 마감벽
  endLR:    { sheet: 'tiny-dungeon', row:  4, col: 10 },  // 양쪽 마감벽 (포트컬리스)
  ground:   { sheet: 'tiny-dungeon',    row:  4, col: 1  },  // 성 바닥

  // 망루 타일 (3×3 그리드)
  towerTL:  { sheet: 'tiny-town',    row:  8, col: 0  },  // 망루 위쪽 왼쪽
  towerTC:  { sheet: 'tiny-town',    row:  8, col: 1  },  // 망루 위쪽 중앙
  towerTR:  { sheet: 'tiny-town',    row:  8, col: 2  },  // 망루 위쪽 오른쪽
  towerML:  { sheet: 'tiny-town',    row:  9, col: 0  },  // 망루 가운데 왼쪽
  towerMC:  { sheet: 'tiny-town',    row:  9, col: 1  },  // 망루 가운데 중앙
  towerMR:  { sheet: 'tiny-town',    row:  9, col: 2  },  // 망루 가운데 오른쪽
  towerBL:  { sheet: 'tiny-town',    row: 10, col: 0  },  // 망루 아래 왼쪽
  towerBC:  { sheet: 'tiny-town',    row: 10, col: 1  },  // 망루 아래 중앙
  towerBR:  { sheet: 'tiny-town',    row: 10, col: 2  },  // 망루 아래 오른쪽
  towerCC:  { sheet: 'tiny-town',    row:  8, col: 6  },  // 망루 단일 꼭대기
  towerCCC: { sheet: 'tiny-town',    row:  8, col: 4  },  // 망루 단일 중앙
  
  
  // 게이트 (포트컬리스)
  gate_l:   { sheet: 'tiny-town',    row: 10, col: 3  },  // 왼쪽 철창
  gate_r:   { sheet: 'tiny-town',    row: 10, col: 4  },  // 오른쪽 철창
  gate_Ul:  { sheet: 'tiny-town',    row:  9, col: 3  },  // 철창 위 왼쪽 장식
  gate_Ur:  { sheet: 'tiny-town',    row:  9, col: 4  },  // 철창 위 오른쪽 장식

 

  // 크기
  tileSize: 16,

  // ── 레이아웃 그리드 ──────────────────────────────────
  grid: [
    ['', 'TTL','TTR',' ',' ','TTL','TTR',' '],
    ['', 'TBL','TBR',' ',' ','TBL','TBR',' '],
    [ ,'EL','ER','TCCC','TCCC','EL', 'ER', ],
    ['TTL','EL','S','S','S','S','ER','TTR'],
    ['TBL','EL','S', 'GUL','GUR', 'S', 'ER','TBR'],
    ['EL','EL','S','GL','GR','S','ER','ER'],
  ],
};
