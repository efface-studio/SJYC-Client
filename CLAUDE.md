# CLAUDE.md

이슈·브랜치·커밋·PR·라벨·CI 규칙은 efface-studio 공통 규칙(AI-Markdown `CLAUDE.md`)을 따른다.
커밋 형식 `<gitmoji> (<type>) #<issue> :: <message>`, Claude 서명 금지, 병합은 `xixn2` 만.

## 프로젝트 컨텍스트

- **프로젝트명**: SJYC-Client (서울시 중구청소년센터 통합 웹 — 사용자 웹 + 관리자 웹)
- **스택**: Next.js 16 App Router, React 19, TypeScript strict(`noUncheckedIndexedAccess`), Tailwind v4(`@theme` 토큰), TanStack Query 5, Zod 4, lucide-react, Pretendard, Vitest + RTL, Playwright, pnpm 11, Node 24
- **모바일**: 별도 저장소 `efface-studio/SJYC-Mobile` (Expo SDK 57). 이 저장소의 공유 코드(`src/api`, `src/domain`, `src/config`, `src/lib`, `src/features/auth/session.ts`)를 복사·동기화해 쓴다 — 공유 코드를 바꾸면 SJYC-Mobile 에서 `npm run sync:core` 로 반영
- **주요 명령어**:
  - 개발: `pnpm dev` (mock 모드, http://localhost:3000)
  - 빌드: `pnpm build`
  - 테스트: `pnpm typecheck && pnpm lint && pnpm test`, E2E `pnpm build && pnpm e2e`
- **기본 브랜치**: `main`
- **배포**: 미정 (제안은 `docs/architecture.md` AWS 절)
- **기타 규칙**:
  - UI 는 `src/api/client.ts` 의 `ApiClient` 계약에만 의존한다. 엔드포인트·DTO 를 바꾸면 `docs/api-contracts.md`, `src/domain/types.ts`, `src/api/http.ts`, `src/api/mock/*` 를 함께 고친다.
  - 기관 정보(주소·전화·운영시간)는 `src/config/center.ts` 한 곳에서만 관리한다. 기존 사이트(j-youth.org 등)로 가는 링크는 두지 않는다.
  - mock 데이터는 개발용임을 화면에 표시한다. 실제 운영 정보·통계·접수번호를 클라이언트에서 만들어 사실처럼 보여주지 않는다.
  - 권한 판단은 서버 세션 응답(`useSession`)과 `can()` 으로만 한다. 프론트엔드 가드는 보안 경계가 아니다.
  - 사용자 웹은 모바일 우선, 관리자 웹은 모바일·데스크톱 모두 지원한다. 디자인은 `docs/design-system.md` 의 "쓰지 않는 것"을 지킨다.
  - `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` 에 비밀 값을 넣지 않는다.
  - 공유 코드(`src/api`, `src/domain`, `src/config`, `src/lib`, `src/features/auth/session.ts`)는 DOM·Next 전용 API 를 쓰지 않는다 (모바일 앱에 복사되어 React Native 에서도 동작해야 함).
