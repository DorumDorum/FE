# Types

TypeScript 타입 정의들을 관리하는 폴더입니다.

## 예시

- `api.ts` - API 응답 타입들
- `user.ts` - 사용자 관련 타입들
- `common.ts` - 공통 타입들
- `form.ts` - 폼 관련 타입들
- `index.ts` - 모든 타입들을 export하는 파일

## 네이밍 컨벤션

- 파일명: camelCase (예: `apiTypes.ts`, `userTypes.ts`)
- 타입명: PascalCase (예: `UserProfile`, `ApiResponse`)
- 인터페이스명: PascalCase로 시작하고 `I` 접두사 사용 (예: `IUser`, `IApiResponse`)
