# Energy Budget 테스트 가이드

## 목적

Energy Budget의 테스트 목표는 사용자가 컨디션과 할 일을 입력했을 때, 앱이 에너지 예산을 계산하고 추천 목록과 미루기 목록을 안정적으로 나누는지 확인하는 것입니다.

## 자동 검증

### TypeScript 검사

```powershell
npm run typecheck
```

확인 내용:

- 타입 오류 없음
- 화면, 도메인 규칙, 저장소 타입 연결 정상
- 잘못된 import 없음

### Android export 검증

```powershell
npm run export:android
```

확인 내용:

- Expo Android 번들 생성 가능
- 빌드 타임 에러 없음
- 앱 진입점 `App.tsx` 정상 연결

### Web export 검증

```powershell
npm run export:web
```

확인 내용:

- 브라우저 데모 산출물 생성 가능
- 발표 당일 모바일 실행이 막힐 때 PC 데모 백업 가능

### 릴리스 전 일괄 검증

```powershell
npm run verify:release
```

## 수동 테스트 시나리오

| 번호 | 시나리오 | 입력 | 기대 결과 |
|---|---|---|---|
| 1 | 기본 계획 확인 | 초기 화면 그대로 | 에너지 예산, 추천 목록, 미루기 목록이 표시된다 |
| 2 | 피로도 증가 | 피로도 8 이상 | 에너지 예산이 줄고 과부하 가능성이 커진다 |
| 3 | 기분 변경 | 좋음, 보통, 피곤, 예민 선택 | 예산 점수가 기분에 따라 달라진다 |
| 4 | 할 일 추가 | 제목, 예상 시간, 에너지 소모 입력 | 새 할 일이 목록 계산에 반영된다 |
| 5 | 과부하 확인 | 에너지 소모가 큰 할 일을 여러 개 추가 | 일부 작업이 미뤄도 되는 일로 분리된다 |
| 6 | 완료 체크 | 추천 작업 터치 | 완료 수가 증가하고 남은 추천 기준이 다시 계산된다 |
| 7 | 초기화 | 초기화 버튼 선택 | 기본 컨디션과 기본 할 일로 돌아간다 |

## 도메인 규칙 테스트 관점

현재 도메인 규칙은 `src/domain/rules/energyBudgetRules.ts`에 있습니다.

- `calculateEnergyBudget`: 피로도, 기분, 남은 시간으로 10부터 100 사이의 예산을 계산
- `getTotalEnergyCost`: 전체 할 일의 에너지 비용 합산
- `getEnergyStatus`: safe, caution, overload 상태 분류
- `splitTasksByEnergyBudget`: 예산 안에 들어오는 일과 미루는 일을 분리

## 테스트 결과 기록 양식

| 날짜 | 테스트 항목 | 결과 | 메모 |
|---|---|---|---|
| 2026-06-09 | TypeScript 검사 | 통과 | `npm run typecheck` |
| 2026-06-09 | Android export | 통과 | `npm run export:android` |
| 2026-06-09 | Web export | 통과 | `npm run export:web` |
| 2026-06-09 | 릴리즈 전체 검증 | 통과 | `npm run verify:release` |

## Q&A 답변

테스트 질문을 받으면 이렇게 답합니다.

> 자동 검증은 TypeScript 검사와 Expo export로 확인했고, 수동 테스트는 피로도 변경, 할 일 추가, 과부하 분리, 완료 체크, 초기화 흐름을 기준으로 점검했습니다.
