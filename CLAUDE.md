# 탁탁성 (Typing Battle) — 개발 규칙

## 프로젝트 개요
한국어 타자 기반 실시간 성 전략 게임.  
데이콘 월간 해커톤 웹 미니게임 챌린지 출품작.  
서비스명: **탁탁성** / 레포: `Typing_Battle`

---

## 기술 스택
- **Frontend**: React (Vite) — `client/`
- **Backend**: Node.js + Express + Socket.IO — `server/`
- **DB/Auth**: Firebase (Firestore + Authentication)
- **Canvas 렌더링**: HTML5 Canvas (픽셀아트, `imageSmoothingEnabled = false`)

---

## 스프라이트 시스템

### 시트 정의 (`SpriteCache.js`)
| key | 파일 | tileW | spacing | 용도 |
|-----|------|-------|---------|------|
| `tiny-dungeon` | `Kenney_tiny_dungeon.png` | 16 | **1** | 인간 캐릭터, 무기 |
| `tiny-addon` | `Sprites-16x16.png` | 16 | 0 | 몬스터, 아이템, 무기 |
| `tiny-creatures` | `tilemap_packed.png` | 16 | 0 | 크리처, 동물, 용 |
| `tiny-battle` | (kenney battle) | 16 | 0 | 배틀 타일 |
| `tiny-town` | (kenney town) | 16 | 0 | 성벽 타일 |

### 좌표 접근법
```js
const step = tileW + spacing;  // tiny-dungeon: step=17, 나머지: step=16
sx = tileCol * step;
sy = tileRow * step;
```

### 스프라이트 인스펙터
`http://localhost:5173/sprite-inspector.html` — 타일 좌표 확인 도구.  
tiny-dungeon은 1px spacing 때문에 그리드가 틀어지기 쉬우니 반드시 인스펙터로 확인.

### 색상 변형 유닛 (용 등)
`tileColRange: [0,1,2,3,4]` 지정 시 팀별로 한 번만 랜덤 선택.  
같은 팀 유닛은 항상 같은 색. `BattlePhase.initArmy`에서 `teamCol` 결정.

---

## 유닛 추가 규칙

### 필수 파일 3곳
1. **`data/units.js`** — 스탯, 스프라이트 좌표, 어빌리티
2. **`data/words.js`** — 소환 단어 (BUILD_WORDS)
3. **`data/unitMeta.js`** — 표시 이름(한국어), 카드 색상

### 진영(faction) 한국어 매핑 (DogamScreen)
```js
{ human:'인간', undead:'언데드', goblin:'고블린', orc:'오크',
  feline:'정령', beast:'야수', dragon:'용족' }
```
**새 진영 추가 시 반드시 DogamScreen의 `FACTION_KO`에도 추가.**

### 역할(role) 한국어 매핑
```js
{ infantry:'보병', ranged:'원거리', heavy:'중장보병',
  mage:'마법사', spirit:'정령', explosive:'폭발물', siege:'공성' }
```

### 어빌리티 목록 (Unit.js에 구현됨)
| ability | 설명 |
|---------|------|
| `charge` | 첫 공격 ×mult |
| `double_spawn` | 2마리 소환 |
| `triple_spawn` | 3마리 소환 |
| `phase` | 첫 공격 전 완전무적 + 성벽통과 (유령) |
| `revive` | 사망 후 부활 1회 |
| `life_steal` | 피흡 |
| `aura` | 주변 아군 버프 |
| `kamikaze` | 근접 시 자폭 AoE |
| `rage` | 저HP 시 강화 |
| `curse` | 적 공격력 디버프 (주술사) |
| `heal_aura` | 주변 아군 HP 회복 |
| `charm_aura` | 인간 유닛 행동불가 (고양이) |
| `regen` | 자동 HP 회복 |

### 공중 유닛 (flying)
```js
traits: ['flying'],  // 필수
yOffset: -44,        // 공중 높이 (음수 = 위)
```
- 지상 근접 유닛은 공중 유닛 타겟팅 불가
- 공중 유닛끼리는 서로 공격 가능
- 성벽 자동 통과
- 다이브 공격 애니메이션: `attackTargetFlying` 플래그로 제어

---

## 이펙트 시스템

### EffectManager 에셋 경로
| 에셋 | 경로 | 용도 |
|------|------|------|
| round_explosion | wills_pixel_explosions_sample | 화염 계열 |
| x_plosion | wills_pixel_explosions_sample | 폭발 계열 |
| lightning_strike | Pixel Art Skill Animations - Lightning/VFX3 | 번개 |
| magic_bolt | ...VFX4 | 마법 투사체 |
| magic_impact | ...VFX5 | 마법 피격 |
| 슬래시 | Slash Export/1 - NN.png (35프레임) | 근접 공격 |
| 마법팩 | free-pixel-magic-sprite-effects-pack/1 Magic/ | 각종 마법 |
| Free팩 | Free/NN.png (9색 행 구조) | 주술사, 얼음, 폭발 등 |

### Free 팩 사용법
각 파일이 **9색 행 × N열 프레임** 구조.  
보라색 = row 1, 파란색 = row 2, 오렌지 = row 0.
```js
em.getFreeFrame('free77', progress, 10, 1, 9)   // 77.png, 보라 row
em.getFreeFrameLoop('free79', elapsed, 10, 8, 1, 9)
```

### 이펙트 타입 매핑
| 타입 | 용도 | 에셋 |
|------|------|------|
| `fire` | 화염 마법 | round_explosion |
| `ice` | 얼음 마법 | free63 파란 (row2) |
| `fire_arrow` | 불화살 | arrow + glow |
| `fireball` | 화염구 | round_explosion 대형 |
| `explosion` | 폭발 | free76 오렌지 (row0) |
| `lightning` | 번개 | lightning_strike |
| `magic` | 마법진 | magic_impact |
| `arcane` | 마법사 | gold_bolt strip |
| `dark_magic` | 리치 | purple_ring strip |
| `curse` | 주술사 | free77(피격) + free79(투사체) 보라 |
| `slash` | 근접 공격 | Slash Export type1 |
| `holy` | 성기사/사제 | Holy VFX 01 |

---

## 마법 시스템 (플레이어 입력)

### 카테고리 2개
- **대유닛**: 최전선 유닛 타격 → 유닛 없으면 성에 50% 피해 (쿨타임 없음)
- **공성**: 성벽 있으면 성벽 → 없으면 성 직격 (쿨타임 있음)

### words.js 구조
```js
WEAPON_WORDS: [
  { word, damage, effect, target: 'unit'|'siege', cooldown? }
]
BUILD_WORDS: [
  { word, type: 'unit'|'building', unit?, building?, hidden? }
]
```
**`target: 'building'`이나 `target: 'castle'`은 삭제됨. 반드시 `siege` 사용.**

---

## 랭크 시스템
- ELO 기반 LP 변동 (`calcLpChange`)
- 5티어: 브론즈(0), 실버(500), 골드(1000), 플래티넘(1500), 다이아(2000)
- Firestore `users` 컬렉션에 저장
- 랭크 게임 결과 화면에서 다시하기 버튼 없음

---

## UI/UX 규칙

### 색상
- **어두운 배경에 반투명 rgba 텍스트 금지**. 고정 hex 색 사용.
- 보조 텍스트 최소: `#888` 이상
- 섹션 라벨/힌트 최소: `#7878a8` 이상
- 설명 텍스트: `#b8d4ec` 이상 (MainMenu 기준)

### 폰트
- `Noto Sans KR` (Google Fonts, index.html에서 로드)
- 게임 내 모든 버튼: `font-family: inherit`

### 고정 너비
- 게임 캔버스: `1200 × 500`
- 전체 레이아웃: `width: 1200px` 고정 (모바일 미지원)

### 애니메이션 클래스 (index.css)
```
.anim-1~4    fadeInUp 순차 등장
.anim-2b     fadeInUp (anim-2와 anim-3 사이)
.anim-win    winPop 승리 연출
```

---

## 타이머 규칙
- 게임 타이머: `Date.now()` 기반 절대시간 사용 (탭 비활성화 시 rAF 멈춤 방지)
- `dt` 누적 방식 금지 (탭 전환 시 시간 튀는 문제 발생)

---

## BGM
- 파일: `public/assets/sound/(LOOP-READY) Track 8 - Upper Quarter_3.mp3`
- **게임 화면에서만 재생** (`screen === 'game'`)
- 뮤트 버튼: 좌상단 고정 (메뉴/게임 화면 모두 표시)
- 첫 클릭 전 자동재생 방지 (브라우저 정책)

---

## 소켓 이벤트 구조
| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `join_queue` | C→S | 일반 매칭 대기열 |
| `join_ranked_queue` | C→S | 랭크 매칭 대기열 |
| `create_custom_room` | C→S | 커스텀 방 생성 |
| `join_custom_room` | C→S | 커스텀 방 참가 |
| `matched` | S→C | 매칭 완료 |
| `opponent_build` | S→C | 상대방 빌드 단어 |
| `opponent_battle` | S→C | 상대방 전투 단어 |
| `rematch_request` | C→S | 재매칭 요청 |

---

## 자주 하는 실수

1. **sprite-inspector 좌표 믿기** — tiny-dungeon은 1px spacing. 반드시 인스펙터로 확인.
2. **target 타입 혼용** — `'building'`/`'castle'` 삭제됨. `'siege'`만 사용.
3. **새 진영 추가 시 FACTION_KO 누락** — DogamScreen 툴팁에 영어로 표시됨.
4. **반투명 텍스트** — `rgba(x,x,x,0.4)` 이하는 어두운 배경에서 안 보임. hex 고정색 사용.
5. **Date.now() 대신 dt 누적** — 탭 전환 시 타이머 튐.
6. **AI 마법 필터** — `_castAiSpell`에서 `target === 'siege'`로 필터해야 함. building/castle 아님.
