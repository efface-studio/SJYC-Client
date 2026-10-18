import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import type { Session } from '@/domain/types';
import { RequireAdmin } from './guards';
import { SESSION_KEY } from './session';
import { SocialLoginButtons } from './social-login';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/admin',
}));

function withSession(session: Session | null, ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  qc.setQueryData(SESSION_KEY, session);
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const memberSession: Session = {
  expiresAt: '2099-01-01T00:00:00Z',
  user: {
    id: 'u-1',
    email: 'm@demo.test',
    name: '회원',
    phone: null,
    birthYear: 2009,
    roles: ['member'],
    status: 'active',
    emailVerified: true,
    providers: [],
    consents: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
};

describe('소셜 로그인 — 설정 전에는 성공을 흉내 내지 않는다', () => {
  it('모든 공급자를 "설정 필요"로 표시하고, 눌러도 이동하지 않고 안내만 한다', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });
    render(<SocialLoginButtons next="/my" />);

    expect(screen.getAllByText('설정 필요')).toHaveLength(4);
    await userEvent.click(screen.getByRole('button', { name: /카카오 로그인/ }));
    expect(screen.getByRole('status')).toHaveTextContent('설정이 필요합니다');
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('관리자 가드', () => {
  it('일반 회원 세션이면 관리자 화면 대신 권한 없음 안내를 보여준다', () => {
    withSession(memberSession, <RequireAdmin>관리자 콘텐츠</RequireAdmin>);
    expect(screen.queryByText('관리자 콘텐츠')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('접근 권한이 없습니다');
  });

  it('관리자 역할이면 내용을 보여준다', () => {
    withSession(
      { ...memberSession, user: { ...memberSession.user, roles: ['admin'] } },
      <RequireAdmin>관리자 콘텐츠</RequireAdmin>,
    );
    expect(screen.getByText('관리자 콘텐츠')).toBeInTheDocument();
  });
});
