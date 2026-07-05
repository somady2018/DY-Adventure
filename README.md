# 오늘의 모험 — 로컬 MVP (v2)

도영이 한 명이 스마트폰 한 대에서 30일간 사용하는 것을 전제로 만든
로컬 전용 React(Vite) 애플리케이션입니다. 서버나 데이터베이스 없이
브라우저의 `localStorage`에만 데이터를 저장합니다.

---

## 1. 실행 방법

### 개발 모드로 실행 (코드를 수정하면서 보기)

```bash
npm install
npm run dev
```

터미널에 나온 `http://localhost:5173` 주소를 브라우저에서 엽니다.

### 프로덕션 빌드 (실제 사용할 버전)

```bash
npm install
npm run build
npm run preview
```

`npm run build`는 `dist/` 폴더에 최적화된 정적 파일을 생성합니다.
이 폴더를 그대로 정적 파일 서버(예: 핸드폰의 로컬 웹서버 앱, 또는
`npx serve dist`)에 올리면 인터넷 연결 없이도 동작합니다.

### 아이폰 홈 화면에 앱처럼 추가하기

1. `dist/` 폴더를 로컬 네트워크에서 접근 가능한 곳에 호스팅합니다
   (같은 와이파이의 PC에서 `npx serve dist --listen 0.0.0.0:8080` 등).
2. 아이폰 Safari에서 해당 주소로 접속합니다.
3. 공유 버튼 → "홈 화면에 추가"를 누르면 아이콘과 함께 앱처럼 실행됩니다.
   (manifest와 안전 영역(safe-area) 처리가 되어 있어 하단 home indicator와
   화면 콘텐츠가 겹치지 않습니다.)

---

## 2. localStorage 데이터 구조

키: `adventure.appState.v1` (PIN salt는 별도 키 `adventure.pinSalt.v1`에 저장)

```jsonc
{
  "schemaVersion": 1,
  "createdAt": "2026-06-22T05:00:00.000Z",

  "parentPinHash": "‹SHA-256 해시 문자열, 평문 PIN 아님›",

  // 추천 퀘스트 템플릿(definitions.js) 중 실제로 활성화된 것의 templateId 목록
  "activeTemplateIds": ["t1", "t2", "t3", "t4"],

  // 날짜별로 실제 배정된 퀘스트 "인스턴스". 템플릿과는 별개의 데이터입니다.
  "assignedQuests": [
    {
      "id": "q_1750... (생성 시각 기반 고유 id)",
      "date": "2026-06-22",          // Asia/Seoul 기준 YYYY-MM-DD
      "templateId": "t1",            // 직접 만든 퀘스트는 null
      "type": "required",            // required | choice | challenge | bonus
      "emoji": "🎒",
      "title": "출발 준비의 주문",
      "desc": "학교 준비물을 직접 확인하세요.",
      "statKey": "life",
      "xp": 5,
      // rewards가 있으면 여러 능력치에 걸친 보상(예: [{statKey:"knowledge",xp:2},{statKey:"grit",xp:2}]).
      // 없으면(null) 위 statKey/xp 하나만 지급하는 단일 보상 퀘스트입니다.
      "rewards": null,
      "status": "approved",          // open | pending | approved | retry | cancelled
      "createdAt": "2026-06-22T05:00:00.000Z",
      "submittedAt": "2026-06-22T06:10:00.000Z",
      "approvedAt": "2026-06-22T06:12:00.000Z",
      "xpGranted": true,             // 이 값이 true면 다시 승인해도 XP가 또 지급되지 않음
      "retryReason": null
    }
  ],

  // 능력치별 누적 XP (스킬트리 잠금 해제 기준)
  "statXp": { "life": 5, "knowledge": 0, "curiosity": 8, "grit": 0, "courage": 0, "teamwork": 0, "heart": 0 },

  // 캐릭터 전체 레벨 계산용 총 XP (능력치 합이 아닌 별도 총량)
  "totalXp": 13,

  // 보호자가 보낸 칭찬 메시지
  "parentMessages": [
    { "id": "m_175...", "text": "이번 주 정말 잘했어!", "createdAt": "...", "readAt": null }
  ],

  // 승인은 됐지만 아직 아이 화면에서 보상 연출을 보여주지 않은 퀘스트 id 큐
  "pendingCelebrations": []
}
```

**PIN 보안에 대한 정직한 설명**: PIN은 평문으로 저장하지 않고
`SHA-256(디바이스별 salt + PIN)` 해시로 저장합니다. 다만 이건 "브라우저
저장소를 열어봤을 때 PIN이 그대로 보이는 것"을 막는 수준의 보호이며,
서버 인증 수준의 보안은 아닙니다. 같은 기기·같은 브라우저를 쓰는
가족 1명이 30일 정도 쓰는 이 MVP의 목적에는 충분하지만, 여러 가정이
함께 쓰는 서비스로 확장한다면 서버 측 인증으로 반드시 교체해야 합니다.

---

## 2-1. 능력치 · 레벨 · 스킬 시스템 (`src/data/definitions.js`)

### 능력치 7종

| key | 이름 | 이모지 | 설명 |
|---|---|---|---|
| life | 생활력 | 🎒 | 스스로 챙기고 정리하는 힘 |
| knowledge | 지식 | 📖 | 읽고 배우며 쌓이는 힘 |
| curiosity | 탐구력 | 🔍 | 관찰하고 질문하는 힘 |
| grit | 끈기 | 🔥 | 다시 도전하는 힘 |
| courage | 용기 | ⚔️ | 표현하고 시도하는 힘 |
| teamwork | 협동력 | 🤝 | 함께 돕고 나누는 힘 |
| heart | 마음력 | 💛 | 마음을 알아채고 쉬는 힘 |

### 레벨 계산 공식

- **능력치별 레벨** (스킬트리 잠금 해제 기준, `levelFromXp`): 능력치 XP가 쌓이며 레벨업.
  필요 XP = `20 + (직전 레벨 - 1) × 8`. 누적 기준 Lv.3 = 48XP, Lv.4 = 84XP, Lv.8 = 308XP. 최대 50레벨.
- **캐릭터 전체 레벨** (`characterLevelFromTotalXp`): 능력치 합이 아니라 모든 퀘스트 보상의 총합(`totalXp`) 기준.
  필요 XP = `40 + (직전 레벨 - 1) × 15`. 0XP면 항상 Lv.1. 누적 기준 Lv.5 = 250XP, Lv.10 = 900XP. 최대 50레벨.

### 칭호 11단계 (`CHARACTER_TITLES`, 캐릭터 전체 레벨 기준)

Lv.1 견습 탐험가 → Lv.5 반짝 새싹 탐험가 → Lv.10 숲길 관찰자 → Lv.15 작은 연구 대장 →
Lv.20 용감한 도전가 → Lv.25 따뜻한 마음 지킴이 → Lv.30 지혜로운 길잡이 →
Lv.35 반짝이는 문제 해결사 → Lv.40 우리 집 모험 대장 → Lv.45 꿈을 키우는 탐험가 → Lv.50 전설의 어린 모험가

### 스킬 14종 (`SKILLS`, 능력치별 2개씩 · 각 능력치 레벨 기준 해금)

| 능력치 | 낮은 단계 (Lv.3~4) | 높은 단계 (Lv.8) |
|---|---|---|
| life | 🎒 가방 마스터 (Lv.3) | 🧼 생활 루틴 장인 (Lv.8) |
| knowledge | 📚 책장 넘기는 자 (Lv.3) | 📝 단어 수집가 (Lv.8) |
| curiosity | 🔬 작은 연구원 (Lv.4) | 👁️ 관찰자의 눈 (Lv.8) |
| grit | 💪 다시 한번! (Lv.4) | ⛰️ 차근차근 등반가 (Lv.8) |
| courage | 📢 용감한 말솜씨 (Lv.4) | 🚀 첫걸음 용사 (Lv.8) |
| teamwork | 🛡️ 우리 집 수호대 (Lv.4) | 🤲 도움의 손 (Lv.8) |
| heart | 💬 감정 통역사 (Lv.4) | 💛 따뜻한 경청가 (Lv.8) |

### 퀘스트 능력치 보상 (`getQuestRewards`)

퀘스트(템플릿/인스턴스)는 `rewards` 배열을 가질 수 있습니다. 예를 들어 t11("영어가 술술"),
t12("수학천재가 될테다")는 원래 지식 +5 하나였지만, 지금은 **지식 +2 · 끈기 +2**로 두
능력치에 나눠 지급하도록 바뀌었습니다 (`rewards: [{statKey:"knowledge",xp:2},{statKey:"grit",xp:2}]`).
`rewards`가 없는 퀘스트는 기존처럼 `statKey`/`xp` 하나만 지급합니다. 이미 기기에 저장된
(rewards 필드가 없는) 예전 퀘스트 기록도 그대로 정상 동작합니다.

### 능력치 × 스킬 × 현재 퀘스트 조합 분석

- 기본 활성 퀘스트(`DEFAULT_ACTIVE_TEMPLATE_IDS`: t1, t2, t4, t11, t10, t12)는 **life(2개) · knowledge(2개) ·
  curiosity(1개) · courage(1개)**, 총 4개 능력치만 XP를 채워줍니다. (t11, t12는 knowledge와 함께 grit에도
  XP를 조금씩 나눠주므로 grit도 소폭 채워집니다.)
- teamwork · heart 능력치를 주는 템플릿(t7, t8)은 기본값이 **비활성**이라, 관련 스킬 4종
  (우리 집 수호대/도움의 손, 감정 통역사/따뜻한 경청가)은 보호자가 등록 화면에서 해당 템플릿을 켜거나
  "직접 만들기"로 해당 능력치 퀘스트를 추가하지 않는 한 계속 잠긴 채로 남습니다.
- 7개 능력치를 고르게 성장시키려면 보호자가 최소 1개씩은 teamwork/heart 퀘스트를 활성화하는 것을
  권장합니다.

---

## 3. 실제로 구현된 기능 vs 아직 데모 수준인 기능

### 완전히 동작하는 기능

- localStorage 영속화 (새로고침/브라우저 종료 후에도 유지)
- 날짜별 퀘스트 분리, Asia/Seoul 기준 "오늘" 계산, 자정 경과 자동 감지
- 4자리 PIN 게이트 (최초 설정 2회 입력 확인 / 이후 입력 검증), 평문 미저장
- 완료 요청 → pending → 보호자 승인 → XP 지급의 전체 흐름
- 동일 퀘스트 중복 승인 방지 (서버 없이도 `xpGranted` 플래그로 1회 보장)
- 승인 버튼 즉시 비활성화 처리 (연타로 인한 의도치 않은 중복 클릭 방지)
- 재도전 요청 → 아이 화면에 이유 표시 → 다시 시작
- 추천 퀘스트 체크 해제 시 아이 화면에서 즉시 제외
- 직접 만들기(할 일·능력치·XP 4~12·타입·날짜 지정) → 토스트 알림
- 캐릭터 레벨을 능력치 합이 아닌 총 XP 기준으로 계산 (0XP면 항상 Lv.1)
- 최근 7일 approved 기준 주간 리포트, 기록 없을 때 단정적 문구 출력 안 함
- JSON 데이터 내보내기 / 가져오기(복원, 형태 검증 + 2단계 확인), 2단계 확인을 거치는 전체 초기화
- 다른 탭에서 데이터가 바뀌어도 동일한 마이그레이션 로직을 거쳐 안전하게 동기화
- 퀘스트가 여러 능력치에 걸친 보상(rewards)을 가질 수 있음 (예: 지식 +2 · 끈기 +2)
- 응원 메시지 보내기 → 아이 홈 화면에서 1회 확인 가능
- 클릭 가능한 요소는 모두 `<button>` + `aria-label` 적용
- Vite 프로덕션 빌드 (`npm run build`로 React production 빌드 산출,
  브라우저 Babel 변환 없음 — 빌드 결과물에서 직접 확인함)
- PWA manifest, 앱 이름, 아이콘(192/512), theme-color, iOS safe-area 대응

### 이번 버전에서 의도적으로 데모/미구현으로 남긴 기능

- **진짜 "비밀" 퀘스트 로직**: 화면에 보이는 건 모두 "보너스 퀘스트"라는
  이름으로 노출되는 일반 퀘스트입니다. 특정 행동을 감지해 조건부로
  나타나는 진짜 비밀 퀘스트 시스템은 구현하지 않았습니다 (요청하신 범위
  그대로입니다).
- **다른 탭/기기 간 실시간 동기화**: 같은 브라우저의 다른 탭이 storage
  이벤트로 갱신되는 정도는 구현했지만, 다른 기기(부모 폰 vs 아이 폰)
  간 동기화는 없습니다. 이 MVP는 "한 기기를 부모와 아이가 같이 쓰는"
  전제이기 때문입니다.
- **PWA 오프라인 캐싱(서비스워커)**: manifest와 홈 화면 추가는 지원하지만,
  완전 오프라인에서도 첫 로딩이 되는 서비스워커 캐싱까지는 넣지
  않았습니다. (이미 로드된 후 인터넷이 끊겨도 페이지 자체는 계속
  동작합니다. 단, 새로 강제 새로고침하면 네트워크가 필요합니다.)

---

## 4. 테스트 결과 (Playwright로 자동 검증)

아래는 실제로 브라우저를 띄워 클릭/입력을 수행한 자동화 테스트 결과입니다.

### 완료 요청 → 부모 승인 → 경험치 지급

| 검증 항목 | 결과 |
|---|---|
| 퀘스트 클릭 시 즉시 완료되지 않고 상세 확인창이 열림 | ✅ 통과 |
| "완료했어요" 클릭 시 보상 화면 없이 pending 처리됨 | ✅ 통과 |
| pending 카드에 "확인 대기 중" 문구 표시 (체크 아님) | ✅ 통과 |
| 보호자가 PIN 입력 후 보호자 화면 진입 | ✅ 통과 |
| 승인 버튼이 pending 큐에서 정상 노출 | ✅ 통과 |
| 승인 후 pending 큐에서 즉시 사라짐 | ✅ 통과 |
| 아이 화면 복귀 시 보상 연출이 정확히 1회 표시 | ✅ 통과 |

### 새로고침 후 데이터 유지

| 검증 항목 | 결과 |
|---|---|
| 새로고침 후 approved 상태가 유지됨 | ✅ 통과 |
| 새로고침 후 필수 퀘스트의 "열린" 개수가 0으로 정확히 유지 | ✅ 통과 (`requiredOpenCountAfterReload: "0"`) |
| 프로덕션 빌드(`npm run build` + `npm run preview`)에서도 정상 렌더링 | ✅ 통과 |

### 동일 퀘스트 중복 승인 방지

| 검증 항목 | 결과 |
|---|---|
| 새로고침 후 PIN 재입력 시 이미 승인된 퀘스트가 대기 목록에 다시 나타나지 않음 | ✅ 통과 |
| 같은 퀘스트를 재도전 → 다시 완료 → 재승인해도 해당 능력치 XP가 정확히 1회분(+8)만 반영 | ✅ 통과 (`curiosityXpGrantedOnce: true`) |

### 재도전(retry) 플로우

| 검증 항목 | 결과 |
|---|---|
| 보호자가 재도전 요청 시 pending 큐에서 제거됨 | ✅ 통과 |
| 아이 화면에 보호자가 남긴 재도전 이유가 표시됨 | ✅ 통과 |
| "다시 시작하기"로 open 상태로 복귀 후 재요청 가능 | ✅ 통과 |

### 코드 품질

| 항목 | 결과 |
|---|---|
| `npm run lint` | ✅ 오류 0건 |
| `npm run build` | ✅ 정상 빌드 (`dist/` 산출물에 dev 모드 React, Babel 흔적 없음 직접 grep으로 확인) |

---

## 5. 알아두면 좋은 점 / 알려진 제약

- 이 앱은 "한 아이 + 한 보호자가 하나의 브라우저를 같이 쓰는" 모델입니다.
  부모 폰과 아이 폰이 분리된 진짜 2-디바이스 서비스가 아닙니다.
- PIN 보호는 가족 내 사용을 위한 가벼운 잠금이며, 강력한 보안 메커니즘은
  아닙니다.
- 날짜 계산은 기기의 시스템 시간대 설정과 무관하게 항상 `Asia/Seoul`
  기준으로 동작합니다 (해외 여행 중에도 한국 기준 "오늘"을 유지).
- 폰트는 Google Fonts(Jua/Gaegu/Gowun Batang/Nanum Gothic)를 CDN에서
  불러옵니다. 네트워크가 막힌 환경에서는 시스템 한글 폰트로 자동
  대체되며 기능에는 영향이 없습니다.

## 폴더 구조

```
adventure-v2/
├─ index.html
├─ manifest.webmanifest 관련 파일은 public/ 에 위치
├─ public/
│  ├─ icons/            앱 아이콘 (svg, 192px, 512px)
│  └─ manifest.webmanifest
├─ src/
│  ├─ App.jsx            최상위: 모드 전환(아이/PIN/보호자), 날짜 동기화
│  ├─ main.jsx
│  ├─ data/
│  │  ├─ definitions.js  능력치·스킬·퀘스트 템플릿 등 정적 데이터
│  │  └─ weeklyReport.js 최근 7일 리포트 계산 + 서술형 문장 생성
│  ├─ storage/
│  │  ├─ state.js        스키마, 초기상태, 퀘스트 인스턴스 생성
│  │  ├─ dateUtils.js     Asia/Seoul 날짜 계산
│  │  └─ pin.js           PIN 해싱 (SHA-256 + salt)
│  ├─ hooks/
│  │  ├─ useAppState.js  모든 액션(승인/재도전/등록/초기화 등)과 저장 동기화
│  │  └─ useToast.js
│  ├─ components/
│  │  ├─ kid/             아이 화면 (홈/캐릭터/스킬트리/퀘스트 상세 모달)
│  │  ├─ parent/          보호자 화면 (오늘/등록/리포트/데이터/PIN)
│  │  └─ shared/          퀘스트 카드, 토스트, 확인 다이얼로그
│  └─ styles/             base / components / screens 3개 CSS 파일
```

---

## 6. GitHub Pages 재배포 가이드

이 프로젝트는 저장소 `https://github.com/somady2018/DY-Adventure` 의 `main` 브랜치 `/docs`
폴더를 GitHub Pages 소스로 사용해 `https://somady2018.github.io/DY-Adventure/` 주소로
서비스되고 있습니다. Vite의 기본 빌드 출력 폴더인 `dist/`는 `.gitignore`에 포함되어 커밋되지
않으므로, 배포하려면 빌드 결과를 `docs/`로 복사해서 커밋해야 합니다.

### 코드 수정 후 다시 배포하는 절차

1. `src/` 이하 코드를 수정합니다.
2. 로컬에서 정상 동작을 확인합니다.
   ```bash
   npm install
   npm run dev
   ```
3. 프로덕션 빌드를 생성합니다.
   ```bash
   npm run build
   ```
   `dist/` 폴더에 `index.html`, `assets/`, 아이콘 등이 생성됩니다.
4. 빌드 결과를 `docs/`로 복사합니다 (기존 `docs/` 내용을 덮어씁니다).
   ```bash
   rm -rf docs
   mkdir docs
   cp -r dist/* docs/
   ```
5. 변경사항을 커밋하고 GitHub에 푸시합니다.
   ```bash
   git add -A
   git commit -m "설명: 무엇을 바꿨는지"
   git push origin main
   ```
6. 보통 1~2분 안에 `https://somady2018.github.io/DY-Adventure/` 에 반영됩니다.
   화면이 그대로면 브라우저 강력 새로고침(Cmd/Ctrl+Shift+R) 후 다시 확인하세요.

### 참고

- `docs/index.html`은 이제 `assets/*.js`, `assets/*.css`로 분리된 일반적인 Vite 빌드 구조입니다
  (예전에는 JS/CSS가 한 파일에 인라인된 단일 파일이었습니다). `vite.config.js`의 `base: './'`
  설정 덕분에 GitHub Pages 하위 경로(`/DY-Adventure/`)에서도 정상 동작합니다.
- GitHub Pages 소스 브랜치/폴더 설정은 저장소의 **Settings → Pages**에서 확인·변경할 수 있습니다.
  현재는 `main` / `/docs` 구성으로 추정되니, 다르게 되어 있다면 그에 맞춰 조정하세요.
