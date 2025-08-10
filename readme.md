# DorumDorum - 방 찾기 앱

DorumDorum은 기숙사 룸메이트를 찾는 모바일 웹 애플리케이션입니다. React와 TypeScript로 구축되었으며, PWA(Progressive Web App) 기능을 지원합니다.

## 🏠 주요 기능

- **방 찾기**: 다양한 조건의 기숙사 방을 검색하고 필터링
- **방 만들기**: 새로운 방을 생성하고 태그를 설정
- **지원하기**: 관심 있는 방에 지원서 제출
- **채팅 요청**: 방장과 1:1 채팅 요청
- **모바일 최적화**: 모바일 친화적인 UI/UX
- **PWA 지원**: 네이티브 앱과 같은 경험 제공

## 🛠️ 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Package Manager**: Bun
- **State Management**: React Query
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── modals/           # 모달 컴포넌트들
│   │   ├── ChatRequestModal.tsx
│   │   ├── CreateRoomModal.tsx
│   │   └── ApplyRoomModal.tsx
│   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   │   └── ConfirmModal.tsx
│   ├── room/             # 방 관련 컴포넌트
│   │   └── RoomCard.tsx
│   └── forms/            # 폼 컴포넌트
├── pages/
│   └── RoomSearchPage.tsx  # 메인 페이지 (방 찾기)
├── services/
│   └── socket.ts         # WebSocket 서버
├── types/
│   └── room.ts           # 타입 정의
├── styles/
│   └── globals.css       # 전역 스타일
├── assets/               # 이미지, 아이콘 등
└── App.tsx               # 메인 앱 컴포넌트
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+ 또는 Bun
- npm, yarn, 또는 bun

### 설치 및 실행

1. **의존성 설치**

```bash
# npm 사용
npm install

# 또는 yarn 사용
yarn install

# 또는 bun 사용
bun install
```

2. **개발 서버 실행**

```bash
# npm 사용
npm run dev

# 또는 yarn 사용
yarn dev

# 또는 bun 사용
bun dev
```

3. **빌드**

```bash
# npm 사용
npm run build

# 또는 yarn 사용
yarn build

# 또는 bun 사용
bun run build
```

4. **프리뷰**

```bash
# npm 사용
npm run preview

# 또는 yarn 사용
yarn preview

# 또는 bun 사용
bun run preview
```

### WebSocket 서버 실행 (선택사항)

채팅 기능을 사용하려면 WebSocket 서버를 별도로 실행해야 합니다:

```bash
bun socket
```

## 📱 사용법

### 방 찾기
- 메인 페이지에서 다양한 조건의 기숙사 방을 검색할 수 있습니다
- 방장 닉네임이나 태그로 검색 가능
- 탭을 통해 "모집 중인 방", "내가 지원한 방", "내가 속한 방"을 구분하여 볼 수 있습니다

### 방 만들기
- 상단의 "방 만들기" 버튼을 클릭하여 새로운 방을 생성
- 방 제목, 타입, 수용 인원, 설명을 입력
- 최대 5개의 태그를 선택하여 방의 특성을 표시

### 지원하기
- 관심 있는 방의 "지원하기" 버튼을 클릭
- 자기소개와 추가 메시지를 작성하여 지원서 제출
- 지원한 방은 "내가 지원한 방" 탭에서 확인 가능

### 채팅 요청
- 방장과 1:1 채팅을 요청할 수 있습니다
- "채팅 요청" 버튼을 클릭하여 메시지와 함께 요청

## 🎨 UI/UX 특징

- **모바일 우선 디자인**: 모바일 환경에 최적화된 UI
- **데스크톱 프리뷰**: 데스크톱에서 모바일 앱처럼 보이도록 설정
- **드래그 모달**: 모바일에서 드래그하여 모달을 닫을 수 있음
- **확인 모달**: 중요한 작업(지원 취소, 방 나가기)에 확인 절차 추가
- **반응형 디자인**: 다양한 화면 크기에 대응

## 🔧 개발

### 개발 환경 설정

1. **TypeScript 설정**
   - `tsconfig.json`에서 TypeScript 컴파일러 옵션 설정
   - 엄격한 타입 체크 활성화

2. **Tailwind CSS 설정**
   - `tailwind.config.js`에서 커스텀 색상 및 스타일 정의
   - 반응형 브레이크포인트 설정

3. **Vite 설정**
   - `vite.config.ts`에서 빌드 옵션 및 플러그인 설정
   - 경로 별칭 설정 (`@/` → `src/`)

### 코드 구조

- **컴포넌트**: 재사용 가능한 UI 컴포넌트들을 기능별로 분류
- **페이지**: 실제 라우팅되는 페이지 컴포넌트
- **타입**: TypeScript 타입 정의
- **서비스**: API 통신 및 WebSocket 관련 로직
- **스타일**: 전역 CSS 및 Tailwind 유틸리티

### 모바일 최적화

- **뷰포트 설정**: 모바일 디바이스에 최적화된 뷰포트 설정
- **터치 이벤트**: 드래그 모달, 스와이프 제스처 지원
- **성능 최적화**: 이미지 최적화, 코드 스플리팅 적용

## 🚀 배포

### 빌드

```bash
bun run build
```

### 정적 호스팅

빌드된 파일을 Netlify, Vercel, GitHub Pages 등에 배포할 수 있습니다.

### PWA 배포

- `manifest.json` 설정으로 PWA 기능 활성화
- Service Worker를 통한 오프라인 지원
- 앱 아이콘 및 스플래시 스크린 설정

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**DorumDorum** - 기숙사 룸메이트 찾기의 새로운 경험 🏠✨
