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
- JSON 데이터 내보내기, 2단계 확인을 거치는 전체 초기화
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
