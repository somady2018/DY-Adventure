# 오늘의 모험 (v0.7)

도영이가 보호자와 함께 한 기기에서 쓰는 로컬 우선 퀘스트 앱입니다.
React/Vite로 만든 정적 웹앱이며, 서버나 데이터베이스 없이 브라우저
`localStorage`에 데이터를 저장합니다.

현재 문서 기준은 **v0.7**입니다. 코드의 저장 데이터 스키마는
`schemaVersion: 7`이고, npm 패키지 버전은 아직 `1.0.0`으로 남아 있습니다.

서비스 주소: https://somady2018.github.io/DY-Adventure/

---

## 현재 버전 요약

- 제품 문서 기준: `v0.7`
- 저장 키: `adventure.appState.v1`
- 저장 스키마: `SCHEMA_VERSION = 7`
- 배포 방식: GitHub Pages, `main` 브랜치의 `/docs` 폴더
- 기본 저장 위치: 같은 브라우저의 `localStorage`
- 대상 사용 흐름: 아이 화면과 보호자 화면을 한 기기에서 전환해 사용

### v0.7에서 중요한 변경

- 기존 브라우저에 저장되어 있던 기본 템플릿 6개의 이름을 현재 코드 기준으로 동기화합니다.
- 저장된 오늘 퀘스트가 기본 템플릿에서 만들어진 경우, 그 퀘스트의 이름도 함께 갱신합니다.
- 직접 만든 템플릿과 직접 만든 퀘스트 이름은 건드리지 않습니다.
- 저장 데이터 키는 그대로 `adventure.appState.v1`을 유지해 기존 데이터와 호환됩니다.

---

## 실행 방법

### 개발 모드

```bash
npm install
npm run dev
```

터미널에 표시되는 `http://localhost:5173` 주소를 브라우저에서 엽니다.

### 프로덕션 빌드

```bash
npm install
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

### 배포용 파일 갱신

GitHub Pages는 `docs/` 폴더를 사용합니다. 배포하려면 빌드 결과를
`docs/`와 태블릿 배포 폴더에 복사한 뒤 커밋/푸시해야 합니다.

```powershell
npm.cmd run build

$root = Resolve-Path .
$docsAssets = Resolve-Path .\docs\assets
$tabletAssets = Resolve-Path .\dist-tablet\assets
Remove-Item -LiteralPath (Join-Path $docsAssets.Path '*') -Force
Remove-Item -LiteralPath (Join-Path $tabletAssets.Path '*') -Force
Copy-Item -Path .\dist\* -Destination .\docs -Recurse -Force
Copy-Item -Path .\dist\* -Destination .\dist-tablet -Recurse -Force
Compress-Archive -Path .\dist-tablet\* -DestinationPath .\dist-tablet.zip -Force
```

---

## 저장 데이터 구조

키: `adventure.appState.v1`

PIN salt는 별도 키 `adventure.pinSalt.v1`에 저장됩니다.

```jsonc
{
  "schemaVersion": 7,
  "createdAt": "2026-07-08T00:00:00.000Z",
  "profile": {
    "childName": "도영",
    "guild": "adventurer",
    "createdAt": "2026-07-08T00:00:00.000Z",
    "updatedAt": "2026-07-08T00:00:00.000Z"
  },
  "dailyLetter": {
    "lastShownDate": null,
    "lastMessageId": null
  },
  "parentPinHash": "SHA-256 해시 문자열",
  "questTemplates": [],
  "questSets": {
    "dailyRequiredTemplateIds": ["base_wash", "base_school_bag"],
    "dailyChoiceTemplateIds": ["base_read_15"],
    "dailyChallengeTemplateIds": []
  },
  "activeTemplateIds": ["t1", "t2", "t4", "t11", "t10", "t12"],
  "assignedQuests": [],
  "statXp": {
    "life": 0,
    "knowledge": 0,
    "curiosity": 0,
    "grit": 0,
    "courage": 0,
    "teamwork": 0,
    "heart": 0
  },
  "totalXp": 0,
  "parentMessages": [],
  "pendingCelebrations": [],
  "pendingLevelUps": []
}
```

### 저장 호환성

- `adventure.appState.v1` 키는 유지합니다.
- 예전 데이터는 앱 로딩 시 `schemaVersion: 7`로 정규화됩니다.
- 스키마 2 이전 데이터는 기본 프로필을 보정합니다.
- 기본 시스템 템플릿은 현재 코드 기준으로 다시 병합됩니다.
- 기본 시스템 템플릿의 이름은 최신 이름으로 동기화됩니다.
- 커스텀 템플릿과 커스텀 퀘스트는 사용자가 만든 값을 유지합니다.

---

## 기본 퀘스트 템플릿

### 시스템 기본 템플릿 6개

| id | 이름 | 스토리 이름 | 타입 | 능력치 | XP |
|---|---|---|---|---|---|
| `base_wash` | 반짝반짝 정비 미션 | 몸과 마음 정비하기 | required | 생활력 | 5 |
| `base_read_15` | 지식의 문 열기 | 15분 독서하기 | choice | 지식 | 6 |
| `base_school_bag` | 내일의 장비 챙기기 | 학교 준비물 챙기기 | required | 생활력 | 5 |
| `base_meal` | 에너지 충전 작전 | 주어진 밥 잘 먹기 | required | 끈기 | 5 |
| `base_room_clean` | 나만의 기지 정비 | 내 자리 정리하기 | choice | 생활력 | 5 |
| `base_thank_you` | 마음빛 발견하기 | 고마운 일 하나 말하기 | choice | 마음력 | 5 |

초기 일일 세트는 필수 `base_wash`, `base_school_bag`와 선택
`base_read_15`로 시작합니다.

### 레거시 추천 템플릿

`QUEST_TEMPLATES`에는 기존 추천 템플릿 `t1`부터 `t16`까지 남아 있습니다.
기본 활성 ID는 다음 6개입니다.

```js
["t1", "t2", "t4", "t11", "t10", "t12"]
```

`t11`과 `t12`는 단일 지식 보상이 아니라 지식 +2, 끈기 +2로 나누어 지급합니다.

---

## 주요 기능

- 아이 온보딩: 이름과 길드 선택
- 아이 화면: 오늘 퀘스트, 캐릭터, 스킬, 부모 메시지 확인
- 보호자 화면: PIN 입력 후 진입
- 퀘스트 완료 요청: `open` -> `pending`
- 보호자 승인: XP 지급, 보상 연출, 레벨업 큐 등록
- 재도전 요청: 보호자 사유 표시 후 아이가 다시 시작 가능
- 템플릿 관리: 시스템 템플릿 수정/활성화, 커스텀 템플릿 생성/삭제
- 날짜별 퀘스트 등록과 제외
- 주간 리포트
- 응원 메시지 보내기
- JSON 내보내기/가져오기
- 전체 초기화
- 다른 탭에서 같은 저장 키가 바뀌면 마이그레이션을 거쳐 동기화

---

## 능력치와 레벨

능력치는 7종입니다.

| key | 이름 |
|---|---|
| `life` | 생활력 |
| `knowledge` | 지식 |
| `curiosity` | 탐구력 |
| `grit` | 끈기 |
| `courage` | 용기 |
| `teamwork` | 협동력 |
| `heart` | 마음력 |

능력치별 레벨은 `levelFromXp`로 계산합니다.

- 시작 레벨: 1
- 최대 레벨: 50
- 다음 레벨 필요 XP: `20 + (현재 레벨 - 1) * 8`

캐릭터 전체 레벨은 `characterLevelFromTotalXp`로 계산합니다.

- 시작 레벨: 1
- 최대 레벨: 50
- 다음 레벨 필요 XP: `40 + (현재 레벨 - 1) * 15`
- 기준 값: 능력치 합산값이 아니라 승인된 퀘스트 보상의 총합 `totalXp`

---

## 보안과 제약

- PIN은 평문으로 저장하지 않고 `SHA-256(salt + PIN)` 해시로 저장합니다.
- 이 PIN은 가족용 가벼운 잠금 장치입니다. 서버 인증 수준의 보안은 아닙니다.
- 이 앱은 한 기기, 한 브라우저 사용을 전제로 합니다.
- 부모 폰과 아이 폰 사이의 실시간 동기화는 없습니다.
- PWA manifest와 홈 화면 추가는 지원하지만, 서비스워커 기반 완전 오프라인 첫 로딩은 없습니다.
- 날짜 계산은 `Asia/Seoul` 기준입니다.

---

## 검증

최근 확인한 기준:

- `npm.cmd run build`: 통과
- `eslint src`: 통과

주의: `npm run lint`는 현재 `docs/`와 `dist-tablet/`의 빌드 산출물까지 함께 검사할 수 있습니다.
그 경우 압축된 번들 파일 때문에 소스 코드와 무관한 lint 오류가 날 수 있으므로, 코드 품질 확인은
소스 범위인 `eslint src`를 기준으로 봅니다.

---

## 폴더 구조

```text
DY-Adventure/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
│  ├─ icons/
│  └─ manifest.webmanifest
├─ src/
│  ├─ App.jsx
│  ├─ main.jsx
│  ├─ data/
│  │  ├─ definitions.js
│  │  └─ weeklyReport.js
│  ├─ storage/
│  │  ├─ state.js
│  │  ├─ dateUtils.js
│  │  └─ pin.js
│  ├─ hooks/
│  │  ├─ useAppState.js
│  │  └─ useToast.js
│  ├─ components/
│  │  ├─ kid/
│  │  ├─ parent/
│  │  └─ shared/
│  └─ styles/
├─ docs/
├─ dist-tablet/
└─ dist-tablet.zip
```

---

## GitHub Pages 배포

현재 저장소는 `main` 브랜치의 `/docs` 폴더를 GitHub Pages 소스로 사용합니다.

배포 주소:

- https://lumloom.github.io/adventure/ (운영, `lumloom/adventure` 저장소)
- https://somady2018.github.io/DY-Adventure/ (`somady2018/DY-Adventure` 저장소)

일반 절차:

```bash
npm run build
# 빌드 결과를 docs/ 와 dist-tablet/ 에 복사한 뒤
git add src docs dist-tablet dist-tablet.zip
git commit -m "Update app"
git push origin main      # somady2018/DY-Adventure
git push lumloom main     # lumloom/adventure (GitHub Pages 운영 배포)
```

푸시 후 보통 1~2분 안에 GitHub Pages에 반영됩니다.

---

## 안드로이드 앱 (Capacitor)

구글 플레이 출시를 위해 Capacitor로 안드로이드 앱을 빌드합니다.

- 앱 ID: `io.github.lumloom.adventure` (플레이 스토어 등록 후 변경 불가)
- 앱 이름: 오늘의모험
- `android/` 폴더가 안드로이드 네이티브 프로젝트입니다.

### 데이터 저장 구조

네이티브 앱에서는 WebView localStorage가 OS에 의해 삭제될 수 있으므로,
`src/storage/nativeMirror.js`가 모든 저장을 Capacitor Preferences
(안드로이드 SharedPreferences)에 미러링합니다. 앱 시작 시 localStorage가
비어 있으면 네이티브 저장소에서 복원합니다. 웹에서는 전부 no-op입니다.

### 빌드 절차

사전 준비: [Android Studio](https://developer.android.com/studio) 설치 (JDK 포함).

```bash
npm run build          # 웹 빌드
npx cap sync android   # dist/ 를 안드로이드 프로젝트에 복사
npx cap open android   # Android Studio로 열기
```

Android Studio에서 실행(에뮬레이터/실기기 테스트)하거나,
Build > Generate Signed App Bundle 로 플레이 스토어용 .aab를 생성합니다.
