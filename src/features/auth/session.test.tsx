import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Session } from '@/domain/types';
import { SESSION_KEY, useLogout, useSession } from './session';

vi.mock('@/api', () => ({
  api: { auth: { me: vi.fn(async () => null), logout: vi.fn(async () => undefined) } },
}));

const session: Session = {
  expiresAt: '2099-01-01T00:00:00Z',
  user: {
    id: 'u-1',
    email: 'staff@demo.test',
    name: '직원',
    phone: null,
    birthYear: 1990,
    roles: ['staff'],
    status: 'active',
    emailVerified: true,
    providers: [],
    consents: [],
    managedClubIds: [],
    createdAt: '2026-01-01T00:00:00Z',
  },
};

/** 세션만 구독하는 화면(앱의 루트 게이트처럼 로그아웃 버튼과 다른 컴포넌트) */
function Gate() {
  const s = useSession();
  return <p>{s.data ? `로그인: ${s.data.user.name}` : '로그아웃됨'}</p>;
}

function LogoutButton() {
  const logout = useLogout();
  return <button onClick={() => logout.mutate()}>로그아웃</button>;
}

describe('useLogout', () => {
  it('세션을 구독 중인 화면이 바로 로그아웃 상태를 받고, 다른 사용자 데이터는 지운다', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    qc.setQueryData(SESSION_KEY, session);
    qc.setQueryData(['private'], 'data');
    render(
      <QueryClientProvider client={qc}>
        <Gate />
        <LogoutButton />
      </QueryClientProvider>,
    );
    expect(screen.getByText('로그인: 직원')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(await screen.findByText('로그아웃됨')).toBeInTheDocument();
    expect(qc.getQueryData(['private'])).toBeUndefined();
  });
});
