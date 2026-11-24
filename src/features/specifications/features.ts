export interface Feature {
  key: string;
  title: string;
  area: string;
  role: string;
  entry: string;
  purpose: string;
  inputs: string;
  steps: string[];
  exceptions: string;
  api: string[];
}

export const features: Feature[] = [
  {
    key: 'signup',
    title: '회원가입과 이메일 인증',
    area: '계정',
    role: '방문자',
    entry: '/signup',
    purpose: '이메일 계정을 만들고 메일함의 일회용 링크로 본인 소유를 확인한다.',
    inputs:
      '이름 2~20자, 이메일, 영문과 숫자를 포함한 8~64자 비밀번호, 비밀번호 확인, 생년월일, 필수 약관 2종. 휴대전화와 소식 수신 동의는 선택이다. 서버에는 출생 연도를 전송한다.',
    steps: [
      '입력 중 비밀번호 세 조건과 확인란의 일치 여부를 표시한다.',
      '가입 요청을 검증하고 이메일 인증 대기 계정을 만든다.',
      '받은 메일에서 24시간 이내에 링크를 연 뒤 로그인한다.',
    ],
    exceptions:
      '형식 오류는 해당 필드에 표시한다. 미인증 계정은 로그인할 수 없다. 인증 완료 계정의 주소를 다시 사용하면 중복 오류를 반환한다.',
    api: [
      'POST /auth/signup',
      'POST /auth/email-verification/resend',
      'GET /auth/email-verification/confirm',
    ],
  },
  {
    key: 'session',
    title: '로그인·세션과 비밀번호 재설정',
    area: '계정',
    role: '회원·운영자',
    entry: '/login · /admin/login',
    purpose: '사용자와 관리자가 각 진입점에서 세션을 시작하고 잃어버린 비밀번호를 재설정한다.',
    inputs: '로그인은 이메일과 비밀번호를 받는다. 재설정은 이메일로 요청한 뒤 토큰과 새 비밀번호를 보낸다.',
    steps: [
      '로그인 성공 시 서버가 HttpOnly 세션 쿠키를 발급한다.',
      '현재 세션의 역할과 상태로 접근 가능한 메뉴를 결정한다.',
      '비밀번호 재설정 성공 시 기존 세션을 폐기한다.',
    ],
    exceptions:
      '정지·미인증 계정과 만료된 세션은 접근이 제한된다. 재설정 요청은 이메일 가입 여부와 관계없이 같은 응답을 보낸다.',
    api: [
      'POST /auth/login',
      'GET /auth/session',
      'POST /auth/logout',
      'POST /auth/password-reset',
      'POST /auth/password-reset/confirm',
    ],
  },
  {
    key: 'programs',
    title: '프로그램 탐색·신청·취소',
    area: '이용자 서비스',
    role: '방문자 조회 / 회원 신청',
    entry: '/programs · /my',
    purpose: '모집 중인 활동을 찾아 신청하고 접수번호와 처리 상태를 확인한다.',
    inputs: '분류, 검색어, 모집 상태로 목록을 좁힌다. 신청에는 연락처, 개인정보 동의가 필요하다.',
    steps: [
      '프로그램 상세에서 대상·정원·일정과 마감을 확인한다.',
      '접수 시 서버가 남은 정원과 중복 신청을 검사하고 신청 기록을 만든다.',
      'MY에서 상태와 취소 가능 기한을 확인한다.',
    ],
    exceptions: '모집 종료, 정원 초과, 중복 접수 및 취소 기한 경과는 해당 사유가 있는 충돌로 처리한다.',
    api: [
      'GET /programs',
      'GET /programs/:id',
      'POST /programs/:id/applications',
      'GET /me/applications',
      'POST /me/applications/:id/cancel',
    ],
  },
  {
    key: 'spaces',
    title: '공간 예약과 시간 충돌',
    area: '이용자 서비스',
    role: '방문자 조회 / 회원 신청',
    entry: '/spaces · /my',
    purpose: '공간별 운영 시간과 수용 인원을 확인하고 연속 시간대를 예약한다.',
    inputs:
      '내일부터 30일 이내의 날짜, 1시간 단위 시작·종료 시각, 최대 3시간. 이용 인원, 목적, 휴대전화, 필수 동의를 입력한다.',
    steps: [
      '공간을 고르고 예약 가능 시간대를 조회한다.',
      '서버가 시설 상태, 정원, 시간 중복을 다시 확인하고 신청을 접수한다.',
      '직원이 확정 또는 반려하면 회원이 MY에서 결과를 확인한다.',
    ],
    exceptions:
      '일요일, 운영 시간 밖, 수용 인원 초과, 이미 선점된 시간은 신청할 수 없다. 지난 예약과 이미 처리된 취소 요청은 거절한다.',
    api: [
      'GET /spaces',
      'GET /spaces/:id/availability',
      'POST /spaces/:id/reservations',
      'GET /me/reservations',
      'POST /me/reservations/:id/cancel',
    ],
  },
  {
    key: 'clubs',
    title: '동아리 가입과 회원 전용 콘텐츠',
    area: '이용자 서비스',
    role: '방문자·회원·동아리원',
    entry: '/clubs · /my',
    purpose: '동아리 소개와 모집 여부를 보고 가입 신청 후 회원 전용 영역을 이용한다.',
    inputs: '가입 동기 10~500자와 개인정보 동의. 신청 대상은 공개된 동아리다.',
    steps: [
      '동아리 상세에서 활동 내용과 모집 여부를 확인한다.',
      '회원이 신청을 제출하고 MY에서 진행 상태를 본다.',
      '승인된 동아리원에게 명단과 활동 소식을 제공한다.',
    ],
    exceptions:
      '중복 신청·기존 회원 여부·모집 상태를 확인한다. 다른 동아리의 비공개 명단과 게시물 접근은 제한한다.',
    api: [
      'GET /clubs',
      'POST /clubs/:id/applications',
      'GET /clubs/:id/members',
      'GET /clubs/:id/posts',
      'GET /me/club-applications',
    ],
  },
  {
    key: 'attendance',
    title: '출석 회차·QR·개인 기록',
    area: '활동 운영',
    role: '센터 직원 또는 담당 동아리 운영자 / 참여 회원',
    entry: '/admin/attendance · 앱 MY',
    purpose: '회차별 출석부를 만들고 QR 또는 숫자 코드로 본인 출석을 기록한다.',
    inputs: '활동 종류와 대상 ID, 회차 날짜·제목. 출석 수정은 명단의 회원 ID, 상태, 선택 메모를 받는다.',
    steps: [
      '운영자가 허용된 활동에서 회차를 생성하고 체크인을 연다.',
      '회원이 앱에서 QR을 스캔하거나 표시된 코드를 직접 입력한다.',
      '담당자가 출석·지각·결석·인정 상태를 확인하고 대상별 통계를 조회한다.',
    ],
    exceptions:
      '닫힌 회차, 유효하지 않은 코드, 참여 대상이 아닌 회원은 출석할 수 없다. 동아리 담당자의 편집 범위는 배정된 동아리다.',
    api: [
      'GET /attendance/targets',
      'POST /attendance/sessions',
      'POST /attendance/sessions/:id/check-in',
      'POST /me/attendance/check-in',
      'PUT /attendance/sessions/:id/records',
      'GET /attendance/stats',
    ],
  },
  {
    key: 'inquiries',
    title: '1:1 문의와 FAQ',
    area: '이용자 서비스',
    role: '회원 / 문의 답변 담당자',
    entry: '/qna · /admin/inquiries · /admin/faqs',
    purpose: '공개된 자주 묻는 질문을 읽거나 개인 문의에 답변을 받는다.',
    inputs: '문의 분류, 제목, 내용, 개인정보 동의. FAQ는 분류·질문·답변·표시 순서·공개 상태를 갖는다.',
    steps: [
      '회원이 문의를 작성하고 본인 문의 목록에서 확인한다.',
      '담당자가 관리자 상세 화면에 답변을 저장한다.',
      '반복 질문은 공개 FAQ로 등록해 이용자가 검색할 수 있게 한다.',
    ],
    exceptions: '다른 회원의 문의 상세는 열 수 없다. FAQ는 공개 설정된 항목만 사용자 화면에 표시한다.',
    api: [
      'GET /faqs',
      'POST /inquiries',
      'GET /me/inquiries/:id',
      'PUT /admin/inquiries/:id/answer',
      'POST /admin/faqs',
    ],
  },
  {
    key: 'account',
    title: '프로필·알림·회원 탈퇴',
    area: '계정',
    role: '로그인 회원',
    entry: '/my · /my/profile · /notifications',
    purpose: '본인 연락처와 동의 상태를 관리하고 활동 알림을 확인한다.',
    inputs: '변경할 이름, 선택 휴대전화 및 수신 동의. 탈퇴 화면은 명시적인 확인 문구와 동의를 받는다.',
    steps: [
      '프로필을 열어 저장된 정보를 확인한다.',
      '정보를 저장하거나 지정한 알림을 읽음으로 표시한다.',
      '탈퇴 확인을 마치면 기존 세션으로 로그인 상태를 유지할 수 없다.',
    ],
    exceptions: '휴대전화 형식이 맞지 않으면 수정하지 않는다. 알림과 세션은 본인 기준으로 처리한다.',
    api: ['PATCH /me/profile', 'GET /me/notifications', 'POST /me/notifications/read', 'DELETE /me'],
  },
  {
    key: 'dashboard',
    title: '대시보드와 운영 현황',
    area: '활동 운영',
    role: '센터 직원 이상',
    entry: '/admin',
    purpose: '선택 기간의 신청·예약·문의 현황을 확인하고 처리 목록으로 이동한다.',
    inputs: '조회 기간(periodDays)과 관리자 세션.',
    steps: [
      '요약 화면에서 기간을 선택한다.',
      '집계와 대기 건수를 확인한다.',
      '처리할 신청·예약·문의의 목록 또는 상세로 이동한다.',
    ],
    exceptions: '세션 만료 시 관리자 로그인으로 이동한다. 각 상세 메뉴는 역할별 권한을 다시 확인한다.',
    api: ['GET /admin/dashboard'],
  },
  {
    key: 'decisions',
    title: '프로그램 등록과 신청 심사',
    area: '활동 운영',
    role: '프로그램 등록 또는 신청 처리 권한',
    entry: '/admin/programs · /admin/applications',
    purpose: '프로그램 정보를 게시하고 접수된 신청을 일괄 또는 개별 처리한다.',
    inputs:
      '프로그램명·분류·정원·모집 및 운영 기간·게시 상태. 심사는 신청 ID 목록과 승인·반려 결정, 사유를 받는다.',
    steps: [
      '초안·게시·숨김 중 상태를 선택하고 모집 기간과 시작일을 검증한다.',
      '신청 목록에서 접수 상태를 확인하고 처리할 항목을 선택한다.',
      '처리 건별 결과와 실패 사유를 확인한다.',
    ],
    exceptions:
      '종료일이 시작일보다 이르거나 모집 종료일이 행사 시작일보다 늦으면 저장할 수 없다. 이미 처리된 신청은 다시 심사하지 않는다.',
    api: [
      'POST /admin/programs',
      'PUT /admin/programs/:id',
      'GET /admin/applications',
      'POST /admin/applications/decisions',
    ],
  },
  {
    key: 'facilities',
    title: '공간 설정과 예약 심사',
    area: '활동 운영',
    role: '공간 예약 관리 권한',
    entry: '/admin/spaces',
    purpose: '시설의 수용 인원과 예약 가능 여부를 관리하고 접수된 이용 신청을 처리한다.',
    inputs: '설명, 정원, 예약 가능 여부. 예약 목록은 시설·날짜·상태로 조회한다.',
    steps: [
      '관리할 공간의 이용 조건을 수정한다.',
      '예약의 날짜·인원·사용 목적을 확인한다.',
      '담당자가 승인하거나 반려 사유를 기록한다.',
    ],
    exceptions:
      '새 접수는 최신 정원과 예약 가능 상태를 따른다. 이미 처리된 예약은 처리 가능 상태인지 다시 검사한다.',
    api: [
      'GET /admin/spaces',
      'PUT /admin/spaces/:id',
      'GET /admin/reservations',
      'POST /admin/reservations/:id/decision',
    ],
  },
  {
    key: 'club-management',
    title: '동아리 심사와 담당자 배정',
    area: '활동 운영',
    role: '동아리 관리 권한 / 배정된 담당자',
    entry: '/admin/clubs · /admin/my-clubs',
    purpose: '동아리 기본 정보, 가입 심사, 회원 역할, 담당자 및 활동 소식을 관리한다.',
    inputs: '동아리 ID, 가입 신청 ID, 승인·반려 결정, 담당자 이메일 또는 회원 ID.',
    steps: [
      '직원이 동아리를 등록하고 기존 회원 계정을 담당자로 지정한다.',
      '담당자는 배정된 동아리의 신청을 검토하고 명단을 관리한다.',
      '소개와 소식을 편집하면 동아리 상세에 반영된다.',
    ],
    exceptions:
      '배정되지 않은 동아리에서는 담당자 기능을 실행할 수 없다. 가입 승인과 회원 역할 변경은 서버에서 소속과 현재 상태를 확인한다.',
    api: [
      'POST /admin/clubs',
      'POST /admin/clubs/:id/managers',
      'GET /manage/clubs',
      'GET /manage/clubs/:clubId/members',
      'POST /manage/clubs/:clubId/posts',
    ],
  },
  {
    key: 'announcements',
    title: '공지사항·갤러리·센터 안내',
    area: '콘텐츠',
    role: '방문자 / 공지 작성 담당자',
    entry: '/notices · /gallery · /about · /admin/notices',
    purpose: '센터 공지와 공식 소식을 열람하고 운영자가 공지 공개 순서를 관리한다.',
    inputs: '공지 제목·분류·본문·상단 고정·게시 상태. 목록은 분류와 검색어를 받는다.',
    steps: [
      '담당자가 공지를 작성해 초안 저장 또는 게시한다.',
      '사용자 목록에는 게시된 공지가 표시되며 고정 공지는 우선 노출된다.',
      '방문자는 미디어 목록과 센터 안내에서 활동 사진과 방문 정보를 찾는다.',
    ],
    exceptions: '숨김 또는 초안 공지는 일반 사용자 상세에서 노출하지 않는다.',
    api: ['GET /notices', 'GET /media', 'POST /admin/notices', 'PUT /admin/notices/:id'],
  },
  {
    key: 'settings',
    title: '사이트 설정과 홈 배너',
    area: '콘텐츠',
    role: '사이트 설정 관리 권한',
    entry: '/admin/settings',
    purpose: '센터 기본 정보, 운영시간, 메뉴 순서, 공식 링크와 앱 홈 배너를 운영한다.',
    inputs: '현재 버전(version)과 수정한 설정값(values). 배너는 게시 여부, 이미지와 목적지 정보를 사용한다.',
    steps: [
      '현재 설정과 버전을 조회한다.',
      '운영 문구와 노출 항목을 수정하고 저장한다.',
      '공개 설정을 사용하는 웹과 앱에서 변경값이 반영된다.',
    ],
    exceptions:
      '다른 관리자가 먼저 저장한 경우 버전 충돌을 반환한다. 최신 버전을 다시 읽은 후 변경 내용을 적용한다.',
    api: ['GET /site/settings', 'PUT /admin/site-settings'],
  },
  {
    key: 'members',
    title: '회원 조회와 권한 관리',
    area: '계정',
    role: '회원 조회 / 회원 관리 권한',
    entry: '/admin/members',
    purpose: '회원을 검색하고 권한 범위 안에서 역할 또는 이용 상태를 변경한다.',
    inputs: '검색어·상태·회원 ID. 변경할 역할이나 계정 상태를 명시한다.',
    steps: [
      '회원 목록에서 대상을 검색한다.',
      '상세에서 현재 역할과 상태를 확인한다.',
      '변경 가능 대상일 때만 수정 내용을 저장한다.',
    ],
    exceptions: '조회 권한과 수정 권한을 구분한다. 개발자 계정과 역할의 변경에는 개발자 권한이 필요하다.',
    api: ['GET /admin/members', 'GET /admin/members/:id', 'PATCH /admin/members/:id'],
  },
  {
    key: 'policy',
    title: '약관과 개인정보처리방침',
    area: '콘텐츠',
    role: '방문자 / 정책 문서 관리 권한',
    entry: '/policies · /admin/policies',
    purpose: '이용자가 공개 정책을 읽고 관리자가 본문과 시행일을 갱신한다.',
    inputs: '정책 키, 문서 본문 10~50,000자, YYYY-MM-DD 형식의 시행일.',
    steps: [
      '관리자가 정책 목록에서 문서를 선택한다.',
      '본문·시행일을 저장하고 공개 화면에서 확인한다.',
      '가입 화면의 약관 링크로 같은 정책 문서에 접근할 수 있다.',
    ],
    exceptions: '허용되지 않은 키, 비어 있는 본문 또는 잘못된 시행일은 저장할 수 없다.',
    api: ['GET /policies/:key', 'GET /admin/policies', 'PUT /admin/policies/:key'],
  },
  {
    key: 'diagnostics',
    title: '감사 로그·서버 진단',
    area: '시스템',
    role: '감사 로그 조회 / 개발자 권한',
    entry: '/admin/audit · /admin/developer',
    purpose: '운영 작업 이력과 서버 상태를 구분해 확인하고 문제가 발생한 요청을 추적한다.',
    inputs: '감사 이벤트 조회 조건 및 페이지. 서버 로그 조회에는 개발자 세션이 필요하다.',
    steps: [
      '감사 로그에서 변경 주체·대상·작업 결과를 확인한다.',
      '개발자 콘솔에서 최근 서버 로그와 API 요청 결과를 점검한다.',
      '상태 확인 API로 데이터베이스와 Redis 응답을 확인한다.',
    ],
    exceptions:
      '운영 기록 조회 권한이 없는 계정에는 해당 데이터가 표시되지 않는다. 상태 검사 실패는 정상 응답으로 처리하지 않는다.',
    api: ['GET /admin/audit-events', 'GET /admin/server-logs', 'GET /health'],
  },
];
