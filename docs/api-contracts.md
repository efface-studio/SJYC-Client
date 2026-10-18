# API 계약 초안

> SJYC-Server 저장소가 비어 있어(2026-10-17 확인) 프론트엔드 요구로 작성한 **초안**이다. 서버 확정 시 이 문서와 `src/api/client.ts`, `src/domain/types.ts` 를 함께 갱신한다. 실제 경로 매핑은 `src/api/http.ts`.

## 공통

- Base URL: `NEXT_PUBLIC_API_BASE_URL`
- 인증: HttpOnly 세션 쿠키, `credentials: 'include'`
- CSRF: GET 외 요청에 `X-XSRF-TOKEN` (쿠키 `XSRF-TOKEN` 값)
- 응답 envelope

```json
{ "success": true, "data": {} }
{ "success": false, "error": { "code": "CONFLICT", "message": "이미 신청한 프로그램입니다.", "reason": "DUPLICATE", "fieldErrors": { "phone": "..." } } }
```

- 오류 코드: `UNAUTHENTICATED`(401) `FORBIDDEN`(403) `NOT_FOUND`(404) `VALIDATION`(400/422) `CONFLICT`(409, reason: `DUPLICATE|CAPACITY_FULL|RECRUIT_CLOSED|EMAIL_TAKEN|CANCEL_DEADLINE_PASSED|INVALID_STATE`) `RATE_LIMITED`(429) `SERVER`(5xx)
- `message` 는 사용자에게 그대로 보여줄 수 있는 문장이어야 하며 스택·내부 정보를 담지 않는다.
- 목록: `?q=&status=&sort=newest|oldest|title&page=1&pageSize=10` → `{ items, total, page, pageSize }`
- 날짜: ISO 8601(UTC). 날짜만 필요한 입력(예약일·폼의 날짜)은 `YYYY-MM-DD`(서울 기준).

## 인증

| 메서드 | 경로                                                        | 설명                                                                                                               |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| GET    | `/auth/session`                                             | 현재 세션 `{ user, expiresAt }`, 없으면 401                                                                        |
| POST   | `/auth/login`                                               | `{ email, password }` → 세션. 실패 메시지는 원인을 특정하지 않는다                                                 |
| POST   | `/auth/logout`                                              | 세션 폐기                                                                                                          |
| POST   | `/auth/signup`                                              | `{ name, email, password, birthYear, agreeTerms, agreePrivacy, agreeMarketing }` → `{ requiresEmailVerification }` |
| POST   | `/auth/email-verification/resend`                           | `{ email }` (요청 제한)                                                                                            |
| POST   | `/auth/password-reset`                                      | `{ email }` — 가입 여부와 무관하게 같은 응답                                                                       |
| POST   | `/auth/password-reset/confirm`                              | `{ token, password }`                                                                                              |
| GET    | `/auth/oauth/{kakao\|naver\|apple\|google}/start?redirect=` | 서버 주도 OAuth 시작 (architecture.md 참고)                                                                        |

## 사용자

| 메서드 | 경로                                                         | 설명                                                                      |
| ------ | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| PATCH  | `/me/profile`                                                | `{ name, phone, agreeMarketing }` → User                                  |
| DELETE | `/me`                                                        | 탈퇴                                                                      |
| GET    | `/me/applications`, `/me/applications/{id}`                  | 본인 신청만 (타인 id 는 404)                                              |
| POST   | `/me/applications/{id}/cancel`                               | 취소 기한 검사                                                            |
| GET    | `/me/clubs`, `/me/club-applications`                         |                                                                           |
| GET    | `/me/reservations` · POST `/me/reservations/{id}/cancel`     |                                                                           |
| GET    | `/me/inquiries`, `/me/inquiries/{id}`                        | 본인 문의만                                                               |
| GET    | `/me/notifications`                                          | 본인 알림 `Notification[]`, 최신순. 읽지 않은 수는 `readAt === null` 개수 |
| POST   | `/me/notifications/read`                                     | `{ ids?: string[] }` — 생략하면 본인 알림 전체 읽음. 타인 id 는 무시      |
| GET    | `/media`                                                     | 센터 공식 채널 사진·영상 `MediaItem[]`, 최신순                            |
| GET    | `/program-categories`                                        | `[{ id, name, group }]`                                                   |
| GET    | `/programs`, `/programs/{id}`                                | 게시 상태만. `recruitStatus` 는 서버 계산                                 |
| POST   | `/programs/{id}/applications`                                | `{ phone, note, agreePrivacy }` → 접수번호(`receiptNo`) 발급              |
| GET    | `/notices`, `/notices/{id}`                                  | 게시 상태만, 고정 공지 우선                                               |
| GET    | `/clubs`, `/clubs/{id}`                                      |                                                                           |
| GET    | `/clubs/{id}/members`, `/clubs/{id}/posts`                   | 동아리원만. 명단은 마스킹된 이름                                          |
| POST   | `/clubs/{id}/applications`                                   | `{ motivation, agreePrivacy }`                                            |
| GET    | `/spaces`, `/spaces/{id}`, `/spaces/{id}/availability?date=` | 1시간 단위 슬롯                                                           |
| POST   | `/spaces/{id}/reservations`                                  | `{ date, startTime, endTime, headcount, phone, purpose, agreePrivacy }`   |
| POST   | `/inquiries`                                                 | `{ category, title, body, agreePrivacy }`                                 |
| GET    | `/faqs`                                                      | 게시된 FAQ                                                                |
| GET    | `/policies/{terms\|privacy\|no-email}`                       | `{ title, body, confirmed, effectiveAt }`                                 |

## 관리자 (모두 서버 권한 검사 필수)

| 메서드    | 경로                                                                                          | 권한                        |
| --------- | --------------------------------------------------------------------------------------------- | --------------------------- |
| GET       | `/admin/dashboard?periodDays=`                                                                | admin.access                |
| CRUD      | `/admin/notices`                                                                              | notice.write                |
| CRUD      | `/admin/programs` (신청 이력이 있으면 삭제 불가 → 비공개 전환)                                | program.write               |
| GET       | `/admin/applications`, `/admin/applications/{id}`                                             | application.decide          |
| POST      | `/admin/applications/decisions` `{ ids, decision, reason }` → `{ succeeded, failed[] }`       | application.decide          |
| GET/PATCH | `/admin/members`, `/admin/members/{id}` `{ roles?, status? }` (본인 변경 불가)                | member.read / member.manage |
| CRUD      | `/admin/clubs`, GET `/admin/club-applications`, POST `/admin/club-applications/{id}/decision` | club.manage                 |
| GET/PUT   | `/admin/spaces`, GET `/admin/reservations`, POST `/admin/reservations/{id}/decision`          | space.manage                |
| GET/PUT   | `/admin/inquiries`, `/admin/inquiries/{id}/answer`                                            | inquiry.answer              |
| CRUD      | `/admin/faqs`                                                                                 | inquiry.answer              |
| GET/PUT   | `/admin/policies`, `/admin/policies/{key}` `{ body, effectiveAt }`                            | policy.manage               |
| GET       | `/admin/audit-events`                                                                         | audit.read                  |

모든 관리자 변경은 서버가 감사 이벤트(`actor, action, target, summary, at`)를 남긴다. 개인정보 원문은 summary 에 넣지 않는다.

### 알림 생성 (서버 책임)

서버는 다음 처리 시점에 대상 회원에게 `Notification` 을 만든다. 클라이언트는 만들지 않는다 (mock 은 같은 시점에 흉내 낸다).

| 처리                                                      | kind               | link                               |
| --------------------------------------------------------- | ------------------ | ---------------------------------- |
| 프로그램 신청 승인·반려 (`/admin/applications/decisions`) | `application`      | `/my/applications/{id}`            |
| 공간 예약 확정·반려                                       | `reservation`      | `/my#reservations`                 |
| 동아리 가입 승인·반려                                     | `club_application` | 승인 `/clubs/{clubId}`, 반려 `/my` |
| 1:1 문의 답변 등록·수정                                   | `inquiry`          | `/qna/{id}`                        |
| 공지 (서버 정책에 따라 선택)                              | `notice`           | `/notices/{id}`                    |

반려 사유가 있으면 `body` 에 함께 넣는다. `link` 는 서비스 내부 경로만 허용한다.

### 동아리 등록·수정 본문 (`POST/PUT /admin/clubs`)

`{ name, field, summary, description, meetingInfo, recruiting, status, target?, photos?, activities?, sourceUrls? }`

- `target`: 문자열 또는 `null`(빈 값). `photos`: `[{ url, caption, sourceUrl, date: 'YYYY-MM-DD' | null }]` (최대 20), `activities`: `[{ date: 'YYYY-MM-DD' | 'YYYY-MM', title, url | null }]` (최대 30), `sourceUrls`: `string[]` (최대 10).
- 모든 주소는 `https:` 만 허용 (서버도 재검증).
- 선택 필드를 **보내지 않으면 기존 값을 유지**한다 (이전 버전 클라이언트 호환). 비우려면 `null` / `[]` 를 보낸다.

## 도메인 모델

`src/domain/types.ts` 참고: User, ConsentRecord, Session, ProgramCategory, Program, ProgramApplication(+StatusHistoryEntry), Notice, Attachment, Club(+MediaPhoto, ClubActivity), ClubMember, ClubPost, ClubApplication, Space, TimeSlot, SpaceReservation, Inquiry, Faq, PolicyDoc, Notification, MediaItem, AuditEvent, DashboardSummary, BulkResult.

- `Notification`: `{ id, userId, kind: 'application'|'reservation'|'club_application'|'inquiry'|'notice', title, body, link, createdAt, readAt | null }`
- `MediaItem`: `{ kind: 'photo'|'video', title, url, thumbnailUrl, sourceUrl, date | null }` — `sourceUrl` 은 원 게시물 주소, 화면에 "출처" 로 노출한다.
