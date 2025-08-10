# Lib

외부 라이브러리 설정과 래퍼 함수들을 관리하는 폴더입니다.

## 예시

- `axios.ts` - Axios 인스턴스 설정
- `firebase.ts` - Firebase 설정
- `supabase.ts` - Supabase 클라이언트 설정
- `date-fns.ts` - date-fns 래퍼 함수들
- `lodash.ts` - lodash 유틸리티 래퍼들

## 네이밍 컨벤션

- 파일명: camelCase (예: `axiosConfig.ts`, `firebaseSetup.ts`)
- 클래스명: PascalCase (예: `ApiClient`, `FirebaseService`)
- 함수명: camelCase (예: `configureAxios`, `initFirebase`)
