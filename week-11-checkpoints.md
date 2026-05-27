# Energy Budget - Week 11 점검 기록

## 1. 목표

Week 11 PDF의 3회 점검 기준에 맞춰 Energy Budget의 진행 상태를 확인한다.

## 2. 점검 1 - ADR로 말할 수 있는가?

| 질문 | 답변 |
|---|---|
| 우리는 무엇을 선택했나? | React Native + Expo + TypeScript를 선택했다. |
| 대안은 무엇이었나? | Flutter, Android Native, iOS Native가 있었다. |
| 왜 이 선택이 더 낫나? | 6주 안에 혼자 모바일 MVP를 만들기 쉽고, Expo로 빠르게 실행할 수 있기 때문이다. |
| 관련 문서 | `.planning/decisions/ADR-0001-mobile-platform.md` |

60초 설명:

Energy Budget은 매일 짧게 입력하고 확인하는 앱이라 모바일 사용성이 중요하다. 그래서 React Native + Expo + TypeScript를 선택했다. Flutter도 좋은 대안이지만 Dart 학습 부담이 있고, Android/iOS Native는 6주 MVP에는 개발 부담이 크다. Expo는 앱스토어 배포 없이도 휴대폰에서 바로 실행할 수 있어 이번 프로젝트에 가장 적합하다.

## 3. 점검 2 - 구조를 설명할 수 있는가?

| 질문 | 답변 |
|---|---|
| 새 화면은 어디에 추가하나? | `src/presentation/screens` |
| 상태/흐름 코드는 어디에 두나? | `src/application/view_models`, `src/application/use_cases` |
| 핵심 규칙은 어디에 두나? | `src/domain/rules` |
| 저장 코드는 어디에 두나? | `src/data` |
| 관련 문서 | `docs/architecture.md` |

60초 설명:

Energy Budget은 네 개의 역할로 코드를 나눈다. 사용자가 보는 화면은 `presentation`, 화면에 필요한 데이터를 준비하는 부분은 `application`, 에너지 예산 계산 규칙은 `domain`, 기록 저장은 `data`에 둔다. 이렇게 나누면 화면 코드와 계산 규칙이 섞이지 않아서 나중에 수정하거나 발표할 때 설명하기 쉽다.

## 4. 점검 3 - 실행과 인수인계가 되는가?

| 기준 | 결과 |
|---|---|
| 새 사람이 따라할 수 있는 문서 | `docs/setup.md` 작성 완료 |
| 현재 컴퓨터에서 실행 가능 | TypeScript 검사와 Expo Android export 성공 |
| 의존성 명세 | `package.json`, `package-lock.json` 생성 |
| 환경 변수 예시 | `.env.example` 생성 |
| 에디터 권장 확장 | `.vscode/extensions.json` 생성 |

검증 명령:

```bash
npm run typecheck
npx expo install --check
npx expo export --platform android --output-dir dist-test
```

검증 결과:
- TypeScript 검사 통과
- Expo 의존성 호환성 검사 통과
- Android 번들 export 성공

## 5. 남은 주의점

현재 GitHub remote는 기존 `Finbit` 저장소로 연결되어 있다. Energy Budget을 별도 프로젝트로 제출하려면 새 GitHub 저장소를 만들거나 remote를 정리한 뒤 push해야 한다.
