'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { RequireAuth } from '@/features/auth/guards';
import { cn } from '@/lib/cn';

const TABS = [
  { href: '/my', label: '신청·동아리' },
  { href: '/my/attendance', label: '출석' },
  { href: '/my/profile', label: '내 정보' },
];

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <PageHeader title="마이페이지" />
        <nav aria-label="마이페이지 메뉴" className="mt-4 mb-6 border-b border-line">
          <ul className="flex">
            {TABS.map((t) => {
              const active =
                t.href === '/my'
                  ? pathname === '/my' || pathname.startsWith('/my/applications')
                  : pathname.startsWith(t.href);
              return (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-12 items-center border-b-2 px-4 text-[15px] font-semibold',
                      active ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <RequireAuth>{children}</RequireAuth>
      </div>
    </div>
  );
}
