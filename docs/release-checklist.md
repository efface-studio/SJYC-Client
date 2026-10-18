# 출시 준비 체크리스트

## 서버·연동

- [ ] SJYC-Server 가 `docs/api-contracts.md` 계약을 구현(또는 차이를 문서화하고 `src/api/http.ts` 수정)
- [ ] `NEXT_PUBLIC_API_MODE=http`, `NEXT_PUBLIC_API_BASE_URL` 설정 후 전 화면 수동 점검
- [ ] 세션 쿠키 `HttpOnly; Secure; SameSite`, CSRF 토큰, CORS(웹 출처만 허용, credentials)
- [ ] 모든 관리자 API 서버 측 권한 검사·감사 로그
- [ ] 요청 제한: 로그인, 비밀번호 재설정, 인증 메일 재발송, 문의 작성

## OAuth (공급자별)

- [ ] 카카오/네이버/Apple/Google 앱 등록, Redirect URI = 서버 콜백
- [ ] client secret 은 서버 비밀 저장소에만, state·nonce·PKCE
- [ ] 공식 로그인 버튼 리소스(로고) 적용 — `src/features/auth/social-login.tsx` TODO
- [ ] Apple: 이메일 가리기(private relay) 대응, 이름 최초 1회 제공
- [ ] `NEXT_PUBLIC_OAUTH_PROVIDERS` 에 완료된 공급자만 추가
- [ ] 계정 연결/해제 화면(내 정보) 구현

## 콘텐츠·정책 (센터 확인)

- [ ] 이용약관·개인정보처리방침·이메일 무단수집거부 확정본 관리자 화면에서 등록
- [ ] 개인정보 수집 항목·보유 기간, 만 14세 미만 동의 절차 법률 검토
- [ ] 공간 예약·프로그램 접수·취소 정책 확정 (`docs/product-scope.md` 정책 가정 표)
- [ ] 공식 로고 벡터·사용 권한, 사진 사용 권한
- [ ] 실제 공간 목록·수용 인원, 프로그램 분류 확정

## 운영

- [ ] 오류 추적·로그(개인정보 마스킹), 알람
- [ ] DB 백업·복구 리허설
- [ ] 보안 헤더(CSP 포함) — CloudFront 응답 헤더 정책
- [ ] 개발 도구·데모 띠가 http 모드에서 보이지 않는지 확인

## QA

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm e2e`
- [ ] 실기기: iOS Safari, Android Chrome (키보드가 제출 버튼을 가리지 않는지, safe-area)
- [ ] 320px / 375px / 768px / 1024px / 1440px, 200% 확대
- [ ] 스크린 리더(VoiceOver/TalkBack) 로그인·신청·예약 흐름
