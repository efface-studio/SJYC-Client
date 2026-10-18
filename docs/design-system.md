# 디자인 시스템

토큰 정의: `src/app/globals.css` (`@theme`). 근거: `docs/brand-audit.md`.

## 방향

- 공공기관 서비스의 신뢰감 + 청소년이 바로 행동할 수 있는 명료함. 장식보다 **실제 정보**(오늘 운영시간, 마감 D-day, 잔여석)로 위계를 만든다.
- 구획은 카드·그림자 대신 **선과 여백**: 섹션은 2px 검정 상단 선, 목록은 1px 구분선.
- 주황(`brand-500`)은 헤더 상단 띠와 강조 표식에만, 행동 요소는 AA 대비를 만족하는 `brand-700`.
- 사용자 웹은 모바일 우선(하단 탭바, 44px 이상 터치 영역, 16px 입력 글자). 관리자 웹은 같은 토큰을 쓰되 더 촘촘한 표와 회색 배경(`surface-admin`).

### 쓰지 않는 것

알약형 칩, 아이콘 타일 격자, 그라데이션·글로우·유리 효과, 의미 없는 이모지, 모든 섹션을 감싸는 둥근 카드, 가짜 통계·후기, 마케팅 문구 위주의 거대한 히어로.

## 토큰

| 범주   | 토큰                                                                                                                                                                                |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 색     | `brand-50/100/200/500/700/800`, `ink-900/700/600`, `line`, `line-strong`, `surface`, `surface-muted`, `surface-admin`, 상태 `success/danger/warning/info` (`-700` 글자, `-50` 배경) |
| 반경   | `sm 2px`, `md 4px`, `lg 6px`                                                                                                                                                        |
| 그림자 | `overlay` (모달·토스트에만)                                                                                                                                                         |
| 서체   | Pretendard Variable, 제목 자간 -0.025em, 숫자는 `tabular-nums`                                                                                                                      |
| 간격   | Tailwind 기본 4px 단위, 페이지 좌우 16px(모바일)/24px                                                                                                                               |
| 레이어 | 헤더·탭바 30, 모달 dialog(top layer), 토스트 50                                                                                                                                     |

## 컴포넌트 (`src/components/ui`)

| 컴포넌트                                                                        | 규칙                                                                                                                                                  |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button / buttonClass                                                            | primary(brand-700) · secondary(테두리) · tertiary(텍스트) · destructive(danger). sm 36 / md 44 / lg 52px. loading 시 스피너+aria-busy, 중복 제출 방지 |
| TextField, PasswordField, TextAreaField, SelectField, CheckboxField             | 레이블 필수, hint/error 를 aria-describedby 로 연결, aria-invalid, 필수 표시는 시각+스크린리더 문구                                                   |
| FormError                                                                       | 서버 오류 요약, role="alert"                                                                                                                          |
| Badge                                                                           | 색 띠 + 굵은 텍스트(색만으로 상태 전달 금지)                                                                                                          |
| Modal / ConfirmDialog                                                           | 네이티브 `<dialog>` — 포커스 가두기·Esc·포커스 복원, 모바일 85dvh 내부 스크롤, drawer 변형                                                            |
| Toast                                                                           | aria-live polite, 모바일은 탭바 위                                                                                                                    |
| Skeleton, ListSkeleton, EmptyState, ErrorState(재시도), ForbiddenState, Callout | 모든 데이터 화면의 로딩·빈·오류·권한 없음 상태                                                                                                        |
| Pagination, PageHeader(breadcrumb)                                              | aria-current, 44px 터치                                                                                                                               |

## 패턴

- 목록 상태 표시: 상단 밑줄 탭(모집 상태·분류), 검색은 `role="search"` 폼.
- 상세 화면 행동 버튼: 모바일은 하단 탭바 위에 고정, 데스크톱은 우측 고정 영역.
- 폼: `noValidate` + Zod, 필드 아래 오류, 상단 FormError, 개인정보 동의는 항목·목적·보유기간을 함께 표시.
- 개발용 mock 상태는 상단 띠로 항상 표시.

## 다크 모드

적용하지 않았다. 공식 로고가 흰 배경 JPG 뿐이고 공식 컬러 규정이 없어 어두운 배경에서 브랜드를 보장할 수 없다. 벡터 로고 확보 후 재평가한다.

## 접근성 체크리스트

시맨틱 제목 계층, 본문 바로가기 링크, 키보드 포커스 표시(3px brand-700), 레이블 연결, 대체 텍스트, AA 대비, `prefers-reduced-motion`, 동적 결과 aria-live, 200% 확대 시 가로 스크롤 없음(유동 레이아웃·`overflow-wrap:anywhere`).
