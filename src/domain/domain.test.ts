import { hoursOn } from '@/config/center';
import { attendanceRate, memberStats, sessionCounts } from './attendance';
import { daysUntil, maskName } from '@/lib/format';
import {
  assignableRoles,
  can,
  canEnterConsole,
  canManageClub,
  canManageUser,
  PERMISSIONS,
  primaryRole,
} from './permissions';
import { computeRecruitStatus } from './program';
import {
  clubFormSchema,
  parseForm,
  parseValues,
  programApplySchema,
  programFormSchema,
  reservationSchema,
  signupSchema,
} from './schemas';
import { buildSlots, firstReservableDate, reservationWindowError, weekdayOf } from './space';
import type { AttendanceSession, AttendanceStatus } from './types';

const form = (values: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
};

describe('모집 상태 계산', () => {
  const base = {
    recruitStartsAt: '2026-10-10T00:00:00Z',
    recruitEndsAt: '2026-10-20T00:00:00Z',
    capacity: 10,
    appliedCount: 3,
  };
  it('기간·정원에 따라 상태를 정한다', () => {
    expect(computeRecruitStatus(base, new Date('2026-10-01T00:00:00Z'))).toBe('upcoming');
    expect(computeRecruitStatus(base, new Date('2026-10-15T00:00:00Z'))).toBe('open');
    expect(computeRecruitStatus({ ...base, appliedCount: 10 }, new Date('2026-10-15T00:00:00Z'))).toBe(
      'full',
    );
    expect(computeRecruitStatus(base, new Date('2026-10-21T00:00:00Z'))).toBe('closed');
  });
});

describe('권한(RBAC)', () => {
  it('일반 회원은 관리자 화면 권한이 없다', () => {
    expect(can({ roles: ['member'], status: 'active' }, 'admin.access')).toBe(false);
  });
  it('직원은 콘텐츠 관리는 가능하지만 회원 역할 변경·정책 문서는 불가', () => {
    const staff = { roles: ['staff' as const], status: 'active' as const };
    expect(can(staff, 'notice.write')).toBe(true);
    expect(can(staff, 'member.manage')).toBe(false);
    expect(can(staff, 'policy.manage')).toBe(false);
  });
  it('정지된 관리자는 아무 권한도 없다', () => {
    expect(can({ roles: ['admin'], status: 'suspended' }, 'admin.access')).toBe(false);
  });
  it('최고 관리자와 개발자는 운영 콘솔을 조회하고 개발자만 변경한다', () => {
    const developer = { roles: ['developer' as const], status: 'active' as const };
    const admin = { roles: ['admin' as const], status: 'active' as const };
    for (const p of PERMISSIONS) expect(can(developer, p)).toBe(true);
    expect(can(admin, 'developer.view')).toBe(true);
    expect(can({ roles: ['staff'], status: 'active' }, 'developer.view')).toBe(false);
    expect(can(admin, 'developer.access')).toBe(false);
    expect(can(admin, 'member.manage')).toBe(true);
  });
  it('개발자 역할은 개발자만 부여하고, 개발자 계정은 개발자만 변경한다', () => {
    const developer = { roles: ['developer' as const], status: 'active' as const };
    const admin = { roles: ['admin' as const], status: 'active' as const };
    const staff = { roles: ['staff' as const], status: 'active' as const };
    expect(assignableRoles(admin)).not.toContain('developer');
    expect(assignableRoles(developer)).toContain('developer');
    expect(assignableRoles(staff)).toEqual([]);
    expect(canManageUser(admin, { roles: ['developer'] })).toBe(false);
    expect(canManageUser(admin, { roles: ['staff'] })).toBe(true);
    expect(canManageUser(developer, { roles: ['developer'] })).toBe(true);
  });
  it('동아리 담당자는 지정된 동아리만 관리하고, 관리자 화면은 그 메뉴로만 들어온다', () => {
    const manager = { roles: ['member' as const], status: 'active' as const, managedClubIds: ['cl-1'] };
    const staff = { roles: ['staff' as const], status: 'active' as const, managedClubIds: [] };
    const member = { roles: ['member' as const], status: 'active' as const, managedClubIds: [] };
    expect(canManageClub(manager, 'cl-1')).toBe(true);
    expect(canManageClub(manager, 'cl-2')).toBe(false);
    expect(canManageClub(staff, 'cl-2')).toBe(true);
    expect(canManageClub({ ...manager, status: 'suspended' }, 'cl-1')).toBe(false);
    expect(canEnterConsole(manager)).toBe(true);
    expect(canEnterConsole(member)).toBe(false);
    expect(can(manager, 'admin.access')).toBe(false);
  });
  it('대표 역할은 가장 높은 역할', () => {
    expect(primaryRole({ roles: ['member', 'developer', 'staff'] })).toBe('developer');
    expect(primaryRole({ roles: ['member'] })).toBe('member');
  });
});

describe('폼 검증', () => {
  it('회원가입: 비밀번호 확인 불일치와 필수 동의 누락을 잡는다', () => {
    const r = parseForm(
      signupSchema,
      form({
        name: '홍길동',
        email: 'a@b.co',
        password: 'abcd1234',
        passwordConfirm: 'abcd12345',
        phone: '010-1234-5678',
        birthYear: '2008',
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.passwordConfirm).toBeDefined();
      expect(r.errors.agreeTerms).toBeDefined();
      expect(r.errors.agreePrivacy).toBeDefined();
    }
  });

  it('프로그램 신청: 연락처 형식과 개인정보 동의가 필요하다', () => {
    expect(parseForm(programApplySchema, form({ phone: '123', note: '' })).ok).toBe(false);
    expect(
      parseForm(programApplySchema, form({ phone: '010-1234-5678', note: '', agreePrivacy: 'on' })).ok,
    ).toBe(true);
  });

  it('관리자 프로그램: 모집 마감이 시작일보다 늦으면 거부한다', () => {
    const r = parseForm(
      programFormSchema,
      form({
        title: '테스트',
        categoryId: 'c-edu',
        summary: '요약',
        description: '설명',
        target: '중학생',
        place: '강의실',
        startsAt: '2026-11-01',
        endsAt: '2026-11-30',
        recruitStartsAt: '2026-10-20',
        recruitEndsAt: '2026-11-05',
        cancelDeadline: '2026-10-30',
        capacity: '10',
        status: 'draft',
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.recruitEndsAt).toBeDefined();
  });

  it('공간 예약: 종료 시간이 시작보다 빠르면 거부한다', () => {
    const r = parseForm(
      reservationSchema,
      form({
        date: '2026-10-19',
        startTime: '15:00',
        endTime: '14:00',
        headcount: '3',
        phone: '01012345678',
        purpose: '스터디 모임',
        agreePrivacy: 'on',
      }),
    );
    expect(r.ok).toBe(false);
  });
});

describe('공간 예약 시간 규칙', () => {
  it('요일 계산은 달력 날짜 기준이다', () => {
    expect(weekdayOf('2026-10-18')).toBe(0); // 일요일
    expect(weekdayOf('2026-10-17')).toBe(6); // 토요일
  });
  it('평일은 09–21시, 일요일은 슬롯이 없다', () => {
    expect(buildSlots('2026-10-19', [])).toHaveLength(12);
    expect(buildSlots('2026-10-18', [])).toHaveLength(0);
  });
  it('기존 예약과 겹치는 칸은 예약 불가로 표시한다', () => {
    const slots = buildSlots('2026-10-19', [{ startTime: '15:00', endTime: '17:00' }]);
    expect(slots.filter((s) => !s.available).map((s) => s.start)).toEqual(['15:00', '16:00']);
  });
  it('당일·30일 초과·일요일·3시간 초과를 거부한다', () => {
    const today = '2026-10-17';
    expect(reservationWindowError('2026-10-17', '10:00', '11:00', today)).not.toBeNull();
    expect(reservationWindowError('2026-11-30', '10:00', '11:00', today)).not.toBeNull();
    expect(reservationWindowError('2026-10-18', '10:00', '11:00', today)).not.toBeNull();
    expect(reservationWindowError('2026-10-19', '10:00', '14:00', today)).not.toBeNull();
    expect(reservationWindowError('2026-10-19', '10:00', '12:00', today)).toBeNull();
  });
  it('기본 날짜는 내일 이후 첫 예약 가능일', () => {
    expect(firstReservableDate('2026-10-17')).toBe('2026-10-19');
  });
});

describe('기관 운영시간·표시 유틸', () => {
  it('둘째 주 일요일은 휴관으로 표시한다', () => {
    expect(hoursOn(new Date('2026-10-11T03:00:00Z')).open).toBe(false);
    expect(hoursOn(new Date('2026-10-18T03:00:00Z')).open).toBe(true);
  });
  it('D-day 와 이름 마스킹', () => {
    expect(daysUntil('2026-10-22T09:00:00Z', new Date('2026-10-17T03:00:00Z'))).toBe(5);
    expect(maskName('홍길동')).toBe('홍*동');
    expect(maskName('김수')).toBe('김*');
  });
});

describe('동아리 폼 스키마', () => {
  const base = {
    name: '밴드 동아리',
    field: '음악',
    summary: '요약',
    description: '소개',
    meetingInfo: '매주 토요일',
    status: 'active',
  };

  it('확장 필드가 없어도 통과한다 (모바일 관리자 앱 호환)', () => {
    const r = parseValues(clubFormSchema, base);
    expect(r.ok).toBe(true);
    if (r.ok) expect('photos' in r.data).toBe(false);
  });

  it('https 가 아닌 주소는 행 단위 오류로 거부한다', () => {
    const r = parseValues(clubFormSchema, {
      ...base,
      photos: [
        { url: 'http://example.com/a.jpg', caption: '사진', sourceUrl: 'https://example.com', date: '' },
      ],
      activities: [{ date: '2026-10-01', title: '공연', url: 'javascript:alert(1)' }],
      sourceUrls: ['https://example.com/post'],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors['photos.0.url']).toMatch(/https/);
      expect(r.errors['activities.0.url']).toMatch(/https/);
      expect(r.errors.sourceUrls).toBeUndefined();
    }
  });

  it('빈 대상·날짜·링크는 null 로 정리한다', () => {
    const r = parseValues(clubFormSchema, {
      ...base,
      target: ' ',
      photos: [
        { url: 'https://example.com/a.jpg', caption: '사진', sourceUrl: 'https://example.com', date: '' },
      ],
      activities: [{ date: '2026-10-01', title: '공연', url: '' }],
    });
    expect(r.ok && r.data).toMatchObject({
      target: null,
      photos: [{ date: null }],
      activities: [{ url: null }],
    });
  });
});

describe('출석 통계', () => {
  const session = (id: string, marks: [string, AttendanceStatus | null][]): AttendanceSession => ({
    id,
    targetType: 'club',
    targetId: 'cl-1',
    targetName: '동아리',
    date: '2026-10-01',
    title: id,
    checkInCode: null,
    checkInClosesAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    createdBy: '담당자',
    records: marks.map(([userId, status]) => ({
      userId,
      name: userId === 'a' ? '가나' : '다라',
      status,
      checkedAt: null,
      method: null,
      note: null,
    })),
  });

  it('출석률은 (출석+지각) / 체크된 회차이며 공결은 분모에서 뺀다', () => {
    expect(attendanceRate({ present: 2, late: 1, absent: 1, excused: 3 })).toBe(75);
    expect(attendanceRate({ present: 0, late: 0, absent: 0, excused: 2 })).toBeNull();
  });

  it('회원별로 누적하고 체크하지 않은 회차는 세지 않는다', () => {
    const stats = memberStats([
      session('s1', [
        ['a', 'present'],
        ['b', 'absent'],
      ]),
      session('s2', [
        ['a', 'late'],
        ['b', null],
      ]),
    ]);
    expect(stats).toEqual([
      { userId: 'a', name: '가나', present: 1, late: 1, absent: 0, excused: 0, rate: 100 },
      { userId: 'b', name: '다라', present: 0, late: 0, absent: 1, excused: 0, rate: 0 },
    ]);
  });

  it('회차 집계는 미체크 인원을 따로 센다', () => {
    expect(
      sessionCounts(
        session('s', [
          ['a', 'present'],
          ['b', null],
        ]),
      ),
    ).toEqual({
      present: 1,
      late: 0,
      absent: 0,
      excused: 0,
      unchecked: 1,
    });
  });
});
