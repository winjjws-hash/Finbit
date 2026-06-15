# Energy Budget 데모 환경 백업

## 목적

발표 당일 네트워크, Expo 서버, 스마트폰 연결 문제가 생겨도 프로젝트를 보여줄 수 있도록 백업 경로를 준비합니다.

## 데모 우선순위

| 우선순위 | 데모 방식 | 준비물 | 실패 시 대안 |
|---|---|---|---|
| 1 | Expo 로컬 실행 | `run-energy-budget.bat`, Expo Go | Web 실행 |
| 2 | Web 실행 | `npm run web` 또는 `npm run export:web` | 발표 PDF |
| 3 | GitHub Pages | 발표 URL | 로컬 PDF |
| 4 | PDF 미리보기 | `docs/Energy_Budget_2min_Presentation.pdf` | 앱 스크린샷 |
| 5 | WBS 엑셀 | `docs/Energy_Budget_WBS_Gantt.xlsx` | PDF의 WBS 페이지 |

## 발표 전 체크

발표 전에 아래 순서로 확인합니다.

```powershell
npm install
npm run typecheck
npm run export:web
npm run export:android
```

## 로컬 실행 백업

```powershell
.\run-energy-budget.bat
```

실패하면 웹 실행:

```powershell
npm run web
```

## 파일 백업 목록

발표 전 아래 파일을 USB, 클라우드, 바탕화면 중 2곳 이상에 복사합니다.

- `docs/Energy_Budget_2min_Presentation.pdf`
- `docs/Energy_Budget_WBS_Gantt.xlsx`
- `docs/app-screenshot.png`
- `docs/presentation-script.md`
- `README.md`

## 데모 녹화 계획

3분 이하 mp4 녹화에 포함할 장면:

1. 앱 첫 화면
2. 피로도 조절
3. 기분 선택
4. 할 일 추가
5. 추천 목록과 미루기 목록 변화
6. 완료 체크

파일명 예시:

```text
demo-backup/energy-budget-demo-2026-06-09.mp4
```

## Q&A 답변

데모 백업 질문을 받으면 이렇게 답합니다.

> Expo 실행, Web 실행, GitHub Pages 발표 자료, 로컬 PDF를 순서대로 준비했습니다. 앱 실행이 막혀도 웹과 PDF로 프로젝트 핵심 흐름을 보여줄 수 있게 백업했습니다.
