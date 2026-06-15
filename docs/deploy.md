# Energy Budget 배포 가이드

## 목적

14주차 목표의 배포 기준은 앱스토어 정식 출시가 아니라, 발표자 외의 사람이 프로젝트를 확인할 수 있는 산출물을 만드는 것입니다. Energy Budget은 현재 Expo 기반 모바일 MVP이므로 Android export, Web export, GitHub Pages 발표 자료를 배포 산출물로 관리합니다.

## 배포 산출물

| 산출물 | 위치 | 목적 |
|---|---|---|
| Android export | `dist-test/` | Expo Android 번들 검증 |
| Web export | `web-build/` | 브라우저 데모 백업 |
| 발표 PDF | `docs/Energy_Budget_2min_Presentation.pdf` | 발표용 PDF |
| WBS Gantt | `docs/Energy_Budget_WBS_Gantt.xlsx` | 진행 현황 확인 |
| GitHub Pages | `https://winjjws-hash.github.io/Finbit/` | URL 기반 발표 시작 |

## 빌드 종류

| 종류 | 명령 | 설명 |
|---|---|---|
| 개발 실행 | `npm run start` | Expo 개발 서버 실행 |
| Android 확인 | `npm run export:android` | Android 플랫폼 export 검증 |
| Web 확인 | `npm run export:web` | 웹 데모 산출물 생성 |
| 릴리스 전 검증 | `npm run verify:release` | 타입 검사, Android export, Web export 일괄 실행 |

## 명령어

```powershell
npm install
npm run typecheck
npm run export:android
npm run export:web
npm run verify:release
```

## 서명과 인증서 관리

현재 프로젝트는 스토어 제출용 APK, AAB, IPA를 생성하지 않았기 때문에 실제 keystore나 Apple 인증서는 사용하지 않습니다.

추후 EAS Build 또는 Google Play Internal Testing을 사용할 경우 다음 원칙을 지킵니다.

- keystore, 인증서, provisioning profile은 Git에 커밋하지 않습니다.
- `.gitignore`에 `*.jks`, `*.keystore`, `*.p8`, `*.p12`, `*.mobileprovision`을 포함합니다.
- EAS Build 사용 시 로컬 인증서 대신 Expo 계정 또는 EAS credentials를 사용합니다.

## 환경별 설정

현재 MVP는 외부 API를 사용하지 않지만, 배포 파이프라인을 위해 환경 파일 기준을 미리 정합니다.

| 파일 | 용도 | Git 커밋 여부 |
|---|---|---|
| `.env.example` | 필요한 환경 변수 예시 | 커밋 |
| `.env.dev` | 로컬 개발 설정 | 커밋 금지 |
| `.env.staging` | 발표 전 테스트 설정 | 커밋 금지 |
| `.env.prod` | 실제 배포 설정 | 커밋 금지 |

현재 `.env.example`:

```text
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_APP_ENV=dev
EXPO_PUBLIC_ENABLE_VERBOSE_LOG=false
```

## 배포 채널

| 채널 | 현재 상태 | 설명 |
|---|---|---|
| 로컬 Expo | 사용 가능 | 개발 중 빠른 확인 |
| Web export | 사용 가능 | PC 브라우저 데모 백업 |
| GitHub Pages | 사용 가능 | 발표 자료와 WBS 확인 |
| APK 사이드로드 | 다음 단계 | EAS Build 또는 Android Studio 필요 |
| 스토어 배포 | 이번 범위 제외 | 최종 포트폴리오 확장 시 검토 |

## 버전 관리 규칙

SemVer 형식을 사용합니다.

```text
MAJOR.MINOR.PATCH
0.1.0
```

- `PATCH`: 문구 수정, 발표자료 수정, 작은 버그 수정
- `MINOR`: 저장 기능, 리포트 등 새 기능 추가
- `MAJOR`: 데이터 구조나 앱 흐름이 크게 바뀌는 변경

## 롤백 방법

GitHub Pages 발표 자료가 잘못 올라간 경우:

```powershell
git -C "C:\Users\jjws0\Documents\energy-budget-gh-pages-worktree" log --oneline
git -C "C:\Users\jjws0\Documents\energy-budget-gh-pages-worktree" revert <commit-sha>
git -C "C:\Users\jjws0\Documents\energy-budget-gh-pages-worktree" push origin gh-pages
```

앱 코드가 잘못된 경우:

```powershell
git log --oneline
git revert <commit-sha>
npm run verify:release
```

## 발표 Q&A 답변

배포 질문을 받으면 이렇게 답합니다.

> 현재는 Expo 기반 MVP라서 Android export와 Web export로 실행 가능성을 검증했고, 발표 자료와 WBS는 GitHub Pages에 올려 URL로 바로 확인할 수 있게 했습니다. 스토어 제출은 다음 단계이며, 그때는 EAS Build와 인증서 관리를 적용할 계획입니다.
