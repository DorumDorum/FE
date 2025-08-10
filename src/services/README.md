# Services

API 호출과 외부 서비스 연동을 관리하는 폴더입니다.

## 예시

- `api.ts` - 기본 API 클라이언트 설정
- `authService.ts` - 인증 관련 API 호출
- `userService.ts` - 사용자 관련 API 호출
- `fileService.ts` - 파일 업로드 관련 API 호출
- `notificationService.ts` - 알림 관련 서비스

## 네이밍 컨벤션

- 파일명: camelCase로 끝나고 `Service` 접미사 사용 (예: `authService.ts`, `userService.ts`)
- 클래스명: PascalCase로 끝나고 `Service` 접미사 사용 (예: `AuthService`, `UserService`)
