'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, LogIn, Menu, UserRound } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex shrink-0 items-center', className)}>
      {/* 공식 로고 원본(300×50 JPG, 흰 배경) — docs/brand-audit.md */}
      <Image
        src="/brand/logo-horizontal.jpg"
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

export function SiteHeader() {
  const pathname = usePathname();
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
    <header className="sticky top-0 z-30 border-t-[3px] border-b border-t-brand-500 border-b-line bg-surface">
      <div className="container-page flex h-14 items-center justify-between gap-4 md:h-[72px]">
        <Logo />

        <nav aria-label="주 메뉴" className="hidden md:block">
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
          <div className="hidden items-center gap-2 md:flex">
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
                <Link href="/signup" className={buttonClass({ variant: 'primary', size: 'sm' })}>
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* 모바일: 로그인 바로가기 + 전체 메뉴 (주요 이동은 하단 탭바) */}
          {!session && (
            <Link
              href="/login"
              className="flex h-11 items-center gap-1 rounded-md px-2 text-[15px] font-semibold text-ink-700 md:hidden"
            >
              <LogIn aria-hidden className="size-5" />
              로그인
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="전체 메뉴 열기"
            aria-expanded={menuOpen}
            className="flex size-11 items-center justify-center rounded-md text-ink-900 hover:bg-surface-muted md:hidden"
          >
            <Menu aria-hidden className="size-6" />
          </button>
        </div>
      </div>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="전체 메뉴" variant="drawer">
        <nav aria-label="전체 메뉴">
          <ul className="-mx-2">
            {[
              { href: '/', label: '홈' },
              ...SITE_NAV,
              { href: '/my', label: '마이페이지' },
              ...(session ? [{ href: '/notifications', label: '알림' }] : []),
            ].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(pathname, item.href) ? 'page' : undefined}
                  className="flex min-h-12 items-center rounded-md px-2 text-base font-semibold hover:bg-surface-muted aria-[current=page]:text-brand-700"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="-mx-2 mt-4 border-t border-line pt-4">
            {MORE.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-12 items-center rounded-md px-2 text-[15px] text-ink-700 hover:bg-surface-muted"
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
