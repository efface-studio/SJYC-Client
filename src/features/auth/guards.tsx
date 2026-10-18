'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { buttonClass } from '@/components/ui/button';
import { ErrorState, ForbiddenState, ListSkeleton } from '@/components/ui/states';
import { can, canEnterConsole, type Permission } from '@/domain/permissions';
import type { Session, User } from '@/domain/types';
import { useSession } from './session';

function useLoginRedirect(session: Session | null | undefined, loginPath: string) {
  const router = useRouter();
  const pathname = usePathname();
  const hadSession = useRef(false);

  useEffect(() => {
    if (session) hadSession.current = true;
    if (session === null) {
      const params = new URLSearchParams({ next: pathname });
      // 로그인 상태였다가 세션이 사라졌다면 만료 안내를 함께 보낸다
      if (hadSession.current) params.set('error', 'session_expired');
      router.replace(`${loginPath}?${params.toString()}`);
    }
  }, [session, pathname, router, loginPath]);
}

/** 회원 전용 화면. 실제 데이터 보호는 서버의 인증 검사가 담당한다. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending, isError, error, refetch } = useSession();
  useLoginRedirect(isPending || isError ? undefined : session, '/login');

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending || !session) return <ListSkeleton rows={3} label="로그인 상태 확인 중" />;
  return <>{children}</>;
}

/**
 * 관리자 화면. 로그인만으로는 들어올 수 없고 서버가 내려준 역할에 admin.access 가 있거나
 * 동아리 담당자로 지정되어 있어야 한다(담당자는 동아리 운영·출석 메뉴만 보인다).
 * 메뉴 숨김은 보안 경계가 아니며, 모든 관리자 API 는 서버에서 권한을 다시 검증한다.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { data: session, isPending, isError, error, refetch } = useSession();
  useLoginRedirect(isPending || isError ? undefined : session, '/admin/login');

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending || !session) return <ListSkeleton rows={3} label="권한 확인 중" />;
  if (!canEnterConsole(session.user)) {
    return (
      <ForbiddenState
        description="관리자 권한이 있는 계정만 이용할 수 있습니다. 권한이 필요하면 최고 관리자에게 요청해 주세요."
        action={
          <Link href="/" className={buttonClass({ variant: 'secondary' })}>
            사용자 홈으로 이동
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}

export type Access = Permission | ((user: User | null | undefined) => boolean);

export const allows = (user: User | null | undefined, access: Access) =>
  typeof access === 'function' ? access(user) : can(user, access);

/** 관리자 내부에서 세부 권한별로 화면을 막는다 */
export function RequirePermission({ permission, children }: { permission: Access; children: ReactNode }) {
  const { data: session } = useSession();
  if (!allows(session?.user, permission)) {
    return <ForbiddenState description="이 메뉴는 해당 권한이 있는 관리자만 이용할 수 있습니다." />;
  }
  return <>{children}</>;
}
