import { expect, test, type Page } from '@playwright/test';

/**
 * 마스터 프롬프트 §13 주요 테스트 시나리오 — mock 모드 빌드 기준.
 * 데모 계정 비밀번호는 mock 시드(src/api/mock/seed.ts) 의 개발용 값이며 화면의 데모 버튼으로 채운다.
 */

async function loginAs(page: Page, label: '일반 회원' | '센터 직원', next = '/my') {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByRole('button', { name: label }).click();
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'));
}

test('비로그인 사용자가 공개 페이지를 탐색할 수 있다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /모집 중인 프로그램/ })).toBeVisible();
  await page.getByRole('navigation', { name: '하단 메뉴' }).getByRole('link', { name: '프로그램' }).click();
  await expect(page.getByRole('heading', { level: 1, name: '프로그램' })).toBeVisible();
  await page.getByRole('link', { name: /주말 농구 교실/ }).click();
  await expect(page.getByRole('link', { name: '로그인하고 신청하기' })).toBeVisible();
  // 기존 사이트로 나가는 링크가 없어야 한다
  await expect(page.locator('a[href*="j-youth"]')).toHaveCount(0);
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

test('OAuth 설정이 없으면 성공을 가장하지 않는다', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('설정 필요')).toHaveCount(4);
  // aria-disabled 버튼은 Playwright 가 활성화를 기다리므로 force — 실제 사용자는 눌러서 안내를 받는다
  await page.getByRole('button', { name: /네이버 로그인/ }).click({ force: true });
  await expect(page.getByRole('status').filter({ hasText: '설정이 필요합니다' })).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
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

test('직원은 관리자 로그인 후 대시보드에 들어간다 @desktop', async ({ page }) => {
  await page.goto('/admin/login');
  await page
    .getByRole('button', { name: /센터 직원|staff/ })
    .first()
    .click();
  await page.getByRole('button', { name: '관리자 로그인' }).click();
  await expect(page).toHaveURL(/\/admin$/);
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
  await expect(page.getByRole('heading', { level: 1, name: '센터 소식 · 갤러리' })).toBeVisible();
  await expect(page.getByRole('link', { name: /출처/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /유튜브에서 보기/ }).first()).toBeVisible();
});
