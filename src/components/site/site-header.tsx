'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, Menu, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { api } from '@/api';
import { buttonClass } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { CENTER } from '@/config/center';
import { useLogout, useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';

export const SITE_NAV = [
  { href: '/programs', label: '프로그램' },
  { href: '/spaces', label: '공간 예약' },
  { href: '/clubs', label: '동아리' },
  { href: '/kdream', label: '꿈드림' },
  { href: '/notices', label: '공지사항' },
  { href: '/about', label: '센터 안내' },
] as const;

const MORE = [
  { href: '/gallery', label: '센터 소식·갤러리' },
  { href: '/programs/calendar', label: '프로그램 일정 달력' },
  { href: '/qna', label: '자주 묻는 질문·1:1 문의' },
  { href: '/policies/terms', label: '이용약관' },
  { href: '/policies/privacy', label: '개인정보처리방침' },
] as const;

export function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cn('inline-flex shrink-0 items-center', className)}>
      <Image
        src={onDark ? '/brand/logo-on-dark.png' : '/brand/logo-horizontal.jpg'}
        alt={`${CENTER.formalName} 홈`}
        width={300}
        height={50}
        priority
        className="h-7 w-auto md:h-9"
      />
    </Link>
  );
}

export const NOTIFICATIONS_KEY = ['my-notifications'] as const;

/** 읽지 않은 알림 수 — 서버 목록의 readAt 이 비어 있는 항목 수 */
function NotificationBell() {
  const notifications = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => api.me.notifications(),
    refetchInterval: 60_000,
  });
  const unread = notifications.data?.filter((n) => n.readAt === null).length ?? 0;
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `알림, 읽지 않은 알림 ${unread}개` : '알림'}
      className="relative flex size-11 items-center justify-center rounded-md text-ink-900 hover:bg-surface-muted"
    >
      <Bell aria-hidden className="size-6" />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute top-1 right-0.5 h-5 min-w-5 rounded-full bg-brand-700 px-1 text-center text-[11px] leading-5 font-bold text-white tabular-nums"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}

function watchScroll(update: () => void) {
  window.addEventListener('scroll', update, { passive: true });
  return () => window.removeEventListener('scroll', update);
}
const pastTop = () => window.scrollY > 24;

export function SiteHeader() {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(watchScroll, pastTop, () => false);
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        toast.success('로그아웃되었습니다.');
        router.push('/');
      },
      onError: () => toast.error('로그아웃 중 문제가 발생했습니다. 다시 시도해 주세요.'),
    });

  return (
    <header
      className={cn(
        'site-header sticky top-0 z-30',
        pathname === '/' && 'over-film',
        scrolled && 'is-scrolled',
      )}
    >
      <div className="container-page flex h-14 items-center justify-between gap-4 md:h-[72px]">
        <Logo onDark={pathname === '/' && !scrolled} />

        <nav aria-label="주 메뉴" className="full-navigation hidden lg:block">
          <ul className="flex items-center gap-1">
            {SITE_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center border-b-2 border-transparent px-3 text-base font-semibold text-ink-700 hover:text-ink-900',
                    'aria-[current=page]:border-ink-900 aria-[current=page]:text-ink-900',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          {session && <NotificationBell />}
          <div className="full-navigation hidden items-center gap-2 lg:flex">
            {session ? (
              <>
                <Link href="/my" className={buttonClass({ variant: 'secondary', size: 'sm' })}>
                  <UserRound aria-hidden className="size-4" />
                  {session.user.name}님
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className={buttonClass({ variant: 'tertiary', size: 'sm' })}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonClass({ variant: 'tertiary', size: 'sm' })}>
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex min-h-11 items-center rounded-md bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-700"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          <Link
            href={session ? '/my' : '/login'}
            aria-label={session ? '마이페이지' : '로그인'}
            className="compact-navigation grid size-11 place-items-center rounded-full lg:hidden"
          >
            <UserRound aria-hidden className="size-6" />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="전체 메뉴 열기"
            aria-expanded={menuOpen}
            className="compact-navigation flex size-11 items-center justify-center rounded-full lg:hidden"
          >
            <Menu aria-hidden className="size-6" />
          </button>
        </div>
      </div>

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="전체 메뉴"
        variant="drawer"
        className="site-menu-sheet"
        bodyClassName="site-menu-body"
      >
        <nav aria-label="전체 메뉴">
          <ul className="site-menu-main">
            {[
              { href: '/', label: '홈' },
              ...SITE_NAV,
              { href: '/my', label: '마이페이지' },
              ...(session
                ? [{ href: '/notifications', label: '알림' }]
                : [{ href: '/signup', label: '회원가입' }]),
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className="site-menu-link"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="site-menu-more">
            {MORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className="site-menu-link"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {session && (
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className={cn(buttonClass({ variant: 'secondary', block: true }), 'mt-6')}
            >
              로그아웃
            </button>
          )}
        </nav>
      </Modal>
    </header>
  );
}
