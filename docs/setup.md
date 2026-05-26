# Energy Budget - Setup

## 1. 목표

이 문서는 새 사람이 Energy Budget 저장소를 받은 뒤 5분 안에 앱을 실행할 수 있도록 작성한 실행 가이드이다.

성공 기준:
- 의존성 설치가 끝난다.
- `npm run start`가 실행된다.
- Expo 화면에서 Energy Budget 첫 화면을 확인할 수 있다.

## 2. 사전 요구

| 도구 | 권장 버전 | 확인 명령 |
|---|---|---|
| Git | 2.40 이상 | `git --version` |
| Node.js | 20.x 이상 | `node -v` |
| npm | 10.x 이상 | `npm -v` |
| Expo Go | 최신 버전 | 휴대폰 앱 설치 |
| VS Code | 최신 버전 | 선택 사항 |

현재 개발 PC 확인 결과:
- Node.js: `v24.14.0`
- npm: `11.9.0`

## 3. Windows 설치 참고

Windows PowerShell에서 확인한다.

```powershell
git --version
node -v
npm -v
```

Git 또는 Node.js가 없다면 다음 중 하나로 설치한다.

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
```

휴대폰에서 실행하려면 Android/iOS 앱스토어에서 **Expo Go**를 설치한다.

## 4. macOS 설치 참고

```bash
git --version
node -v
npm -v
```

Homebrew를 사용하는 경우:

```bash
brew install git node
```

휴대폰에서 실행하려면 Android/iOS 앱스토어에서 **Expo Go**를 설치한다.

## 5. Linux 설치 참고

Ubuntu 기준:

```bash
sudo apt update
sudo apt install git nodejs npm
```

설치 후 버전을 확인한다.

```bash
git --version
node -v
npm -v
```

## 6. 저장소 받기

GitHub에 올라간 뒤에는 아래처럼 받는다.

```bash
git clone <repository-url>
cd <repository-folder>
```

현재 수업 작업 중에는 이미 프로젝트 폴더에 있으므로 다음 경로에서 실행하면 된다.

```powershell
cd "C:\Users\jjws0\Documents\New project"
```

## 7. 의존성 설치

```bash
npm install
```

설치가 끝나면 `node_modules` 폴더와 `package-lock.json`이 준비된다.

## 8. 환경 변수

현재 MVP는 외부 API를 사용하지 않으므로 필수 환경 변수는 없다.

나중에 API가 생기면 `.env.example`을 복사해서 `.env`를 만든다.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

현재 `.env.example`의 값:

```text
EXPO_PUBLIC_API_BASE_URL=
```

## 9. 첫 실행

```bash
npm run start
```

성공하면 Expo 개발 서버가 실행되고 QR 코드가 표시된다.

확인 방법:
- 휴대폰: Expo Go 앱으로 QR 코드 스캔
- 웹 미리보기: 터미널에서 `w` 입력
- Android 에뮬레이터: `npm run android`
- iOS 시뮬레이터: `npm run ios`

## 10. 한 줄 실행 명령

새 사람이 clone 후 바로 실행할 때 사용할 수 있는 명령이다.

Windows PowerShell:

```powershell
npm install; npm run start
```

macOS/Linux:

```bash
npm install && npm run start
```

## 11. 검증 명령

TypeScript 검사:

```bash
npm run typecheck
```

Expo 의존성 호환성 검사:

```bash
npx expo install --check
```

Android 번들 생성 확인:

```bash
npx expo export --platform android --output-dir dist-test
```

검증 후 `dist-test`는 제출 파일이 아니므로 삭제해도 된다.

## 12. 실행 성공 기준

앱 첫 화면에 다음 내용이 보이면 성공이다.

- `Energy Budget` 제목
- 오늘의 에너지 예산 점수
- 예상 사용량과 상태
- 샘플 할 일 목록

## 13. 자주 묻는 문제

### Q1. `expo` 명령을 찾을 수 없다고 나와요

`npm install`이 끝났는지 확인한다. 이 프로젝트는 전역 Expo CLI가 아니라 프로젝트 안에 설치된 Expo를 사용한다.

### Q2. QR 코드가 휴대폰에서 열리지 않아요

컴퓨터와 휴대폰이 같은 Wi-Fi에 연결되어 있는지 확인한다. 계속 안 되면 Expo 화면에서 Tunnel 모드를 선택한다.

### Q3. 패키지 버전 경고가 나와요

다음 명령으로 Expo가 기대하는 버전과 맞는지 확인한다.

```bash
npx expo install --check
```

### Q4. TypeScript 오류가 나요

아래 명령으로 오류 위치를 확인한다.

```bash
npm run typecheck
```

화면 오류는 `src/presentation`, 계산 오류는 `src/domain`부터 확인한다.

### Q5. 앱 화면이 빈 화면으로 보여요

터미널 로그를 먼저 확인한다. 그 다음 아래 파일 순서로 확인한다.

1. `App.tsx`
2. `src/presentation/screens/HomeScreen.tsx`
3. `src/application/view_models/homeViewModel.ts`
4. `src/domain/rules/energyBudgetRules.ts`

### Q6. `node_modules`가 너무 커요

`node_modules`는 Git에 올리지 않는다. 새 환경에서는 `npm install`로 다시 설치한다.
