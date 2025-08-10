# Store

상태 관리 관련 파일들을 관리하는 폴더입니다.

## 예시

- `index.ts` - 스토어 설정 및 export
- `authStore.ts` - 인증 관련 상태
- `userStore.ts` - 사용자 관련 상태
- `uiStore.ts` - UI 상태 (모달, 사이드바 등)
- `settingsStore.ts` - 설정 관련 상태

## 지원하는 상태 관리 라이브러리

- Zustand
- Redux Toolkit
- Recoil
- Jotai

## 네이밍 컨벤션

- 파일명: camelCase로 끝나고 `Store` 접미사 사용 (예: `authStore.ts`, `userStore.ts`)
- 스토어명: camelCase로 끝나고 `Store` 접미사 사용 (예: `authStore`, `userStore`)
