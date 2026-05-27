# DorumDorum (React + Vite + Tailwind + React Router)

기숙사 룸메이트 매칭 앱 디자인을 React 앱으로 변환한 버전.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 열기.

## 빌드

```bash
npm run build
npm run preview
```

`dist/` 폴더를 Netlify / Vercel / S3 / GitHub Pages 등 정적 호스팅에 그대로 올리면 돼요.

## 구조

```
src/
├─ main.jsx          (엔트리, React Router 부트)
├─ index.css         (Tailwind 디렉티브 + 디자인 토큰 + 컴포넌트 클래스)
├─ app/
│  ├─ App.jsx        (앱 엔트리 컴포넌트)
│  ├─ routes.jsx     (라우트 정의)
│  └─ layouts/       (PhoneFrame 등 앱 레이아웃)
├─ shared/
│  ├─ components/    (Icon, TabBar, StatusBar, Avatar, LogoMark 등)
│  └─ utils/         (공용 유틸)
└─ features/
   ├─ onboarding/    (로그인, 회원가입, 약관)
   ├─ home/          (홈, 캘린더, 일정)
   ├─ rooms/         (방 찾기, 방 상세, 추천 방)
   ├─ my-room/       (신청자 관리, 방 체크리스트, 모집글 수정)
   ├─ chat/          (채팅 목록, 채팅방)
   ├─ profile/       (마이페이지, 프로필, 신청/북마크)
   ├─ members/       (룸메이트 화면)
   ├─ checklist/     (체크리스트, 모집방 생성, 보조 상세 화면)
   ├─ guest/         (비로그인 상태 화면)
   ├─ notices/       (공지/알림 export)
   └─ settings/      (설정 화면 export)
```

## 라우트 맵

| 경로 | 화면 |
|---|---|
| `/` | 홈 |
| `/find` | 방 찾기 |
| `/myroom` | 내 방 (방장 시점) |
| `/chat` | 채팅 목록 |
| `/me` | 마이페이지 |
| `/splash`, `/login`, `/signup` | 온보딩 |
| `/room/:id` | 모집방 상세 |
| `/chat/group`, `/chat/dm` | 채팅방 (단체/1:1) |
| `/checklist` | 내 체크리스트 편집 |
| `/room/create/1..3` | 모집방 만들기 3단계 |
| `/room/applicants`, `/room/applicants/:id` | 신청자 목록 / 상세 |
| `/room/checklist`, `/room/edit`, `/room/members` | 방 체크리스트 / 모집글 수정 / 룸메이트 |
| `/find/recommended`, `/find/filter` | 매칭 추천 / 체크리스트로 찾기 |
| `/notice/:id`, `/notifications` | 공지사항 / 알림 |
| `/guest/*` | 비로그인 화면들 |
| `/apply/success` | 입주 신청 완료 |

## Tailwind

`tailwind.config.js`에 디자인 토큰이 매핑되어 있어요. 예시:

```jsx
<div className="bg-brand text-white p-4 rounded-2xl">...</div>
<span className="text-ink-3 text-xs">...</span>
```

기존 inline style + CSS 변수도 그대로 동작해요. Tailwind는 점진적으로 적용해도 OK.

## 알아두면 좋은 점

- 모든 화면 컴포넌트는 자체 `<TabBar />`를 포함하고 있고, TabBar는 React Router의 `useNavigate`로 탭 클릭 시 라우팅돼요.
- 디자인 토큰(`--brand`, `--ink` 등)은 `index.css`의 `:root`에 정의돼 있어서 한 곳에서 색을 바꾸면 전체에 적용돼요.
- 다국어/접근성/실제 백엔드 연결은 포함되지 않은 디자인 시안이에요. 데이터(`ROOMS`, `MEMBER_CHECKLISTS`, `CHATS` 등)는 각 파일 상단의 상수에 mock으로 들어 있어요 — API로 교체하시면 됩니다.

## 라이선스

내부 디자인 시안용. 필요에 맞게 자유롭게 수정하세요.
