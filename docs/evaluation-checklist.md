# Energy Budget - 평가 기준 체크리스트

이 문서는 교수님 평가 기준에 맞춰 Energy Budget 프로젝트가 어떤 산출물로 점수를 충족하는지 정리한 체크리스트입니다.

## 1. 발표 체계성 10점

| 기준 | 준비 내용 | 위치 |
|---|---|---|
| 비전을 표현하였는가? | 시간 중심에서 에너지 중심으로 바꾸는 비전 | `README.md`, `.planning/00-vision.md`, 최종 PDF |
| 비전에 대해 와닿게 표현하였는가? | 더 많이 하는 앱이 아니라 오늘의 나를 기준으로 계획을 다시 세우는 앱 | `README.md`, 발표 대본 |
| 문제 정의를 표현하였는가? | 계획 실패는 의지 부족이 아니라 과부하 설계 문제 | `README.md`, `.planning/00-vision.md` |
| 문제 정의가 공감대를 불러일으키는가? | 시간이 남아도 피곤하면 계획을 못 지키는 상황 | 최종 PDF, 발표 대본 |
| 비전 및 문제정의 대사 준비 | 4분 30초 발표 대본과 페이지별 대사 | `docs/presentation-script.md` |
| WBS 표현 | 10주차~15주차 WBS와 FM WBS | `.planning/02-wbs.md`, `docs/Energy_Budget_WBS_Gantt.xlsx` |
| 적용 기술 표현 | React Native, Expo, TypeScript, AsyncStorage, GitHub Pages | `README.md`, 최종 PDF |
| 프로젝트 진행 및 완료 표현 | 10~15주차 진행률과 MVP 완료 범위 | `README.md`, 최종 PDF |
| 구현 방법 설명 | 에너지 예산 계산, 추천/미루기 분리, 날짜별 저장 | `README.md`, `src/domain/rules/energyBudgetRules.ts` |
| 활용 방법 설명 | 과제 많은 날, 컨디션 낮은 날, 주간 리포트 확장 | `README.md`, 최종 PDF |

## 2. 질의응답 5점

| 기준 | 준비 내용 | 위치 |
|---|---|---|
| ADR 최소 3개 표시 | ADR-0001~ADR-0004 | `.planning/decisions/` |
| 앱 구조 설명 | presentation/application/domain/data | `docs/architecture.md`, `README.md` |
| 개발 환경 설정 | npm install, npm run start, Expo 실행 | `docs/setup.md`, `README.md` |
| 빌드와 배포 과정 | typecheck, test, export, GitHub Pages | `docs/deploy.md`, `README.md` |
| ADR 기준 답변 | 상황 - 결정 - 이유 - 결과 순서 답변 | 최종 PDF Q&A, `README.md` |

## 3. 개발자 기본소양 10점

| 기준 | 준비 내용 | 위치 |
|---|---|---|
| 기술 설명 | 모바일 MVP를 위한 React Native + Expo 선택 | `README.md`, ADR-0001 |
| 아키텍처 이해 | 레이어 분리와 Mermaid 다이어그램 | `docs/architecture.md` |
| 구현 시행착오 | 기능 과다, UI 크기, 알림 위치 개선 | `README.md` |
| 개발환경 구성 | Node/npm/Expo 설치와 실행 | `docs/setup.md` |
| 개선 의지 | SQLite, 주간 리포트, 에너지 패턴 분석 | `README.md` |
| 성능 최적화 | 필요한 계산만 다시 수행, UI 여백 개선 | `README.md` |
| 코드 품질 관리 | TypeScript, domain 분리, repository 구조 | `README.md` |
| 단위 테스트 | 에너지 예산 계산 규칙 테스트 | `tests/domain-rules.test.mjs` |
| 통합 테스트 | 조건과 할 일이 연결되어 계획이 생성되는 흐름 | `tests/domain-rules.test.mjs` |
| 설치 가이드 | GitHub 설치 관련 가이드 | `README.md`, `docs/setup.md` |

## 4. 결과물 품질 5점

| 기준 | 준비 내용 | 위치 |
|---|---|---|
| 30초 시연 데모 | 닉네임, 컨디션, 할 일 추가, 추천, 달력 확인 | `README.md`, 최종 PDF |
| 앱 형태 구성 | 모바일 카드 UI, 알림 현황, 월간 달력 | `src/presentation/screens/HomeScreen.tsx` |
| 기본 기능 구성 | 입력, 수정, 삭제, 추천, 저장, 알림 현황 | `src/presentation/screens/HomeScreen.tsx` |
| 순차적 시연 | 사용자 시나리오 기반 데모 순서 | `README.md` |
| 임팩트 있는 데모 | 오늘 못 해도 괜찮은 일을 골라주는 앱 | 발표 대본 |

## 문서화 5점

- 기획서 및 요구사항 충족: `.planning/00-vision.md`, `.planning/01-requirements.md`
- WBS/일정 충족: `.planning/02-wbs.md`, `.planning/04-schedule.md`
- 아키텍처/ADR 충족: `docs/architecture.md`, `.planning/decisions/`
- setup/deploy/testing 문서 충족: `docs/setup.md`, `docs/deploy.md`, `docs/testing.md`
- AGENTS.md 및 README 충족: `AGENTS.md`, `README.md`

## 가산점

- AI Agent / 스킬 / 워크플로우 적극 활용: `docs/agent-workflow.md`
- 본인만의 기법: `AGENTS.md`에 agent / skills / workflow / rules / commands 통합
- 최신 LLM Wiki 기반 암묵지 관리 운영: `docs/llm-wiki.md`
