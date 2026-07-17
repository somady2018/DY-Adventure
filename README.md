# 오늘의 모험 (v0.8)

도영이가 보호자와 함께 한 기기에서 쓰는 로컬 우선 퀘스트 앱입니다.
React/Vite로 만든 정적 웹앱이며, 서버나 데이터베이스 없이 기기 안에만
데이터를 저장합니다. Capacitor로 감싼 안드로이드 앱 버전도 함께 빌드하며,
구글 플레이 정식 출시를 준비 중입니다.

현재 문서 기준은 **v0.8**입니다. 코드의 저장 데이터 스키마는
`schemaVersion: 9`(이전 데이터와 호환, 로딩 시 자동 마이그레이션)이고,
npm 패키지 버전은 아직 `1.0.0`으로 남아 있습니다.

서비스 주소: https://lumloom.github.io/adventure/

개인정보처리방침: https://lumloom.github.io/adventure/privacy.html

---

## 현재 버전 요약

- 제품 문서 기준: `v0.8`
- 저장 키: `adventure.appState.v1`
- 저장 스키마: `SCHEMA_VERSION = 9`
- 배포 방식: GitHub Pages, `main` 브랜치의 `/docs` 폴더 (웹) + Capacitor 안드로이드 앱
- 기본 저장 위치: 같은 브라우저의 `localStorage` (안드로이드 앱은 네이티브 저장소에 이중 기록)
- 대상 사용 흐름: 아이 화면과 보호자 화면을 한 기기에서 전환해 사용

### v0.8에서 중요한 변경

- 백업 파일(v2)에 PIN salt를 포함해, 백업 복원 후에도 보호자 PIN이 그대로 동작합니다.
- 잠금 화면에서 PIN을 10번 틀리면 "PIN을 잊으셨나요?" 복구 버튼이 나타나
  기록은 유지한 채 PIN만 재설정할 수 있습니다. (평소에는 숨겨져 있음)
- 보호자 화면(기록 백업 탭)에서 현재 PIN 확인 후 새 PIN으로 변경할 수 있습니다.
- Capacitor 안드로이드 앱 패키징을 추가했습니다. 앱에서는 데이터가 네이티브
  저장소에 미러링되고, 백업 내보내기는 안드로이드 공유 시트로 동작합니다.
- 개인정보처리방침 페이지(`docs/privacy.html`)를 추가했습니다.
- (스키마 8) 분할 보상 복구: `t11`/`t12`의 "지식 +2, 끈기 +2" 분할 보상이
  기존 저장 데이터에는 반영되지 않던 문제를 로딩 시 자동 복구합니다.
  (승인 전 퀘스트까지 복구, 이미 지급된 XP는 소급하지 않음)
- 템플릿 관리에 **보조 보상**이 생겼습니다. 한 퀘스트로 두 능력치에
  XP를 나눠주는 템플릿을 직접 만들 수 있습니다.
- (스키마 9) 시스템 기본 템플릿 6종을 샘플 품질로 재정리했습니다.
  대부분 분할 보상 구성으로 바뀌었고 일부 설명 문구를 다듬었으며,
  기존 저장 데이터에도 1회 동기화됩니다. 레거시 `t1`~`t16`은 신규
  사용자에게 시딩되지 않습니다.

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

백업 파일(JSON 내보내기)에는 앱 상태에 더해 `backupVersion: 2`와
`pinSalt`가 추가되어, 복원 시 보호자 PIN까지 함께 복구됩니다.
(이 두 필드는 앱 상태 저장소에는 기록되지 않고 백업 파일에만 존재합니다.)

```jsonc
{
  "schemaVersion": 9,
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
  "parentPinHash": "sha256:... 형식의 해시 문자열",
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
- 예전 데이터는 앱 로딩 시 `schemaVersion: 9`로 정규화됩니다.
- 스키마 2 이전 데이터는 기본 프로필을 보정합니다.
- 기본 시스템 템플릿은 현재 코드 기준으로 다시 병합됩니다.
- 기본 시스템 템플릿의 이름은 최신 이름으로 동기화됩니다.
- 커스텀 템플릿과 커스텀 퀘스트는 사용자가 만든 값을 유지합니다.
- (스키마 8) `t11`/`t12`처럼 코드에 분할 보상이 정의된 템플릿이 저장 데이터에
  `rewards` 없이 남아 있으면, 능력치를 직접 바꾸지 않은 경우에 한해 분할 보상을
  복구합니다. 승인 전(`open`/`pending`) 퀘스트도 함께 복구합니다.
- (스키마 9) 스키마 9 미만의 저장 데이터에는 시스템 기본 템플릿 6종의
  최신 내용(제목, 설명, 보상 구성)을 1회 동기화합니다. 승인 전 시스템
  퀘스트도 함께 갱신하며, 활성/반복/종류 설정은 유지합니다.
- 분할 보상 템플릿의 `defaultXp`는 항상 보상 합계와 같게 정규화됩니다.

---

## 기본 퀘스트 템플릿

### 시스템 기본 템플릿 6개

새로 시작하는 사용자에게 샘플이 되는 세트입니다. 대부분 두 능력치에
XP를 나눠주는 분할 보상으로 구성했습니다. (스키마 9에서 재정리)

| id | 이름 | 스토리 이름 | 타입 | 보상 |
|---|---|---|---|---|
| `base_wash` | 반짝반짝 정비 미션 | 몸과 마음 정비하기 | required | 생활력 +4 · 마음력 +1 |
| `base_read_15` | 지식의 문 열기 | 15분 독서하기 | choice | 지식 +4 · 탐구력 +2 |
| `base_school_bag` | 내일의 장비 챙기기 | 학교 준비물 챙기기 | required | 생활력 +3 · 탐구력 +3 |
| `base_meal` | 에너지 충전 작전 | 주어진 밥 잘 먹기 | required | 끈기 +3 · 용기 +2 |
| `base_room_clean` | 나만의 기지 정비 | 내 자리 정리하기 | choice | 생활력 +5 |
| `base_thank_you` | 마음빛 발견하기 | 고마운 일 하나 말하기 | choice | 마음력 +5 · 협동력 +3 |

설명 문구도 함께 다듬었습니다.

- `base_meal`: "정해진 식사량과 다양한 반찬을 먹으려고 노력해요."
- `base_thank_you`: "오늘 함께했던 사람과 좋았던 일을 말해봐요."

초기 일일 세트는 필수 `base_wash`, `base_school_bag`와 선택
`base_read_15`로 시작합니다.

### 레거시 추천 템플릿

`QUEST_TEMPLATES`의 `t1`~`t16`은 초기 버전에서 도영이를 위해 설계했던
템플릿으로, **새로 시작하는 사용자에게는 제공되지 않습니다** (신규 설치는
시스템 기본 6종만 시딩). 코드에 남겨둔 이유는 이 템플릿을 쓰던 기존
저장 데이터/백업의 마이그레이션 때문입니다.

`t11`과 `t12`는 지식 +2, 끈기 +2로 나누어 지급하며, 스키마 8부터 기존
저장 데이터에도 자동 복구됩니다. 템플릿 관리의 "보조 보상"으로 같은 형태의
템플릿을 직접 만들 수 있습니다.

---

## 주요 기능

- 아이 온보딩: 이름과 길드 선택
- 아이 화면: 오늘 퀘스트, 캐릭터, 스킬, 부모 메시지 확인
- 보호자 화면: PIN 입력 후 진입
- PIN 관리: 보호자 화면에서 PIN 변경, 잠금 화면에서 10회 실패 시 복구(재설정) 흐름
- 퀘스트 완료 요청: `open` -> `pending`
- 보호자 승인: XP 지급, 보상 연출, 레벨업 큐 등록
- 재도전 요청: 보호자 사유 표시 후 아이가 다시 시작 가능
- 템플릿 관리: 시스템 템플릿 수정/활성화, 커스텀 템플릿 생성/삭제,
  보조 보상(두 능력치에 XP 분할 지급) 설정
- 날짜별 퀘스트 등록과 제외
- 주간 리포트
- 응원 메시지 보내기
- JSON 내보내기/가져오기 (웹: 파일 다운로드, 안드로이드 앱: 공유 시트로 저장)
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
- 잠금 화면에서 10회 실패 시 나타나는 복구 흐름으로 PIN을 재설정할 수 있습니다.
  (기기 자체에 접근 가능한 사람을 막는 수준의 보안이 아니라는 전제입니다.)
- 백업 파일에는 PIN 해시와 salt가 포함되므로, 백업 파일 자체를 안전한 곳에 보관해야 합니다.
- 이 앱은 한 기기, 한 브라우저(또는 한 대의 안드로이드 기기) 사용을 전제로 합니다.
- 부모 폰과 아이 폰 사이의 실시간 동기화는 없습니다. (서버 없음 — 계정/동기화는 추후 검토)
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
├─ capacitor.config.json      # Capacitor 앱 설정 (appId, 앱 이름)
├─ assets/
│  └─ logo.png                # 앱 아이콘 원본 (1024px)
├─ android/                   # Capacitor 안드로이드 네이티브 프로젝트
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
│  │  ├─ pin.js
│  │  ├─ nativeMirror.js      # 앱: 네이티브 저장소 미러링
│  │  └─ nativeShare.js       # 앱: 백업 공유 시트
│  ├─ hooks/
│  │  ├─ useAppState.js
│  │  └─ useToast.js
│  ├─ components/
│  │  ├─ kid/
│  │  ├─ parent/
│  │  └─ shared/
│  └─ styles/
├─ docs/                      # GitHub Pages 배포 (privacy.html 포함)
├─ dist-tablet/
└─ dist-tablet.zip
```

---

## GitHub Pages 배포

현재 저장소는 `main` 브랜치의 `/docs` 폴더를 GitHub Pages 소스로 사용합니다.

배포 주소: https://lumloom.github.io/adventure/ (`lumloom/adventure` 저장소)

저장소는 원래 `somady2018/DY-Adventure`였다가 `lumloom/adventure`로
이전되었습니다. 옛 주소로의 push/fetch는 GitHub이 새 저장소로 리다이렉트하므로,
로컬 remote가 `origin`(옛 주소)이든 `lumloom`(새 주소)이든 같은 곳에 반영됩니다.

일반 절차:

```bash
npm run build
# 빌드 결과를 docs/ 와 dist-tablet/ 에 복사한 뒤
git add src docs dist-tablet dist-tablet.zip
git commit -m "Update app"
git push lumloom main
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

### 백업 내보내기 (앱)

앱의 WebView는 `<a download>`를 지원하지 않으므로, 앱에서는
`src/storage/nativeShare.js`가 백업 JSON을 캐시 폴더에 쓴 뒤 안드로이드
공유 시트를 띄웁니다. 구글 드라이브, 카카오톡 등으로 바로 보낼 수 있습니다.

### 빌드 절차

사전 준비: [Android Studio](https://developer.android.com/studio) 설치 (JDK 포함).
`android/local.properties`에 SDK 경로가 있어야 합니다 (Android Studio가 자동 생성).

```bash
npm run build          # 웹 빌드
npx cap sync android   # dist/ 를 안드로이드 프로젝트에 복사

# 테스트용 APK를 명령줄로 빌드하는 경우 (JAVA_HOME은 Android Studio 내장 JDK):
cd android
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ./gradlew assembleDebug
# 결과: android/app/build/outputs/apk/debug/app-debug.apk
```

또는 `npx cap open android`로 Android Studio에서 열어 실행(에뮬레이터/실기기)하거나,
Build > Generate Signed App Bundle 로 플레이 스토어용 .aab를 생성합니다.

### 앱 아이콘/스플래시 재생성

원본은 `assets/logo.png`(1024px, `public/icons/icon.svg`에서 렌더링)입니다.
로고를 바꾸면 아래 명령으로 안드로이드 리소스를 다시 생성합니다.

```bash
npx capacitor-assets generate --android \
  --iconBackgroundColor "#FFFDF7" --iconBackgroundColorDark "#FFFDF7" \
  --splashBackgroundColor "#FFFDF7" --splashBackgroundColorDark "#F5EEDB" \
  --logoSplashScale 0.4
```
