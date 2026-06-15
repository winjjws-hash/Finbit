# 14주차 오늘의 목표 완료 정리

## 오늘의 목표 1. 모든 Must + Should 기능 동작

### Must 기능

| 기능 | 상태 | 설명 |
|---|---|---|
| 컨디션 입력 | 완료 | 피로도, 기분, 남은 시간을 입력 |
| 할 일 등록 | 완료 | 제목, 예상 시간, 에너지 소모량, 카테고리 입력 |
| 에너지 예산 계산 | 완료 | 컨디션을 기준으로 10부터 100 사이 점수 계산 |
| 추천과 미루기 분리 | 완료 | 예산 안의 일은 추천, 넘치는 일은 미루기로 분리 |
| 완료 체크 | 완료 | 작업을 터치하면 완료 상태 반영 |
| 초기화 | 완료 | 기본 상태로 되돌리기 |

### Should 기능

| 기능 | 상태 | 설명 |
|---|---|---|
| 과부하 상태 표시 | 완료 | 여유, 주의, 과부하 메시지 표시 |
| 카테고리 선택 | 완료 | 공부, 과제, 프로젝트, 운동, 회복 |
| 발표용 스크린샷 | 완료 | PDF와 GitHub Pages에 반영 |
| WBS 진행 상태 | 완료 | PDF와 엑셀에 반영 |
| Web 데모 백업 | 완료 | `npm run export:web` 스크립트 추가 |

## 오늘의 목표 2. 빌드 / 배포 파이프라인 정착

### 추가한 명령

```powershell
npm run typecheck
npm run export:android
npm run export:web
npm run verify:release
```

### 검증 결과

2026-06-09 기준 `npm run verify:release`를 실행했고 TypeScript 검사, Android export, Web export가 모두 통과했습니다.

### 배포 문서

`docs/deploy.md`에 다음 내용을 정리했습니다.

- 빌드 종류
- 서명과 인증서 관리
- 환경별 설정
- 배포 채널과 명령
- 버전 관리 규칙
- 롤백 방법

## 오늘의 목표 3. README + 4종 docs 완성

### README

프로젝트 소개, 가치 제안, 기능, 기술 스택, 실행, 빌드, 테스트, 문서 링크를 정리했습니다.

### 문서 4종 이상

| 문서 | 상태 | 내용 |
|---|---|---|
| `docs/setup.md` | 기존 완료 | 실행 방법 |
| `docs/architecture.md` | 기존 완료 | Mermaid 아키텍처 |
| `docs/deploy.md` | 신규 완료 | 배포 절차 |
| `docs/testing.md` | 신규 완료 | 테스트 명령과 시나리오 |
| `docs/security-checklist.md` | 신규 완료 | 보안 점검 |
| `docs/demo-backup.md` | 신규 완료 | 데모 백업 |

## 오늘의 목표 4. 최종 발표 슬라이드 거의 완성

현재 발표 자료는 8페이지 구성입니다.

1. 표지
2. 프로젝트 비전
3. 문제 정의
4. 사용 장면
5. 프로젝트 핵심
6. WBS 진행 상태
7. 설계 아키텍처
8. 감사합니다 Q&A

발표 대사는 `docs/presentation-script.md`에 정리했습니다.

## 오늘의 목표 5. 본인 데모 환경 백업

### 백업 경로

| 상황 | 백업 |
|---|---|
| Expo 실행 실패 | Web 실행 |
| Web 실행 실패 | GitHub Pages |
| 네트워크 실패 | 로컬 PDF |
| 앱 실행 실패 | 앱 스크린샷과 발표 PDF |

### 백업 파일

- `docs/Energy_Budget_2min_Presentation.pdf`
- `docs/Energy_Budget_WBS_Gantt.xlsx`
- `docs/app-screenshot.png`
- `docs/presentation-script.md`
- `README.md`

## 최종 상태 요약

Energy Budget은 14주차 기준으로 핵심 MVP 기능, 배포 검증 명령, README와 주요 문서, 발표 자료, 데모 백업 계획까지 갖춘 상태입니다. 남은 확장 작업은 SQLite 저장, 주간 리포트, 최종 리허설입니다.
