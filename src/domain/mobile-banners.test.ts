import { describe, expect, it } from 'vitest';
import { defaultBanners, moveBanner, newBanner, readBanners, visibleBanners } from './mobile-banners';
import { settingsSchema } from './site-settings';

describe('앱 홈 배너', () => {
  const first = { ...newBanner(), id: 'a', title: '음악회', startsOn: '2026-11-24', endsOn: '2026-11-24' };
  const second = { ...first, id: 'b', enabled: false };
  const config = { ...defaultBanners, items: [first, second] };
  it('기존 설정과 게시 기간 양 끝, 숨김 및 순서 변경을 처리한다', () => {
    expect(settingsSchema.safeParse({}).success).toBe(true);
    expect(readBanners(JSON.stringify(config))).toEqual(config);
    expect(visibleBanners(config.items, '2026-11-24')).toEqual([first]);
    expect(visibleBanners(config.items, '2026-11-25')).toEqual([]);
    expect(moveBanner(config.items, 1, -1)).toEqual([second, first]);
  });
  it.each([
    { path: '/admin' },
    { image: 'wrong' },
    { image: 'https://user@example.org/a.jpg' },
    { endsOn: '2026-11-01' },
  ])('허용되지 않은 배너는 설정 저장 전에 걸러낸다', (change) => {
    const raw = JSON.stringify({ ...config, items: [{ ...first, ...change }] });
    expect(settingsSchema.safeParse({ mobileBanners: raw }).success).toBe(false);
  });
});
