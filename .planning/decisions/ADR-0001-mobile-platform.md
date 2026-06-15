# ADR-0001. 모바일 플랫폼 선택

## 상태

Accepted

## 배경

Energy Budget은 사용자가 하루의 피로도, 기분, 남은 시간, 할 일을 짧게 입력하고 추천 결과를 확인하는 개인 에너지 관리 앱이다. 이 앱은 아침, 하루 중간, 저녁 회고처럼 생활 속에서 자주 쓰는 흐름이 중요하므로 데스크톱보다 모바일 사용성이 더 적합하다.

프로젝트는 6주 안에 혼자 MVP를 완성해야 하며, 바이브코딩을 함께 사용할 예정이다. 따라서 플랫폼 선택 기준은 다음과 같다.

- 빠른 개발 환경 구축
- Android 휴대폰에서 쉬운 데모
- 화면 구현과 상태 관리의 단순함
- AI Agent가 참고하기 쉬운 생태계
- 앱스토어 배포 없이도 실행 가능한 MVP

## 비교 대상

| 플랫폼 | 장점 | 단점 | Energy Budget 적합도 |
|---|---|---|---|
| Flutter | UI가 일관되고 Hot Reload가 빠름, iOS/Android/Web 대응 가능 | Dart 학습 필요, 패키지 생태계는 React Native보다 작음 | 좋음 |
| React Native + Expo | JS/TS 기반이라 진입이 빠름, Expo로 환경 구축이 쉬움, npm 생태계가 큼 | 네이티브 브릿지 디버깅은 어려울 수 있음 | 매우 좋음 |
| Android Native | Android 기능 접근성과 성능이 좋음 | Kotlin/Compose 학습 부담, iOS 대응 불가 | 보통 |
| iOS Native | iOS UX와 성능이 좋음 | macOS와 Xcode 필요, Android 대응 불가 | 낮음 |

## 결정

Energy Budget의 1차 구현 플랫폼은 **React Native + Expo + TypeScript**로 선택한다.

## 결정 이유

1. Expo를 사용하면 초기 환경 구축이 빠르고, 앱스토어 배포 없이도 휴대폰에서 실행해볼 수 있다.
2. Energy Budget의 핵심 기능은 컨디션 입력, 할 일 등록, 추천 결과 표시, 기록 저장처럼 복잡한 네이티브 기능이 필요하지 않다.
3. JavaScript/TypeScript와 npm 생태계를 활용하면 바이브코딩으로 UI와 기능을 빠르게 나눠 구현하기 좋다.
4. Flutter도 좋은 선택이지만, Dart 학습 부담보다 결과물을 빠르게 만드는 것이 이번 프로젝트 목표에 더 맞다.
5. Android Native와 iOS Native는 성능과 OS 통합은 좋지만, 6주 MVP 범위에서는 개발 부담이 크다.

## 결과

- 프로젝트는 모바일 앱 형태로 기획하되, 앱스토어/플레이스토어 배포는 이번 범위에서 제외한다.
- MVP는 Expo 개발 환경에서 실행 가능한 상태를 목표로 한다.
- 로컬 데이터 저장은 초기에는 기기 내부 저장소 기반으로 구현한다.
- 외부 캘린더, 웨어러블 기기, AI 상담 챗봇 연동은 이후 확장 기능으로 남긴다.

## 대안

### Flutter

UI 완성도와 크로스플랫폼 측면에서 좋은 선택이다. 다만 Dart를 새로 익혀야 하고, 이번 프로젝트는 짧은 기간 안에 MVP를 만드는 것이 우선이라 선택하지 않았다.

### Android Native

Android만 목표로 한다면 안정적인 선택이다. 하지만 Kotlin과 Jetpack Compose 학습 부담이 있어 초기 개발 속도가 느려질 수 있다.

### iOS Native

iOS 앱 품질은 높게 만들 수 있지만 macOS/Xcode 의존성이 있고, Android 사용자를 고려하기 어렵다.
