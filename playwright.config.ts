import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;

/**
 * 주요 사용자 흐름 E2E — mock 모드 프로덕션 빌드를 대상으로 한다.
 * 사용자 웹은 모바일 우선이므로 기본 프로젝트를 모바일 뷰포트로 둔다.
 * 실행 전 `pnpm build` 가 필요하다 (CI 는 build 단계 이후 실행).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grepInvert: /@desktop/ },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] }, grep: /@desktop/ },
  ],
  webServer: {
    command: `pnpm exec next start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
