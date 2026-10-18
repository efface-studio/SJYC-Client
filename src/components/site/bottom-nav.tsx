'use client';

import { CalendarDays, DoorOpen, Home, UserRound, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { isActive } from './site-header';

const TABS = [
  { href: '/', label: '홈', icon: Home },
  { href: '/programs', label: '프로그램', icon: CalendarDays },
  { href: '/spaces', label: '공간 예약', icon: DoorOpen },
  { href: '/clubs', label: '동아리', icon: UsersRound },
  { href: '/my', label: 'MY', icon: UserRound },
] as const;

/** 모바일 하단 탭바 — 사용자 웹의 주 이동 수단 (데스크톱에서는 상단 메뉴 사용) */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold',
                  active ? 'text-brand-700' : 'text-ink-600',
                )}
              >
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
