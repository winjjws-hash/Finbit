# Energy Budget - LLM Wiki 암묵지 관리

이 문서는 Energy Budget 프로젝트를 진행하면서 생긴 암묵지를 최신 LLM Wiki 방식으로 정리한 개인 지식 관리 문서입니다.

## 목적

LLM Wiki는 프로젝트를 진행하며 얻은 선택 이유, 시행착오, 발표 답변, 반복 명령을 한곳에 모아 다음 작업에서 다시 활용하기 위한 문서입니다.

## 핵심 암묵지

### 1. 주제 선택

Energy Budget은 단순 투두앱이 아니라 **컨디션 기반 계획 조정 앱**으로 설명해야 차별점이 살아납니다.

발표 문장:

> 시간이 남아도 피곤하면 계획은 무너집니다. 그래서 이 앱은 시간을 먼저 보지 않고 오늘의 에너지를 먼저 봅니다.

### 2. DB 질문 답변

현재는 AsyncStorage로 MVP를 검증합니다. SQLite는 다음 확장 단계입니다.

짧은 답변:

> DB는 아직 SQLite로 연결하지 않았고, 현재는 AsyncStorage로 날짜별 계획을 저장합니다. ADR-0003에서 서버 없이 먼저 핵심 가치를 검증하기로 했습니다.

### 3. 아키텍처 질문 답변

presentation, application, domain, data 네 레이어로 설명합니다.

짧은 답변:

> 화면은 presentation, 흐름은 application, 계산 규칙은 domain, 저장은 data에 두었습니다. 화면과 계산이 섞이지 않게 하려고 나눴습니다.

### 4. 시연 순서

1. 닉네임 입력
2. 피로도와 남은 시간 조절
3. 할 일 추가
4. 에너지 소모 입력
5. 지금 할 일과 미룰 일 분리 확인
6. 달력과 알림 현황 확인

### 5. 자주 쓰는 명령

```powershell
npm run typecheck
npm run test
npm run export:web
npm run verify:release
```

## 개선 계획

- SQLite 저장으로 DB 확장
- 주간 리포트 추가
- 요일별 에너지 패턴 분석
- 알림 UX 개선
- 테스트 자동화 확대

## 발표용 한 문장

> 저는 프로젝트 중 생긴 판단 기준과 질문 답변을 LLM Wiki 문서로 정리해서, 발표와 다음 개발에서 다시 활용할 수 있게 했습니다.
