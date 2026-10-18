# SJYC Client — 중구청소년센터 통합 웹

서울시 중구청소년센터의 사용자 웹(방문자·회원·동아리원)과 관리자 웹을 하나의 Next.js 앱으로 제공한다.

- 사용자 웹: 모바일 우선. 프로그램 신청, 공간 예약, 동아리, 공지, 질문·문의, 센터 안내, 마이페이지
- 관리자 웹(`/admin`): 모바일·데스크톱. 대시보드, 공지·프로그램·신청·공간 예약·동아리·문의/FAQ·회원·정책 문서·감사 로그
- 네이티브 앱: iOS·Android 사용자 앱과 관리자 앱 (Expo) — 별도 저장소 [efface-studio/SJYC-Mobile](https://github.com/efface-studio/SJYC-Mobile). 이 저장소의 `src/api`·`src/domain`·`src/config`·`src/lib` 를 복사·동기화해 쓴다.

> 서버(SJYC-Server)가 아직 없어 기본값은 **개발용 mock 모드**다. 화면 상단의 "개발용 데모" 띠가 보이면 실제 센터 데이터가 아니다.

## 실행

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

데모 계정은 로그인 화면의 "데모 계정으로 입력" 버튼을 사용한다 (회원 / 동아리 담당자 / 센터 직원 / 최고 관리자 / 개발자). 관리자 화면은 `/admin/login`.
상단 띠의 **개발 도구**에서 느린 응답·빈 데이터·서버 오류·세션 만료·데이터 초기화를 재현할 수 있다.

## 스크립트

| 명령                                | 내용                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm typecheck`                    | TypeScript 검사                                                                  |
| `pnpm lint`                         | ESLint                                                                           |
| `pnpm format` / `pnpm format:check` | Prettier                                                                         |
| `pnpm test`                         | Vitest 단위·컴포넌트 테스트                                                      |
| `pnpm build`                        | 프로덕션 빌드                                                                    |
| `pnpm e2e`                          | Playwright (먼저 `pnpm build`, 최초 1회 `pnpm exec playwright install chromium`) |

## 환경 변수

`.env.example` 참고. 실서버 연결 시 `NEXT_PUBLIC_API_MODE=http` 와 `NEXT_PUBLIC_API_BASE_URL` 을 설정한다. 비밀 값(OAuth secret, AWS 키)은 이 앱에 두지 않는다.

## 문서

- `docs/product-scope.md` — 사용자 유형, 사이트맵, 핵심 흐름, 우선순위, 정책 가정
- `docs/architecture.md` — 구조, 인증·OAuth 경계, mock/http 전환, 모바일·AWS 확장
- `docs/api-contracts.md` — 서버 API 계약 초안
- `docs/brand-audit.md` — 공식 로고·컬러·기관 정보 근거와 미확인 항목
- `docs/design-system.md` — 토큰·컴포넌트·패턴
- `docs/release-checklist.md` — 출시 전 확인 항목
