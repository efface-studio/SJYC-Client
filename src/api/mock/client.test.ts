import { addDays, firstReservableDate } from '@/domain/space';
import { todayKst } from '@/lib/format';
import { ApiError } from '../errors';
import { mockClient as api, mockDev } from './client';
import { clubFormSchema, parseValues } from '@/domain/schemas';
import { DEMO_PASSWORD, createSeed } from './seed';

const login = (email: string) => api.auth.login({ email, password: DEMO_PASSWORD });

async function expectCode(p: Promise<unknown>, code: ApiError['code'], reason?: string) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).code).toBe(code);
  if (reason) expect((err as ApiError).reason).toBe(reason);
}

beforeEach(() => {
  sessionStorage.clear();
  mockDev.reset();
});

describe('mock adapter — 서버 규칙 재현', () => {
  it('잘못된 비밀번호는 원인을 특정하지 않는 오류로 거부한다', async () => {
    await expectCode(api.auth.login({ email: 'member@demo.test', password: 'wrong' }), 'VALIDATION');
  });

  it('로그인하지 않으면 신청할 수 없다', async () => {
    await expectCode(
      api.programs.apply('p-1', { phone: '01012345678', note: '', agreePrivacy: 'on' }),
      'UNAUTHENTICATED',
    );
  });

  it('일반 회원은 관리자 API 를 호출할 수 없다', async () => {
    await login('member@demo.test');
    await expectCode(api.admin.dashboard(7), 'FORBIDDEN');
  });

  it('중복 신청과 정원 초과를 막는다', async () => {
    await login('member@demo.test');
    await expectCode(
      api.programs.apply('p-1', { phone: '01012345678', note: '', agreePrivacy: 'on' }),
      'CONFLICT',
      'DUPLICATE',
    );
    await expectCode(
      api.programs.apply('p-2', { phone: '01012345678', note: '', agreePrivacy: 'on' }),
      'CONFLICT',
      'CAPACITY_FULL',
    );
    const created = await api.programs.apply('p-3', { phone: '01012345678', note: '', agreePrivacy: 'on' });
    expect(created.status).toBe('submitted');
    expect(created.receiptNo).toMatch(/^DEV-/);
  });

  it('세션이 만료되면 me() 는 null', async () => {
    await login('member@demo.test');
    mockDev.expireSession();
    expect(await api.auth.me()).toBeNull();
  });

  it('일괄 승인: 이미 처리된 건은 실패 목록으로 돌려준다', async () => {
    await login('staff@demo.test');
    const first = await api.admin.applications.decide(['a-3', 'a-2'], 'approved', null);
    expect(first.succeeded).toEqual(['a-3']);
    expect(first.failed.map((f) => f.id)).toEqual(['a-2']);
    await expectCode(api.admin.applications.decide(['a-4'], 'rejected', ' '), 'VALIDATION');
  });

  it('직원은 회원 역할을 바꿀 수 없고, 관리자는 자기 자신을 바꿀 수 없다', async () => {
    await login('staff@demo.test');
    await expectCode(api.admin.members.update('u-5', { status: 'suspended' }), 'FORBIDDEN');
    await api.auth.logout();
    await login('admin@demo.test');
    await expectCode(api.admin.members.update('u-admin', { roles: ['member'] }), 'CONFLICT');
  });

  it('관리자는 개발자 역할을 부여하거나 개발자 계정을 바꿀 수 없고, 개발자는 할 수 있다', async () => {
    await login('admin@demo.test');
    await expectCode(api.admin.members.update('u-5', { roles: ['developer'] }), 'FORBIDDEN');
    await expectCode(api.admin.members.update('u-developer', { status: 'suspended' }), 'FORBIDDEN');
    await api.auth.logout();
    await login('developer@demo.test');
    const promoted = await api.admin.members.update('u-5', { roles: ['developer'] });
    expect(promoted.roles).toEqual(['developer']);
    await expect(api.admin.audit.list({})).resolves.toBeTruthy();
  });

  it('공간 예약: 겹치는 시간은 거부하고 다른 사람 문의는 보이지 않는다', async () => {
    await login('member@demo.test');
    const date = firstReservableDate(todayKst());
    await api.spaces.reserve('s-media', {
      date,
      startTime: '10:00',
      endTime: '12:00',
      headcount: 3,
      phone: '01012345678',
      purpose: '영상 편집 모임',
      agreePrivacy: 'on',
    });
    await expectCode(
      api.spaces.reserve('s-media', {
        date,
        startTime: '11:00',
        endTime: '13:00',
        headcount: 3,
        phone: '01012345678',
        purpose: '영상 편집 모임',
        agreePrivacy: 'on',
      }),
      'CONFLICT',
    );
    await expectCode(
      api.spaces.reserve('s-media', {
        date: addDays(todayKst(), 60),
        startTime: '10:00',
        endTime: '11:00',
        headcount: 1,
        phone: '01012345678',
        purpose: '먼 미래 예약',
        agreePrivacy: 'on',
      }),
      'VALIDATION',
    );
    await expectCode(api.me.inquiry('q-2'), 'NOT_FOUND');
  });

  it('직원이 신청·예약·가입·문의를 처리하면 본인에게만 알림이 생긴다', async () => {
    await login('staff@demo.test');
    await api.admin.applications.decide(['a-1'], 'rejected', '정원 조정');
    await api.admin.spaces.decideReservation('r-2', 'approved', null);
    await api.admin.clubs.decideApplication('ca-1', 'approved', null);
    await api.admin.inquiries.answer('q-2', '체육관은 최소 인원 제한이 없습니다.');
    await api.auth.logout();

    await login('member@demo.test');
    const mine = await api.me.notifications();
    const fresh = mine.filter((n) => n.readAt === null && n.kind !== 'inquiry');
    expect(fresh.map((n) => n.kind).sort()).toEqual(['application', 'club_application', 'reservation']);
    expect(fresh.find((n) => n.kind === 'application')).toMatchObject({
      link: '/my/applications/a-1',
      body: expect.stringContaining('사유: 정원 조정'),
    });
    // 다른 회원(q-2 작성자)의 답변 알림은 보이지 않는다
    expect(mine.some((n) => n.link === '/qna/q-2')).toBe(false);

    await api.me.markNotificationsRead([fresh[0]!.id]);
    expect((await api.me.notifications()).filter((n) => n.readAt === null)).toHaveLength(
      mine.filter((n) => n.readAt === null).length - 1,
    );
    await api.me.markNotificationsRead();
    expect((await api.me.notifications()).every((n) => n.readAt !== null)).toBe(true);
  });

  it('시드 동아리는 관리자 폼 검증을 통과하고 데모 대표·회원 동아리가 있다', () => {
    const db = createSeed();
    for (const c of db.clubs) {
      const r = parseValues(clubFormSchema, { ...c, recruiting: c.recruiting ? 'on' : undefined });
      expect(r.ok ? c.id : `${c.id} ${JSON.stringify(r.errors)}`).toBe(c.id);
    }
    const shared = db.clubs.find((c) =>
      ['u-leader:leader', 'u-member:member'].every((k) =>
        db.memberships.some((m) => m.clubId === c.id && `${m.userId}:${m.role}` === k),
      ),
    );
    expect(shared).toBeDefined();
    for (const m of [...db.memberships, ...db.clubApplications])
      expect(db.clubs.some((c) => c.id === m.clubId)).toBe(true);
  });

  it('동아리 수정 시 소개 확장 필드를 보내지 않으면 기존 값을 유지한다', async () => {
    await login('staff@demo.test');
    const base = {
      name: '사진 동아리',
      field: '미디어',
      summary: '요약',
      description: '소개',
      meetingInfo: '매주 토요일',
      recruiting: true,
      status: 'active' as const,
    };
    const created = await api.admin.clubs.create({
      ...base,
      target: '중학생',
      photos: [
        { url: 'https://example.com/a.jpg', caption: '활동', sourceUrl: 'https://example.com/p', date: null },
      ],
      sourceUrls: ['https://example.com/p'],
    });
    expect(created.activities).toEqual([]);
    const updated = await api.admin.clubs.update(created.id, { ...base, name: '사진 동아리 2' });
    expect(updated).toMatchObject({
      name: '사진 동아리 2',
      target: '중학생',
      sourceUrls: ['https://example.com/p'],
    });
    expect(updated.photos).toHaveLength(1);
  });
});

describe('mock 데이터 내보내기·가져오기 (개발자 도구)', () => {
  it('내보낸 JSON 을 다시 가져오면 같은 상태가 된다', async () => {
    await login('admin@demo.test');
    await api.admin.members.update('u-5', { status: 'suspended' });
    const dump = mockDev.exportDb();
    mockDev.reset();
    expect((await login('admin@demo.test')).user.id).toBe('u-admin');
    expect((await api.admin.members.get('u-5')).status).toBe('active');
    mockDev.importDb(dump);
    expect((await api.admin.members.get('u-5')).status).toBe('suspended');
  });

  it('형식이 다른 JSON 은 거부하고 기존 데이터를 유지한다', async () => {
    await login('admin@demo.test');
    expect(() => mockDev.importDb('{"version":1}')).toThrow();
    expect(() => mockDev.importDb('not json')).toThrow();
    await expect(api.admin.members.get('u-5')).resolves.toBeTruthy();
  });
});

describe('출석체크', () => {
  const club = { type: 'club' as const, id: 'cl-frame' };

  it('일반 회원은 출석부를 다룰 수 없다', async () => {
    await login('member@demo.test');
    await expectCode(api.attendance.sessions(club), 'FORBIDDEN');
  });

  it('출석부를 만들면 동아리원 / 승인된 신청자 명단이 채워진다', async () => {
    await login('staff@demo.test');
    const s = await api.attendance.create(club, { date: todayKst(), title: '정기 모임' });
    expect(s.records.map((r) => r.userId).sort()).toEqual(['u-5', 'u-leader', 'u-member']);
    expect(s.records.every((r) => r.status === null)).toBe(true);
    const p = await api.attendance.create(
      { type: 'program', id: 'p-6' },
      { date: todayKst(), title: '1회차' },
    );
    expect(p.records.map((r) => r.userId)).toEqual(['u-member']);
  });

  it('담당자 체크와 통계', async () => {
    await login('staff@demo.test');
    const s = await api.attendance.create(club, { date: todayKst(), title: '정기 모임' });
    const marked = await api.attendance.mark(s.id, [
      { userId: 'u-member', status: 'late' },
      { userId: 'u-5', status: 'excused', note: '학교 행사' },
    ]);
    expect(marked.records.find((r) => r.userId === 'u-member')).toMatchObject({
      status: 'late',
      method: 'manager',
    });
    await expectCode(api.attendance.mark(s.id, [{ userId: 'u-6', status: 'present' }]), 'VALIDATION');
    const stats = await api.attendance.stats(club);
    expect(stats.find((x) => x.userId === 'u-5')?.excused).toBeGreaterThanOrEqual(1);
  });

  it('출석 코드: 명단의 회원만, 틀리면 5회 후 제한, 닫히면 거부', async () => {
    await login('staff@demo.test');
    const s = await api.attendance.create(club, { date: todayKst(), title: '정기 모임' });
    const opened = await api.attendance.setCheckIn(s.id, true);
    expect(opened.checkInCode).toMatch(/^\d{4}$/);
    const code = opened.checkInCode!;
    await api.auth.logout();

    await login('member@demo.test');
    const mine = await api.me.checkIn({ code });
    expect(mine).toMatchObject({ sessionId: s.id, status: 'present' });
    expect((await api.me.attendance()).some((a) => a.sessionId === s.id && a.status === 'present')).toBe(
      true,
    );
    await api.auth.logout();

    await login('sample6@demo.test'); // cl-frame 동아리원이 아니다
    const wrong = code === '0000' ? '0001' : '0000';
    for (let i = 0; i < 4; i++) await expectCode(api.me.checkIn({ code: wrong }), 'VALIDATION');
    await expectCode(api.me.checkIn({ code }), 'VALIDATION');
    await expectCode(api.me.checkIn({ code }), 'RATE_LIMITED');
    await api.auth.logout();

    await login('staff@demo.test');
    const closed = await api.attendance.setCheckIn(s.id, false);
    expect(closed.checkInCode).toBeNull();
    await api.auth.logout();
    await login('leader@demo.test');
    await expectCode(api.me.checkIn({ code }), 'VALIDATION');
  });
});

describe('동아리 담당자', () => {
  it('직원이 이메일로 담당자를 지정하면 그 동아리만 관리한다', async () => {
    await login('staff@demo.test');
    const m = await api.admin.clubs.assignManager('cl-simile', 'sample5@demo.test');
    expect(m).toMatchObject({ userId: 'u-5', clubId: 'cl-simile' });
    await expectCode(api.admin.clubs.assignManager('cl-simile', 'sample5@demo.test'), 'CONFLICT');
    await expectCode(api.admin.clubs.assignManager('cl-simile', 'nobody@demo.test'), 'VALIDATION');
    expect((await api.admin.clubs.managers('cl-simile')).map((x) => x.userId)).toEqual(['u-5']);
    await api.auth.logout();

    const s = await login('sample5@demo.test');
    expect(s.user.managedClubIds).toEqual(['cl-simile']);
    expect((await api.manage.clubs()).map((c) => c.id)).toEqual(['cl-simile']);
    const roster = await api.manage.roster('cl-simile');
    expect(roster.find((r) => r.userId === 'u-6')).toMatchObject({ name: '한테스트', role: 'leader' });
    await expectCode(api.manage.roster('cl-frame'), 'FORBIDDEN');
    expect((await api.attendance.targets()).map((t) => t.id)).toEqual(['cl-simile']);
    await api.attendance.create({ type: 'club', id: 'cl-simile' }, { date: todayKst(), title: '모임' });
    await expectCode(api.attendance.sessions({ type: 'club', id: 'cl-frame' }), 'FORBIDDEN');
    await expectCode(api.attendance.sessions({ type: 'program', id: 'p-6' }), 'FORBIDDEN');
    await expectCode(api.admin.dashboard(7), 'FORBIDDEN');
  });

  it('담당자는 가입 승인·역할 변경·제외·소개·소식을 관리한다', async () => {
    await login('leader@demo.test'); // 시드: cl-frame 담당자
    const club = await api.manage.updateIntro('cl-frame', {
      summary: '영상으로 기록하는 미디어 동아리',
      description: '매주 모여 영상을 기획·촬영·편집합니다.',
      meetingInfo: '매주 토요일 오후 2시',
      recruiting: true,
    });
    expect(club).toMatchObject({ meetingInfo: '매주 토요일 오후 2시', recruiting: true });
    await api.auth.logout();

    await login('sample6@demo.test');
    const app = await api.clubs.apply('cl-frame', {
      motivation: '영상 편집을 배우고 싶어서 지원합니다.',
      agreePrivacy: 'on',
    });
    await api.auth.logout();

    await login('leader@demo.test');
    expect((await api.manage.applications('cl-frame')).some((a) => a.id === app.id)).toBe(true);
    await api.manage.decideApplication('cl-frame', app.id, 'approved', null);
    expect((await api.manage.roster('cl-frame')).some((r) => r.userId === 'u-6')).toBe(true);
    await api.manage.setMemberRole('cl-frame', 'u-6', 'leader');
    await api.manage.removeMember('cl-frame', 'u-5');
    expect((await api.manage.roster('cl-frame')).map((r) => r.userId)).not.toContain('u-5');

    const post = await api.manage.createPost('cl-frame', {
      kind: 'notice',
      title: '다음 모임 안내',
      body: '토요일 2시',
    });
    expect((await api.clubs.posts('cl-frame')).some((p) => p.id === post.id)).toBe(true);
    await api.manage.removePost('cl-frame', post.id);
    expect((await api.clubs.posts('cl-frame')).some((p) => p.id === post.id)).toBe(false);
  });

  it('일반 회원은 담당자 지정·동아리 운영을 할 수 없고, 해제되면 권한이 사라진다', async () => {
    await login('member@demo.test');
    await expectCode(api.admin.clubs.assignManager('cl-frame', 'sample5@demo.test'), 'FORBIDDEN');
    await expectCode(api.manage.roster('cl-frame'), 'FORBIDDEN');
    await api.auth.logout();

    await login('staff@demo.test');
    await api.admin.clubs.removeManager('cl-frame', 'u-leader');
    await api.auth.logout();
    const s = await login('leader@demo.test');
    expect(s.user.managedClubIds).toEqual([]);
    await expectCode(api.manage.roster('cl-frame'), 'FORBIDDEN');
  });
});
