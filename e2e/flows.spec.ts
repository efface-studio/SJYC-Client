import { expect, test, type Page } from '@playwright/test';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../src/api/mock/seed';

/**
 * 마스터 프롬프트 §13 주요 테스트 시나리오 — mock 모드 빌드 기준.
 * 데모 계정 비밀번호는 mock 시드(src/api/mock/seed.ts) 의 개발용 값이며 로그인 폼으로 입력한다.
 */

async function loginAs(page: Page, label: '일반 회원' | '센터 직원', next = '/my') {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  const account = DEMO_ACCOUNTS.find((candidate) => candidate.label === label);
  if (!account) throw new Error('테스트 회원이 없습니다.');
  await page.getByLabel('이메일').fill(account.email);
  await page.locator('input[name="password"]').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

test('비로그인 사용자가 공개 페이지를 탐색할 수 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /모집 중인 프로그램/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toHaveCount(0);
  await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
  await page
    .getByRole('navigation', { name: '전체 메뉴' })
    .getByRole('link', { name: '프로그램', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: '프로그램' })).toBeVisible();
  await page.getByRole('link', { name: /주말 농구 교실/ }).click();
  await expect(page.getByRole('link', { name: '로그인하고 신청하기' })).toBeVisible();
  // 기존 사이트로 나가는 링크가 없어야 한다
  await expect(page.locator('a[href*="j-youth"]')).toHaveCount(0);
});

test('배경 영상 요청이 실패해도 로고와 프로그램 바로가기가 남는다', async ({ page }) => {
  await page.route('**/media/center-film.mp4', (route) => route.abort());
  await page.goto('/');
  await expect(page.locator('.center-film video')).toBeHidden();
  await expect(page.locator('.center-film h1 img')).toBeVisible();
  await expect(page.getByText(/공휴일·임시 휴관은/)).toBeVisible();
  await page.getByRole('link', { name: '프로그램 찾기' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '프로그램', exact: true })).toBeVisible();
});

test('동작 줄이기 설정에서는 포스터부터 표시하고 사용자가 영상을 재생하고 멈출 수 있다', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const film = page.locator('.center-film video');
  await expect(film).not.toHaveAttribute('src');
  await expect(page.locator('.film-scroll-cue svg')).toHaveCSS('animation-name', 'none');
  const playback = page.locator('.film-playback');
  await playback.focus();
  await playback.press('Enter');
  await expect
    .poll(() => film.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0.12);
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.playbackRate)).toBe(1.2);
  await expect(playback).toHaveText('배경 영상 일시정지');
  await playback.press('Enter');
  await expect.poll(() => film.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
});

test('홈 상단은 스크롤 위치에 따라 아이콘 메뉴와 전체 메뉴를 전환한다 @desktop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const header = page.locator('header.site-header');
  const nav = header.getByRole('navigation', { name: '주 메뉴', includeHidden: true });
  await expect(nav).toBeHidden();
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await header.getByRole('button', { name: '전체 메뉴 열기' }).click();
  await expect(page.getByRole('dialog', { name: '전체 메뉴' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(nav).toBeVisible();
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(nav.getByRole('link').first()).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(header.getByRole('link', { name: '회원가입' })).toHaveCSS('color', 'rgb(255, 255, 255)');
  const boundary = await page
    .locator('.center-film')
    .evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y), boundary);
  await expect(header).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.evaluate(() => window.scrollTo(0, 300));
  await expect(header).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(nav).toBeHidden();
  await expect(header.getByRole('button', { name: '전체 메뉴 열기' })).toBeVisible();
});

test('잘못된 로그인 입력은 오류를 표시한다', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByText('이메일을 입력해 주세요.')).toBeVisible();
  await page.locator('input[name="email"]').fill('member@demo.test');
  await page.locator('input[name="password"]').fill('wrong-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: '이메일 또는 비밀번호가 올바르지 않습니다' }),
  ).toBeVisible();
});

test('지원 전인 Google과 미설정 공급자는 로그인을 시작할 수 없다', async ({ page }) => {
  await page.goto('/login');
  for (const provider of ['카카오', '네이버']) {
    const button = page.getByRole('button', { name: new RegExp(provider + '.*설정 필요') });
    await expect(button).toBeDisabled();
  }
  await expect(page.getByRole('button', { name: /Apple.*준비 중/ })).toBeDisabled();
  const google = page.getByRole('button', { name: /Google.*준비 중/ });
  await expect(google).toBeDisabled();
  await google.click({ force: true });
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('status').filter({ hasText: '이메일 로그인' })).toBeVisible();
});

test('일반 회원은 관리자 화면에 접근할 수 없다', async ({ page }) => {
  await loginAs(page, '일반 회원');
  await page.goto('/admin');
  await expect(page.getByText('접근 권한이 없습니다')).toBeVisible();
});

test('로그인 만료 시 보호된 화면은 재인증으로 안내한다', async ({ page }) => {
  await loginAs(page, '일반 회원');
  await page.evaluate(() => {
    const raw = sessionStorage.getItem('sjyc.mock.session.v1');
    if (raw)
      sessionStorage.setItem(
        'sjyc.mock.session.v1',
        JSON.stringify({ ...JSON.parse(raw), expiresAt: new Date(0).toISOString() }),
      );
  });
  await page.goto('/my/profile');
  await expect(page).toHaveURL(/\/login\?next=%2Fmy%2Fprofile/);
});

test('프로그램 신청 폼이 입력을 검증하고 접수 결과를 보여준다', async ({ page }) => {
  await loginAs(page, '일반 회원', '/programs/p-7/apply');
  await page.getByRole('button', { name: '신청하기' }).click();
  await expect(page.getByText('필수 항목에 동의해 주세요.')).toBeVisible();
  await page.getByLabel('연락처').fill('010-1234-5678');
  await page.getByLabel('위 내용을 확인했으며 동의합니다.').check();
  await page.getByRole('button', { name: '신청하기' }).click();
  await expect(page.getByText('신청이 접수되었습니다')).toBeVisible();
  await expect(page.getByText(/접수 번호 DEV-/).first()).toBeVisible();
});

test('API 오류 시나리오에서도 화면이 깨지지 않는다', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => sessionStorage.setItem('sjyc.mock.scenario.v1', 'error'));
  await page.goto('/programs');
  await expect(page.getByText('정보를 불러오지 못했습니다')).toBeVisible();
  await expect(page.getByRole('button', { name: '다시 시도' })).toBeVisible();
});

test('모바일 전체 메뉴가 열리고 Esc 로 닫힌다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
  const dialog = page.getByRole('dialog', { name: '전체 메뉴' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('직원은 대시보드에서 집계 기간을 바꾸고 처리 대기 신청을 조회한다 @desktop', async ({ page }) => {
  await page.goto('/admin/login');
  await page
    .getByRole('button', { name: /센터 직원|staff/ })
    .first()
    .click();
  await page.getByRole('button', { name: '관리자 로그인' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  const period = page.getByRole('button', { name: '최근 30일' });
  await period.click();
  await expect(period).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('최근 30일 프로그램 신청')).toBeVisible();
  const inbox = page.getByRole('region', { name: '처리 대기' });
  await inbox.getByRole('button', { name: /문의 답변/ }).click();
  await expect(inbox.getByRole('heading', { name: '문의 답변' })).toBeVisible();
  await inbox.getByRole('button', { name: /프로그램 신청/ }).click();
  await inbox.getByRole('link', { name: '전체 보기' }).click();
  await expect(page).toHaveURL(/\/admin\/applications\?status=submitted$/);
  await expect(page.getByRole('table', { name: '프로그램 신청 목록' })).toBeVisible();
});

test('알림 센터: 읽지 않은 알림을 확인하고 모두 읽음 처리한다', async ({ page }) => {
  await loginAs(page, '일반 회원', '/my');
  const bell = page.getByRole('link', { name: /^알림/ }).first();
  await expect(bell).toHaveAccessibleName(/읽지 않은 알림 1개/);
  await bell.click();
  await expect(page.getByRole('heading', { level: 1, name: '알림' })).toBeVisible();
  await expect(page.getByText('1:1 문의에 답변이 등록되었습니다')).toBeVisible();
  await page.getByRole('button', { name: '모두 읽음으로 표시' }).click();
  await expect(page.getByRole('link', { name: '알림', exact: true })).toBeVisible();
});

test('프로그램 달력과 갤러리가 표시된다', async ({ page }) => {
  await page.goto('/programs');
  await page.getByRole('navigation', { name: '보기 방식' }).getByRole('link', { name: '달력' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '프로그램 일정' })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  const today = page.locator('button[aria-current="date"]');
  await expect(today).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('link', { name: /다음 달/ }).click();
  await page.locator('tbody button').first().click();
  await expect(page.getByRole('heading', { level: 2, name: /1일 \(.\) 일정/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: /운영 중/ })).toBeVisible();

  await page.goto('/gallery');
  await expect(page.getByRole('heading', { level: 1, name: '센터 소식·갤러리' })).toBeVisible();
  await expect(page.getByRole('link', { name: /출처/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /유튜브에서 보기/ }).first()).toBeVisible();
});

test('자체 셀렉트로 프로그램 분류를 고른다', async ({ page }) => {
  await page.goto('/programs');
  await page.getByRole('button', { name: '분류' }).click();
  const list = page.getByRole('listbox', { name: '분류' });
  await expect(list).toBeVisible();
  await list.getByRole('option', { name: '문화예술활동' }).click();
  await expect(page).toHaveURL(/category=c-culture/);
  await expect(list).toBeHidden();
  await expect(page.getByRole('button', { name: '분류' })).toHaveText(/문화예술활동/);
});

test('자체 날짜 선택을 키보드로 조작한다 @desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 540 });
  await page.goto('/admin/login?next=%2Fadmin%2Fspaces');
  await page.getByRole('button', { name: '센터 직원' }).click();
  await page.getByRole('button', { name: '관리자 로그인' }).click();
  await page.waitForURL(/\/admin\/spaces/);
  await page.getByRole('button', { name: '필터', exact: true }).click();
  const trigger = page.getByRole('button', { name: '이용 날짜' });
  await trigger.click();
  const grid = page.getByRole('grid');
  await expect(grid).toBeVisible();
  const previous = page.getByRole('button', { name: '이전 달' });
  const today = page.getByRole('button', { name: '오늘', exact: true });
  await expect(previous).toBeInViewport({ ratio: 1 });
  await expect(today).toBeInViewport({ ratio: 1 });
  await page.getByRole('button', { name: '다음 달' }).click();
  await expect(previous).toBeInViewport({ ratio: 1 });
  await expect(today).toBeInViewport({ ratio: 1 });
  await grid.locator('button[tabindex="0"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/date=\d{4}-\d{2}-\d{2}/);
  await expect(page.getByRole('grid')).toBeHidden();
  await expect(trigger).toHaveText(/\d{4}\. \d{1,2}\. \d{1,2}\. \(.\)/);
});

test('정책 문서는 한 페이지에서 목차와 스크롤이 연동된다', async ({ page }) => {
  await page.goto('/policies/cookies');
  const toc = page.getByRole('navigation', { name: '정책 문서 목차' }).filter({ visible: true });
  await expect(toc.getByRole('link', { name: '쿠키 정책' })).toHaveAttribute('aria-current', 'location');
  await expect(page.getByRole('heading', { level: 2, name: '쿠키 정책' })).toBeInViewport();

  await toc.getByRole('link', { name: '서비스 이용약관' }).click();
  await expect(page).toHaveURL(/\/policies\/terms$/);
  await expect(page.getByRole('heading', { level: 2, name: '서비스 이용약관' })).toBeInViewport();
  await expect(toc.getByRole('link', { name: '서비스 이용약관' })).toHaveAttribute(
    'aria-current',
    'location',
  );
});

async function adminLoginAs(
  page: Page,
  label: '동아리 담당자' | '센터 직원' | '최고 관리자' | '개발자',
  next: string,
) {
  await page.goto(`/admin/login?next=${encodeURIComponent(next)}`);
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('button', { name: '관리자 로그인' }).click();
  await page.waitForURL((url) => url.pathname + url.search === next);
}

test('320px에서 회원 메뉴와 관리자 일정 입력란이 화면 안에 들어온다', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await loginAs(page, '일반 회원');
  const menu = page.getByRole('button', { name: '전체 메뉴 열기' });
  await expect(menu).toBeVisible();
  expect(await menu.evaluate((el) => el.getBoundingClientRect().right)).toBeLessThanOrEqual(320);

  await adminLoginAs(page, '최고 관리자', '/admin/programs/p-1');
  const schedule = page.getByRole('group', { name: '일정', exact: true });
  const dates = schedule.getByRole('button', { expanded: false });
  await expect(dates.first()).toBeVisible();
  for (const date of await dates.all()) {
    const box = await date.evaluate((el) => el.getBoundingClientRect().toJSON());
    expect(box.width).toBeGreaterThan(100);
    expect(box.right).toBeLessThanOrEqual(320);
  }
});

test('개발자 콘솔은 최고 관리자도 조회하고 브라우저 진단은 개발자만 쓴다', async ({ page }) => {
  await adminLoginAs(page, '센터 직원', '/admin/developer');
  await expect(page.getByText('접근 권한이 없습니다')).toBeVisible();

  await page.evaluate(() => sessionStorage.removeItem('sjyc.mock.session.v1'));
  await adminLoginAs(page, '최고 관리자', '/admin/developer?tab=env');
  await expect(page.getByRole('link', { name: '시스템', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: '이 브라우저 진단' })).toHaveCount(0);
  await page.evaluate(() => sessionStorage.removeItem('sjyc.mock.session.v1'));
  await adminLoginAs(page, '개발자', '/admin/developer');
  await expect(page.getByRole('heading', { level: 1, name: '개발자 도구' })).toBeVisible();
  const areas = page.getByRole('navigation', { name: '개발자 도구 영역' });
  for (const name of ['권한 관리', '로그', '세션·보안', '운영', '시스템']) {
    await expect(areas.getByRole('link', { name, exact: true })).toBeVisible();
  }
  await areas.getByRole('link', { name: '이 브라우저 진단' }).click();
  await page.getByRole('tab', { name: 'API 요청' }).click();
  await expect(page).toHaveURL(/tab=requests/);
  await expect(page.getByRole('cell', { name: 'auth.me' }).first()).toBeVisible();
  await page.getByRole('tab', { name: '세션·권한' }).click();
  await expect(page.getByRole('table', { name: '역할별 권한' })).toBeVisible();
});

test('출석: 직원이 출석부를 만들고 코드를 열면 회원이 코드로 출석한다', async ({ page }) => {
  await adminLoginAs(page, '센터 직원', '/admin/attendance');
  await page.getByRole('button', { name: '출석부 만들기' }).click();
  await page.waitForURL(/\/admin\/attendance\/at-/);
  await page.getByRole('button', { name: '출석 코드 열기' }).click();
  const code = (await page.getByLabel(/^출석 코드 \d/).textContent())!.trim();
  expect(code).toMatch(/^\d{4}$/);
  // 담당자 체크: 이데모 지각
  await page
    .getByRole('radiogroup', { name: '이데모 출석 상태' })
    .getByRole('radio', { name: '지각' })
    .click();
  await expect(
    page.getByRole('radiogroup', { name: '이데모 출석 상태' }).getByRole('radio', { name: '지각' }),
  ).toHaveAttribute('aria-checked', 'true');

  await page.evaluate(() => sessionStorage.removeItem('sjyc.mock.session.v1'));
  await loginAs(page, '일반 회원', '/my/attendance');
  await page.getByLabel('출석 코드 입력').fill(code);
  await page.getByRole('button', { name: '출석하기' }).click();
  await expect(page.getByText(/정기 모임 출석이 확인되었습니다/)).toBeVisible();
});

test('동아리 담당자는 담당 동아리만 운영하고 직원은 담당자를 지정한다', async ({ page }) => {
  await adminLoginAs(page, '동아리 담당자', '/admin/my-clubs');
  await expect(page.getByRole('link', { name: /미디어동아리 FRAME/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /시밀레/ })).toHaveCount(0);
  await page.getByRole('link', { name: /미디어동아리 FRAME/ }).click();
  await expect(page.getByRole('tab', { name: '회원', selected: true })).toBeVisible();
  await expect(page.getByText('member@demo.test')).toBeVisible();
  await page.getByRole('tab', { name: '출석' }).click();
  await page.getByRole('link', { name: /출석부 열기/ }).click();
  await expect(page.getByRole('button', { name: '출석 대상' })).toHaveText(/FRAME/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/my-clubs$/);

  await page.evaluate(() => sessionStorage.removeItem('sjyc.mock.session.v1'));
  await adminLoginAs(page, '센터 직원', '/admin/clubs/cl-simile');
  await page.getByLabel('담당자로 지정할 회원 이메일').fill('sample5@demo.test');
  await page.getByRole('button', { name: '담당자 지정' }).click();
  await expect(page.getByText('sample5@demo.test ·')).toBeVisible();
});

test('관리자 메뉴를 끝까지 스크롤해도 계정과 마지막 링크를 각각 누를 수 있다 @desktop', async ({ page }) => {
  await adminLoginAs(page, '개발자', '/admin');
  for (const [width, height] of [
    [1440, 900],
    [1024, 540],
    [390, 600],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: '관리자 메뉴 열기' }).click();
    const nav = page.getByRole('navigation', { name: '관리자 메뉴' });
    await nav.getByText('기술·기록', { exact: true }).click();
    const last = nav.getByRole('link', { name: '개발자 도구' });
    const account = page.getByRole('button', { name: '로그아웃' });
    await expect(account).toBeVisible();
    const initial = await account.boundingBox();
    await last.focus();
    await expect(last).toBeFocused();
    for (const target of [last, account]) {
      await expect
        .poll(() =>
          target.evaluate((el) => {
            const r = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          }),
        )
        .toBe(true);
    }
    expect(await account.boundingBox()).toEqual(initial);
    const port = await nav.boundingBox();
    const footerTop = await account.evaluate(
      (el) => el.closest('.console-account')!.getBoundingClientRect().top,
    );
    expect(port!.y + port!.height).toBeLessThanOrEqual(footerTop + 1);
    await page.keyboard.press('Escape');
  }
});

test('꿈드림 메뉴에서 지원 분야와 참여 방법을 찾을 수 있다', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '전체 메뉴 열기' }).click();
  await page.getByRole('dialog').getByRole('link', { name: '꿈드림', exact: true }).click();
  await expect(page).toHaveURL(/\/kdream$/);
  await expect(page.getByRole('heading', { name: '중구 꿈드림', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: /진로·자립 나에게 맞는/ }).click();
  await expect(page).toHaveURL(/#career$/);
  await page.getByRole('link', { name: '이용 방법 보기' }).click();
  await expect(page).toHaveURL(/#participate$/);
  await expect(page.getByRole('link', { name: /청소년1388 온라인 신청/ })).toHaveAttribute(
    'href',
    'https://www.1388.go.kr/ind/YTOSP_SC_IND_01',
  );
  await expect(page.getByRole('link', { name: '전화 문의', exact: true })).toHaveAttribute(
    'href',
    'tel:0222500543',
  );
});

test('관리자 통합검색에서 업무를 열고 담당자 권한을 적용한다', async ({ page }) => {
  await adminLoginAs(page, '최고 관리자', '/admin');
  const open = page.getByRole('button', { name: '관리자 통합검색 열기' });
  await open.click();
  const dialog = page.getByRole('dialog', { name: '관리자 통합검색' });
  const input = dialog.getByRole('combobox', { name: '관리자 검색어' });
  await expect(input).toBeFocused();
  await input.fill('농구');
  const program = dialog.getByRole('option', { name: /주말 농구 교실/ }).first();
  await program.click();
  await expect(page).toHaveURL(/\/admin\/programs\/[^/]+$/);
  await expect(dialog).toBeHidden();
  await page.evaluate(() => sessionStorage.removeItem('sjyc.mock.session.v1'));
  await adminLoginAs(page, '동아리 담당자', '/admin/my-clubs');
  await open.click();
  await expect(dialog.getByRole('option', { name: '동아리 운영' })).toBeVisible();
  await expect(dialog.getByRole('option', { name: '회원', exact: true })).toHaveCount(0);
  await input.fill('농구');
  await expect(dialog.getByText('검색 결과가 없습니다.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('동아리와 공간 목록은 느린 응답에 스켈레톤을 표시하고 결과로 전환한다', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('sjyc.mock.scenario.v1', 'slow'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [path, label, selector] of [
    ['/clubs', '동아리 불러오는 중', '.club-list-link'],
    ['/spaces', '공간 불러오는 중', '.space-row'],
  ] as const) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const pending = page.getByRole('status', { name: label });
    await expect(pending).toBeVisible();
    await expect(pending.locator('[aria-hidden]').last()).toHaveCSS('animation-name', 'none');
    await expect(pending).toHaveCount(0);
    await expect(page.locator('a' + selector).first()).toBeVisible();
  }
});

test('홈 영상은 화면 밖에서 멈추고 사용자가 멈춘 뒤에는 자동으로 재생되지 않는다', async ({ page }) => {
  await page.goto('/');
  const video = page.locator('.center-film video');
  const paused = () => video.evaluate((el: HTMLVideoElement) => el.paused);
  await expect.poll(paused).toBe(false);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await expect.poll(paused).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(paused).toBe(false);
  await page.locator('.film-playback').focus();
  await page.keyboard.press('Enter');
  await expect.poll(paused).toBe(true);
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.locator('.film-playback')).toHaveText('배경 영상 재생');
  await expect.poll(paused).toBe(true);
});

test('관리자 메뉴 배치는 계정별로 유지되고 빠른 검색은 키보드로 이동한다 @desktop', async ({ page }) => {
  await adminLoginAs(page, '개발자', '/admin');
  const preference = page.getByRole('group', { name: '메뉴 배치' });
  await preference.getByRole('button', { name: '사이드 메뉴' }).click();
  await page.reload();
  await expect(preference.getByRole('button', { name: '사이드 메뉴' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('navigation', { name: '관리자 메뉴' })).toBeVisible();
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog', { name: '관리자 통합검색' });
  const field = dialog.getByRole('combobox');
  await expect(field).toBeFocused();
  await expect(dialog.getByRole('option')).toHaveCount(5);
  await field.press('ArrowDown');
  await expect(dialog.getByRole('option', { selected: true })).toHaveText('프로그램 신청');
  await field.press('Enter');
  await expect(page).toHaveURL(/\/admin\/applications$/);
  await expect(dialog).toBeHidden();
  await page.evaluate(() => sessionStorage.removeItem('sjyc.mock.session.v1'));
  await adminLoginAs(page, '센터 직원', '/admin');
  await expect(preference.getByRole('button', { name: '상단 메뉴' })).toHaveAttribute('aria-pressed', 'true');
});

test('센터 안내에서 카페 라라의 사진, 운영시간과 메뉴판을 열 수 있다', async ({ page }) => {
  await page.goto('/about');
  await page.getByRole('link', { name: '카페 라라 이용 안내' }).click();
  await expect(page).toHaveURL(/\/about\/cafe-lala$/);
  await expect(page.getByRole('heading', { name: '카페 라라', exact: true })).toBeVisible();
  await expect(page.getByText('화요일–토요일 08:30–19:30')).toBeVisible();
  await expect(page.getByRole('link', { name: '02-2250-0570' })).toHaveAttribute('href', 'tel:0222500570');
  const menu = page.getByRole('link', { name: /메뉴판 크게 보기/ });
  await menu.scrollIntoViewIfNeeded();
  await expect(menu).toHaveAttribute('href', '/media/about/cafe-lala/menu.jpg');
  await menu.click();
  await expect(page.locator('img')).toHaveJSProperty('naturalWidth', 608);
});
