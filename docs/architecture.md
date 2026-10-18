# 아키텍처

## 결정 요약

| 결정       | 선택                                                     | 근거 / 트레이드오프                                                                                             |
| ---------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 프레임워크 | Next.js 16 App Router, React 19, TS strict               | 조직 웹 프로젝트 표준(Shop·Luckgluck 등). 정적 페이지(센터 안내)는 서버 렌더링, 데이터 화면은 클라이언트 렌더링 |
| 앱 분리    | 한 앱 안에서 `(site)` 와 `admin` 레이아웃·권한 분리      | 빈 저장소 1개(SJYC-Client), 공통 디자인 토큰·계약 공유. 마이크로 프론트엔드 불필요                              |
| 데이터     | TanStack Query + `ApiClient` 인터페이스                  | 서버 상태는 Query 캐시, 로컬 UI 상태는 컴포넌트 state. 전역 상태 라이브러리 미사용                              |
| 계약       | `src/api/client.ts` 단일 인터페이스, mock / http 두 구현 | 서버(SJYC-Server)가 빈 저장소 → mock 으로 UI 완성 후 http 로 교체. 환경 변수 하나로 전환                        |
| 검증       | Zod 스키마 + FormData 파서 (`parseForm`)                 | 폼 라이브러리 없이 충분. 같은 스키마를 서버(Node)에서도 재사용 가능                                             |
| 스타일     | Tailwind v4 `@theme` 토큰                                | 사용자·관리자 웹이 같은 토큰을 쓰고 밀도만 다르게                                                               |
| 아이콘     | lucide-react 단일 세트                                   | 기능 설명용으로만 사용                                                                                          |
| 서체       | Pretendard 자체 호스팅                                   | 외부 CDN 의존 없음                                                                                              |

## 디렉터리

```
src/
  app/
    (site)/        사용자 웹 (모바일 우선, 하단 탭바)
    admin/         관리자 웹 (login + (console) 레이아웃)
  api/
    client.ts      ApiClient 인터페이스 (UI 가 의존하는 유일한 계약)
    http.ts        실서버 어댑터 (HttpOnly 쿠키 세션 + CSRF 헤더)
    mock/          개발용 어댑터 (sessionStorage, 시나리오 전환)
    errors.ts      ApiError 와 사용자 메시지
  domain/          타입·권한·검증 스키마·순수 규칙 (DOM 의존 없음 → 모바일 앱 재사용 후보)
  features/        도메인별 UI 조각 (auth 가드·세션, 프로그램 행 등)
  components/      공통 UI 키트, 사이트 헤더/푸터, 개발 패널
  config/          기관 정보(한 곳), 환경 변수, OAuth 경계
  lib/             형식화, 안전한 리다이렉트
e2e/               Playwright 시나리오
```

## 인증·세션 경계

- 세션은 서버가 발급한 `HttpOnly; Secure; SameSite=Lax` 쿠키로만 유지한다. 프론트엔드는 토큰을 저장하지 않는다.
- 상태 변경 요청은 double-submit CSRF(`XSRF-TOKEN` 쿠키 → `X-XSRF-TOKEN` 헤더). 서버가 검증한다.
- 현재 사용자·역할은 `GET /auth/session` 응답만 신뢰한다. URL 파라미터·로컬 저장값으로 권한을 판단하지 않는다.
- 로그인 후 이동 경로(`next`)는 `safeRedirect` 로 내부 경로만 허용하고, 회원 로그인에서는 `/admin` 으로 보내지 않는다.
- 어떤 요청이든 401 이면 세션을 무효화하고 보호 화면이 `/login?next=…&error=session_expired` 로 안내한다.
- 관리자 화면은 `RequireAdmin`(admin.access) + 메뉴별 `RequirePermission`. 화면 숨김은 보안 경계가 아니며 서버가 모든 관리자 API 에서 권한을 검사해야 한다.

## OAuth

1. 버튼 → `GET {API}/auth/oauth/{provider}/start?redirect=/내부경로`
2. 서버: state·nonce·PKCE 생성, 공급자 인가 URL 로 302
3. 콜백은 서버가 받는다: state 검증, 토큰 교환(client secret 은 서버만 보유), 계정 매칭/생성, 세션 쿠키 발급
4. 성공 → `redirect` 경로, 실패 → `/login?error=oauth_cancelled|oauth_denied|oauth_expired|oauth_account_exists|oauth_failed`
5. 같은 이메일의 기존 계정이 있으면 자동 병합하지 않고 `oauth_account_exists` → 기존 방식 로그인 후 내 정보에서 연결

`NEXT_PUBLIC_OAUTH_PROVIDERS` 에 서버 설정이 끝난 공급자만 넣는다. mock 모드에서는 모든 버튼이 "설정 필요" 상태다.

## mock adapter

- 서버 규칙(세션 만료, 권한, 중복 신청, 정원, 취소 기한, 예약 충돌, 감사 로그)을 같은 규칙으로 재현해 UI 를 검증한다.
- 데이터는 브라우저 `sessionStorage`(탭 단위)에만 있다. 보안 경계가 아니다.
- 화면 상단 "개발용 데모" 띠와 개발 도구(지연·빈 데이터·오류·세션 만료·초기화)로 상태를 재현한다.
- 실서버 전환: `.env` 에 `NEXT_PUBLIC_API_MODE=http`, `NEXT_PUBLIC_API_BASE_URL` 설정. mock 코드는 번들에 남지만 실행되지 않는다(운영 빌드에서 제거하려면 동적 import 로 분리).

## 개발자 도구 (`/admin/developer`, developer.access)

- `src/api/devlog.ts` 의 `withLogging` 이 `api` 객체의 모든 호출을 감싸 메서드 이름·소요 시간·결과만 메모리에 남긴다(최근 200건). 요청 인자·응답 본문은 개인정보가 담길 수 있어 기록하지 않는다.
- 탭: 환경 정보(진단 정보 복사), 세션·역할×권한표, API 요청 로그, 쿼리 캐시(다시 불러오기·무효화·삭제), mock 데이터(시나리오·초기화·세션 만료·내보내기/가져오기), 브라우저 저장소(키·크기만)·오류 재현.
- 화면 접근 제한은 표시용이다. 실서버에 개발자용 API 를 추가하면 서버가 developer.access 를 검사해야 한다.

## 모바일 앱 (별도 저장소 `efface-studio/SJYC-Mobile`)

- Expo SDK 57 + expo-router. `APP_FLAVOR=user|admin` 으로 라우트 폴더(`src/user`·`src/admin`)·앱 이름·번들 ID 를 나눠 두 앱을 만든다.
- 공유(SJYC-Mobile 의 `src/core` 로 복사·동기화): `src/api/*`(계약·http·mock), `src/domain/*`, `src/config/*`, `src/lib/format.ts`, `src/features/auth/session.ts`. 이 파일들은 DOM·Next 전용 API 를 쓰지 않는다 (`structuredClone`, `crypto.randomUUID`, `FormData` 타입 제거 — 모바일은 `parseValues` 사용).
- UI: 하단 바는 네이티브 탭(iOS 26 Liquid Glass / Android Material 3), 목록·폼은 `@expo/ui`(SwiftUI / Jetpack Compose), 팝업은 OS 기본 Alert·액션 시트.
- 세션: 서버 HttpOnly 쿠키를 RN 네이티브 쿠키 저장소로 유지하는 것을 전제. 앱 전용 토큰이 필요하면 서버와 함께 결정하고 http 어댑터만 교체.
- 빌드: iOS 는 macOS(Xcode 26) 또는 EAS Build, Android 는 Gradle. 프로필은 SJYC-Mobile 의 `eas.json`.

## AWS 배포 제안 (미생성, 검토용)

| 영역      | 제안                                                               | 비고                                                                        |
| --------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 웹        | Amplify Hosting 또는 ECS Fargate(Next 서버) + CloudFront           | 동적 라우트가 있어 단순 S3 정적 호스팅은 부적합(전 페이지 CSR 전환 시 가능) |
| API       | SJYC-Server (ECS/Lambda) + ALB/API Gateway                         | 같은 상위 도메인 하위로 두어 쿠키 SameSite 문제 회피 (`www.` / `api.`)      |
| DB        | RDS PostgreSQL/MySQL, 자동 백업·PITR                               |                                                                             |
| 파일      | S3(비공개) + CloudFront 서명 URL, 업로드는 서버 발급 presigned URL | 서버에서 형식·크기·권한 검증                                                |
| 메일/문자 | SES / 문자 발송 대행                                               | 인증 메일·예약 확정 알림                                                    |
| 비밀 정보 | Secrets Manager / SSM Parameter Store                              | OAuth secret, DB 자격 증명                                                  |
| 관측      | CloudWatch Logs·Alarms, 오류 추적(Sentry 등)                       | 개인정보 마스킹                                                             |
| 보안 헤더 | CloudFront 응답 헤더 정책: HSTS, CSP, X-Frame-Options              | 앱에서도 기본 헤더 설정(next.config.ts)                                     |
| 환경      | dev / staging / prod 계정 또는 VPC 분리                            |                                                                             |
