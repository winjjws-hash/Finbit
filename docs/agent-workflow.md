# Energy Budget - AI Agent 활용 기록

이 문서는 Energy Budget 프로젝트에서 AI Agent / Skills / Workflow를 어떻게 활용했는지 설명합니다. 가산점 기준의 **AI Agent**, **스킬**, **워크플로우** 키워드를 명확히 포함합니다.

## AI Agent 활용 범위

| 단계 | 활용 내용 | 결과 |
|---|---|---|
| 기획 | 프로젝트 주제 후보 비교, 비전 문장 정리 | Energy Budget 주제 확정 |
| 요구사항 | 사용자 시나리오 3개와 MoSCoW 분류 | `.planning/01-requirements.md` |
| WBS | 10~15주차 작업 분해와 진행률 정리 | `.planning/02-wbs.md`, WBS Gantt |
| ADR | 기술 선택 이유 기록 | ADR-0001~ADR-0004 |
| 구현 | React Native 화면, 입력, 추천, 저장, 알림 보조 | MVP 앱 구현 |
| UI 개선 | 모바일 화면 크기, 알림 위치, 카드 구조 개선 | 사용성 향상 |
| 문서화 | README, setup, deploy, testing, 발표 대본 | 평가 기준 대응 |
| PDF | 최종 평가 PDF 생성과 렌더링 검수 | GitHub Pages 공개 |

## 사용한 Skills

- PDF skill: 발표 PDF 생성 및 페이지 렌더링 검수
- Browser skill: localhost 앱 화면 확인, 모바일 UI 검수
- Spreadsheet workflow: WBS Gantt 구성
- Presentation workflow: 발표자료와 대본 구성

## Workflow

1. 교수님 평가 기준을 항목별로 분해합니다.
2. 각 항목을 프로젝트 산출물과 연결합니다.
3. 부족한 산출물을 문서나 코드로 보완합니다.
4. 명령어로 검증합니다.
5. GitHub Pages에 공개합니다.

## 발표용 한 문장

> 저는 AI Agent를 코드 작성에만 사용하지 않고, 기획, WBS, ADR, 테스트, 발표자료, README까지 이어지는 하나의 워크플로우로 활용했습니다.
