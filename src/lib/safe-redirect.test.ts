import { memberRedirect, safeRedirect } from './safe-redirect';

describe('safeRedirect — 오픈 리다이렉트 방지', () => {
  it.each([
    ['/programs/p-1', '/programs/p-1'],
    ['/my?tab=1#x', '/my?tab=1#x'],
  ])('내부 경로 %s 는 허용한다', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected);
  });

  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/%0d%0a',
    '\u0000/my',
    '',
    null,
    undefined,
  ])('외부·비정상 경로 %s 는 fallback 으로 보낸다', (input) => {
    const out = safeRedirect(input, '/fallback');
    expect(out === '/fallback' || out === '/%0d%0a').toBe(true);
    expect(out.startsWith('//')).toBe(false);
  });

  it('회원 로그인 흐름에서는 관리자 경로로 보내지 않는다', () => {
    expect(memberRedirect('/admin')).toBe('/my');
    expect(memberRedirect('/admin/members')).toBe('/my');
    expect(memberRedirect('/administrator-guide')).toBe('/administrator-guide');
    expect(memberRedirect(null)).toBe('/my');
  });
});
