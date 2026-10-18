'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useId, useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { DemoBanner } from '@/components/dev-panel';
import { Logo } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { can, primaryRole, ROLE_LABEL, type Permission } from '@/domain/permissions';
import type { User } from '@/domain/types';
import { useLogout, useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';

interface NavItem {
  href: string;
  label: string;
  permission: Permission;
}

const NAV: { group: string; items: NavItem[] }[] = [
  { group: '운영', items: [{ href: '/admin', label: '대시보드', permission: 'admin.access' }] },
  {
    group: '콘텐츠',
    items: [
      { href: '/admin/notices', label: '공지', permission: 'notice.write' },
      { href: '/admin/programs', label: '프로그램', permission: 'program.write' },
    ],
  },
  {
    group: '신청·예약',
    items: [
      { href: '/admin/applications', label: '프로그램 신청', permission: 'application.decide' },
      { href: '/admin/spaces', label: '공간 예약', permission: 'space.manage' },
    ],
  },
  {
    group: '커뮤니티',
    items: [
      { href: '/admin/clubs', label: '동아리', permission: 'club.manage' },
      { href: '/admin/clubs/applications', label: '가입 신청', permission: 'club.manage' },
      { href: '/admin/inquiries', label: '문의', permission: 'inquiry.answer' },
      { href: '/admin/faqs', label: 'FAQ', permission: 'inquiry.answer' },
    ],
  },
  { group: '회원', items: [{ href: '/admin/members', label: '회원', permission: 'member.read' }] },
  {
    group: '설정',
    items: [
      { href: '/admin/policies', label: '정책 문서', permission: 'policy.manage' },
      { href: '/admin/audit', label: '감사 로그', permission: 'audit.read' },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

/** 가장 길게 일치하는 메뉴가 현재 메뉴 (/admin/clubs/applications 가 /admin/clubs 보다 우선) */
function activeItem(pathname: string): NavItem | undefined {
  return ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}

function roleLabel(user: User): string {
  return ROLE_LABEL[primaryRole(user)];
}

function NavLinks({ user, active, onNavigate }: { user: User; active?: NavItem; onNavigate?: () => void }) {
  const uid = useId();
  // 메뉴 숨김은 표시용일 뿐이며 서버가 모든 요청의 권한을 다시 검사한다
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(user, i.permission)) })).filter(
    (g) => g.items.length > 0,
  );
  return (
    <nav aria-label="관리자 메뉴" className="py-2">
      {groups.map((g, gi) => (
        <div key={g.group} className="mt-3 first:mt-0">
          <p id={`${uid}-${gi}`} className="px-4 pb-1 text-xs font-semibold text-ink-600">
            {g.group}
          </p>
          <ul aria-labelledby={`${uid}-${gi}`}>
            {g.items.map((i) => {
              const current = i.href === active?.href;
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center border-l-[3px] pr-4 pl-[13px] text-[15px]',
                      current
                        ? 'border-brand-500 bg-surface-admin font-semibold text-ink-900'
                        : 'border-transparent text-ink-700 hover:bg-surface-muted hover:text-ink-900',
                    )}
                  >
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserBlock({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const logout = useLogout();
  return (
    <div className="border-t border-line px-4 py-3 text-sm">
      <p className="font-semibold text-ink-900">{user.name}</p>
      <p className="text-ink-600">{roleLabel(user)}</p>
      <div className="mt-2 flex flex-wrap gap-x-3">
        <Link href="/" className="inline-flex min-h-11 items-center gap-1 text-ink-700 hover:underline">
          사용자 화면
        </Link>
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate(undefined, {
              onSuccess: () => router.replace('/admin/login'),
              onError: () => toast.error('로그아웃 중 문제가 발생했습니다. 다시 시도해 주세요.'),
            })
          }
          className="inline-flex min-h-11 items-center gap-1 text-ink-700 hover:underline disabled:opacity-50"
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

/** 관리자 콘솔 틀 — 데스크톱(lg 이상) 고정 사이드바, 그 미만은 상단 바 + 서랍 메뉴 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = activeItem(pathname);
  const user = session?.user;
  if (!user) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-surface-admin">
      <DemoBanner tone="admin" />
      <div className="flex flex-1">
        <aside className="sticky top-0 hidden max-h-dvh w-[232px] shrink-0 flex-col overflow-y-auto border-r border-line bg-surface lg:flex">
          <div className="flex h-14 items-center gap-2 border-b border-line px-4">
            <Logo className="[&_img]:h-5 md:[&_img]:h-5" />
            <span className="text-sm font-semibold text-ink-600">관리자</span>
          </div>
          <div className="flex-1">
            <NavLinks user={user} active={active} />
          </div>
          <UserBlock user={user} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
            <Logo className="[&_img]:h-5 md:[&_img]:h-5" />
            <p className="min-w-0 flex-1 truncate border-l border-line pl-3 text-[15px] font-semibold">
              {active?.label ?? '관리자'}
            </p>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="관리자 메뉴 열기"
              aria-expanded={menuOpen}
              className="-mr-2 flex size-11 items-center justify-center rounded-md text-ink-700 hover:bg-surface-muted"
            >
              <Menu aria-hidden className="size-6" />
            </button>
          </header>

          <main
            id="main"
            tabIndex={-1}
            className="w-full max-w-[1280px] flex-1 px-4 py-5 focus:outline-none md:px-6 lg:px-8 lg:py-7"
          >
            {children}
          </main>
          <SiteFooter compact />
        </div>
      </div>

      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="관리자 메뉴"
        variant="drawer"
        className="lg:hidden"
      >
        <div className="-mx-4 -my-4">
          <NavLinks user={user} active={active} onNavigate={() => setMenuOpen(false)} />
          <UserBlock user={user} />
        </div>
      </Modal>
    </div>
  );
}
