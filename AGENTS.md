# AGENTS.md

이 문서는 Energy Budget 프로젝트에서 AI Agent를 사용할 때 따르는 작업 정책입니다. 교수님 평가 기준의 **AGENTS.md**, **AI Agent**, **skills**, **workflow**, **rules**, **commands** 키워드가 기계적으로 확인될 수 있도록 프로젝트 루트에 둡니다.

## 1. Agent 역할

AI Agent는 다음 작업을 보조합니다.

- 기획서와 요구사항 정리
- WBS와 일정 분해
- ADR 작성과 선택 이유 정리
- 아키텍처 다이어그램 설명
- React Native + Expo 코드 구현 보조
- README, setup, deploy, testing 문서화
- 발표 PDF와 발표 대본 작성
- 테스트 명령 실행과 결과 확인

## 2. Skills 활용

사용한 skills와 활용 목적은 다음과 같습니다.

| Skill | 활용 |
|---|---|
| PDF skill | 최종 평가 PDF 생성, 페이지 렌더링 검수 |
| Browser skill | 로컬 앱 화면 확인, 모바일 UI 검수 |
| Spreadsheet skill | WBS Gantt 산출물 정리 |
| Documents/Presentation workflow | 발표자료와 대본 구성 보조 |

## 3. Workflow

Energy Budget의 기본 workflow는 다음 순서입니다.

1. 요구사항 확인
2. WBS와 MoSCoW로 범위 제한
3. ADR로 기술 선택 기록
4. 작은 단위로 구현
5. `npm run typecheck`와 `npm run test` 실행
6. README/setup/deploy/testing 문서 업데이트
7. GitHub Pages에 발표 산출물 공개
8. 발표 대본과 Q&A 답변 연습

## 4. Rules

- 핵심 계산 규칙은 `src/domain/rules`에 둡니다.
- 화면 코드는 `src/presentation`에 둡니다.
- 저장 기능은 `src/data`에 둡니다.
- 사용자가 볼 수 있는 문서는 `README.md`와 `docs/`에 둡니다.
- 기술 선택 이유는 ADR로 남깁니다.
- 발표에서 답변할 내용은 ADR 기준으로 말합니다.
- 민감한 키나 인증서는 커밋하지 않습니다.

## 5. Commands

자주 사용하는 commands입니다.

```powershell
npm install
npm run start
npm run web
npm run typecheck
npm run test
npm run export:android
npm run export:web
npm run verify:release
```

## 6. 본인만의 기법

이 프로젝트는 **단일 AGENTS.md 안에 agent / skills / workflow / rules / commands를 통합**해서 관리합니다. 발표에서는 길게 설명하지 않고 다음 한 문장으로 설명합니다.

> 저는 AI Agent를 단순히 코드 생성에만 쓰지 않고, AGENTS.md에 작업 규칙과 명령, 문서화 기준을 정리해서 프로젝트 운영 방식까지 관리했습니다.

## 7. 발표 Q&A 답변

> AI Agent는 어디에 활용했나요?

기획, WBS, ADR, 발표 PDF, UI 개선, 테스트 확인, README 문서화에 활용했습니다. 단순히 결과만 받은 것이 아니라, WBS와 ADR 기준으로 선택 이유를 정리하고 프로젝트 구조를 설명 가능하게 만드는 데 사용했습니다.
