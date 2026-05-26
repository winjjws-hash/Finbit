# Energy Budget - 프로젝트 산출물 통합 정리

## 1. 프로젝트 한 줄 소개

Energy Budget은 사람들의 하루 계획을 시간 중심에서 에너지 중심으로 바꾸어, 무리하지 않아도 꾸준히 성장할 수 있는 지속 가능한 일상을 만드는 모바일 앱이다.

## 2. 지금까지 완료한 전체 목표

| 구분 | 목표 | 완료 상태 | 확인 파일 |
|---|---|---|---|
| Week 10 | 비전과 목표 작성 | 완료 | `.planning/00-vision.md` |
| Week 10 | 사용자 시나리오와 요구사항 작성 | 완료 | `.planning/01-requirements.md` |
| Week 10 | MoSCoW 기능 분류 | 완료 | `.planning/01-requirements.md` |
| Week 10 | WBS 작성 | 완료 | `.planning/02-wbs.md` |
| Week 10 | 위험 식별과 대응 | 완료 | `.planning/03-risks.md` |
| Week 10 | 6주 일정 작성 | 완료 | `.planning/04-schedule.md` |
| Week 10 | BONUS 초안 | 완료 | `BONUS.md` |
| Week 11 | 모바일 플랫폼 선택 ADR | 완료 | `.planning/decisions/ADR-0001-mobile-platform.md` |
| Week 11 | 상태관리 ADR | 완료 | `.planning/decisions/ADR-0002-state-management.md` |
| Week 11 | 백엔드/저장 방식 ADR | 완료 | `.planning/decisions/ADR-0003-backend-choice.md` |
| Week 11 | 프로젝트 주제 ADR | 완료 | `.planning/decisions/ADR-0004-project-topic.md` |
| Week 11 | 아키텍처 문서 | 완료 | `docs/architecture.md` |
| Week 11 | 실행 가이드 문서 | 완료 | `docs/setup.md` |
| Week 11 | Hello World 앱 구조 | 완료 | `App.tsx`, `src/` |
| Week 11 | 3회 점검 기록 | 완료 | `docs/week-11-checkpoints.md` |
| Week 11 | 중간 발표 초안 | 완료 | `docs/midterm-presentation-draft.md` |
| Week 11 | Week 11 완료표 | 완료 | `docs/week-11-completion.md` |

## 3. Week 10 산출물 요약

### 3.1 비전

Energy Budget은 사용자의 피로도, 기분, 남은 시간을 기준으로 하루 에너지 예산을 계산하고, 무리하지 않는 계획을 추천한다.

### 3.2 핵심 사용자 시나리오

1. 아침에 오늘 감당 가능한 계획을 세운다.
2. 하루 중 계획이 무너졌을 때 남은 에너지 기준으로 다시 조정한다.
3. 일주일 기록을 보고 생활 패턴을 돌아본다.

### 3.3 Must 기능

- 오늘의 컨디션 입력
- 할 일 등록
- 에너지 예산 계산
- 오늘 할 일 추천
- 일일 계획 결과 저장

### 3.4 가장 큰 위험

가장 큰 위험은 기능을 너무 많이 넣다가 MVP를 완성하지 못하는 것이다. 따라서 초기 버전은 외부 캘린더, 웨어러블, AI 상담 기능을 제외하고 핵심 흐름에 집중한다.

## 4. Week 11 PDF 목표 적용 결과

| PDF 목표 | Energy Budget 적용 결과 |
|---|---|
| 큰 그림 이해 | Week 10 기획 산출물과 Week 11 설계 산출물을 연결해 정리 |
| 모바일 앱 플랫폼 선택과 ADR 기록 | React Native + Expo + TypeScript 선택, ADR-0001 작성 |
| 아키텍처 다이어그램과 디렉토리 구조 확정 | Presentation / Application / Domain / Data 구조 확정 |
| 빌드되는 Hello World 상태 | Expo 첫 화면에서 Energy Budget 샘플 화면 표시 |
| `docs/setup.md`, `docs/architecture.md` 작성 | 실행 가이드와 아키텍처 설명 작성 완료 |
| 실습 중 3회 점검 | ADR 설명, 구조 설명, 실행 검증을 `week-11-checkpoints.md`에 기록 |

## 5. 현재 프로젝트 구조

```text
.
├── App.tsx
├── package.json
├── app.json
├── README.md
├── BONUS.md
├── .planning/
│   ├── 00-vision.md
│   ├── 01-requirements.md
│   ├── 02-wbs.md
│   ├── 03-risks.md
│   ├── 04-schedule.md
│   └── decisions/
├── docs/
│   ├── architecture.md
│   ├── setup.md
│   ├── week-11-checkpoints.md
│   ├── week-11-completion.md
│   ├── midterm-presentation-draft.md
│   └── project-completion-summary.md
└── src/
    ├── presentation/
    ├── application/
    ├── domain/
    └── data/
```

## 6. 아키텍처 설명

Energy Budget은 네 개의 역할로 나누어 만든다.

| 레이어 | 역할 | 폴더 |
|---|---|---|
| Presentation | 사용자가 보는 화면 | `src/presentation` |
| Application | 화면에 필요한 데이터 흐름 | `src/application` |
| Domain | 에너지 예산 계산 규칙 | `src/domain` |
| Data | 저장과 불러오기 | `src/data` |

발표할 때는 이렇게 말하면 된다.

> 화면은 `presentation`, 화면에 필요한 데이터 준비는 `application`, 에너지 계산 규칙은 `domain`, 저장 기능은 `data`에 두었습니다. 이렇게 나눈 이유는 화면 코드와 계산 규칙이 섞이지 않게 해서, 나중에 수정하고 설명하기 쉽게 만들기 위해서입니다.

## 7. ADR 결정 요약

| ADR | 결정 | 한 줄 이유 |
|---|---|---|
| ADR-0001 | React Native + Expo + TypeScript | 6주 안에 모바일 MVP를 빠르게 만들고 실행하기 좋음 |
| ADR-0002 | React 기본 상태 + ViewModel 함수 | 초급자가 이해하기 쉽고 현재 기능에 충분함 |
| ADR-0003 | 로컬 저장소 우선 | 서버 없이도 핵심 기능을 검증할 수 있음 |
| ADR-0004 | Energy Budget 주제 선택 | 실생활 사용성과 포트폴리오 활용성이 모두 있음 |

## 8. 실행 방법

```bash
npm install
npm run start
```

Expo 화면이 뜨면 휴대폰의 Expo Go 앱으로 QR 코드를 스캔하거나, 터미널에서 `w`를 눌러 웹 미리보기로 확인한다.

## 9. 최신 검증 결과

아래 명령을 실행해 확인했다.

```bash
npm run typecheck
npx expo install --check
npx expo export --platform android --output-dir dist-test
```

결과:

- TypeScript 검사 통과
- Expo 의존성 호환성 검사 통과
- Android 번들 export 성공
- 검증용 `dist-test` 폴더는 정리 완료

## 10. VS Code에서 보여줄 순서

1. `docs/project-completion-summary.md`
2. `.planning/00-vision.md`
3. `.planning/01-requirements.md`
4. `.planning/02-wbs.md`
5. `.planning/04-schedule.md`
6. `.planning/decisions/ADR-0001-mobile-platform.md`
7. `docs/architecture.md`
8. `docs/setup.md`
9. `src/presentation/screens/HomeScreen.tsx`
10. `docs/midterm-presentation-draft.md`

## 11. 발표용 짧은 설명

Energy Budget은 시간이 아니라 에너지를 기준으로 하루 계획을 세우는 모바일 앱입니다. 사용자가 피로도, 기분, 남은 시간, 할 일을 입력하면 앱이 오늘 감당 가능한 에너지 예산을 계산하고, 무리하지 않는 할 일을 추천합니다. Week 10에서는 비전, 요구사항, WBS, 위험, 일정을 정리했고, Week 11에서는 React Native + Expo 기반 구조, ADR, 아키텍처 문서, 실행 가이드, Hello World 앱까지 완성했습니다.

## 12. 남은 확인 사항

- GitHub remote가 현재 `Finbit`으로 연결되어 있으므로 Energy Budget 전용 저장소를 사용할지 결정해야 한다.
- 실제 제출 전에 VS Code에서 `npm run start`로 Expo 화면을 한 번 더 보여주면 좋다.
