'use client';

import {
  BookOpen,
  Braces,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Terminal,
  CircleHelp,
  ClipboardList,
  FileClock,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Globe,
  Settings2,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Logo } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import { canManageAttendance, managesAnyClub, primaryRole, ROLE_LABEL } from '@/domain/permissions';
import type { User } from '@/domain/types';
import { allows, type Access } from '@/features/auth/guards';
import { useLogout, useSession } from '@/features/auth/session';
import { NavPreference, useNavPreference } from './nav-preference';
import { ConsoleSearch } from './console-search';
import './admin-console.css';
import './workspace.css';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Access;
}
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: '업무 처리',
    items: [
      { href: '/admin', label: '대시보드', icon: LayoutDashboard, permission: 'admin.access' },
      {
        href: '/admin/applications',
        label: '프로그램 신청',
        icon: ClipboardList,
        permission: 'application.decide',
      },
      { href: '/admin/spaces', label: '공간 예약', icon: CalendarCheck, permission: 'space.manage' },
      { href: '/admin/attendance', label: '출석', icon: CheckSquare, permission: canManageAttendance },
      { href: '/admin/inquiries', label: '문의', icon: MessagesSquare, permission: 'inquiry.answer' },
    ],
  },
  {
    group: '콘텐츠 관리',
    items: [
      { href: '/admin/notices', label: '공지', icon: Megaphone, permission: 'notice.write' },
      { href: '/admin/programs', label: '프로그램', icon: CalendarDays, permission: 'program.write' },
      { href: '/admin/faqs', label: 'FAQ', icon: CircleHelp, permission: 'inquiry.answer' },
    ],
  },
  {
    group: '동아리·회원',
    items: [
      { href: '/admin/clubs', label: '동아리', icon: UsersRound, permission: 'club.manage' },
      { href: '/admin/clubs/applications', label: '가입 신청', icon: ListChecks, permission: 'club.manage' },
      { href: '/admin/my-clubs', label: '동아리 운영', icon: BookOpen, permission: managesAnyClub },
      { href: '/admin/members', label: '회원', icon: Users, permission: 'member.read' },
    ],
  },
  {
    group: '설정',
    items: [
      { href: '/admin/app-updates', label: '앱 업데이트', icon: Settings2, permission: 'site.manage' },
      { href: '/admin/settings', label: '사이트 설정', icon: Settings2, permission: 'site.manage' },
      { href: '/admin/policies', label: '정책 문서', icon: FileText, permission: 'policy.manage' },
    ],
  },
  {
    group: '기술·기록',
    items: [
      { href: '/admin/audit', label: '감사 로그', icon: FileClock, permission: 'audit.read' },
      {
        href: '/admin/specifications/features',
        label: '기능 명세서',
        icon: BookOpen,
        permission: 'admin.access',
      },
      { href: '/admin/specifications/api', label: 'API 명세서', icon: Braces, permission: 'admin.access' },
      { href: '/admin/developer', label: '개발자 도구', icon: Terminal, permission: 'developer.view' },
    ],
  },
];
const ALL_ITEMS = NAV.flatMap((g) => g.items);

function NavLinks({ user, active, onNavigate }: { user: User; active?: NavItem; onNavigate?: () => void }) {
  const uid = useId();
  const menuRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    // 창 높이가 줄어도 키보드로 선택한 메뉴가 계정 영역에 가려지지 않게 한다.
    const observer = new ResizeObserver(() => {
      const activeLink = document.activeElement;
      if (!(activeLink instanceof HTMLAnchorElement) || !menu.contains(activeLink)) return;
      const link = activeLink.getBoundingClientRect();
      const port = menu.getBoundingClientRect();
      if (link.bottom > port.bottom) menu.scrollTop += link.bottom - port.bottom;
      else if (link.top < port.top) menu.scrollTop += link.top - port.top;
    });
    observer.observe(menu);
    return () => observer.disconnect();
  }, []);
  return (
    <nav ref={menuRef} aria-label="관리자 메뉴" className="console-nav">
      {NAV.map((group, index) => {
        const items = group.items.filter((i) => allows(user, i.permission));
        if (!items.length) return null;
        return (
          <details key={group.group} open={index === 0 || items.some((item) => item.href === active?.href)}>
            <summary id={uid + index}>
              {group.group}
              <ChevronDown size={14} aria-hidden />
            </summary>
            <ul aria-labelledby={uid + index}>
              {items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={href === active?.href ? 'page' : undefined}
                    onClick={onNavigate}
                  >
                    <Icon aria-hidden size={18} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </nav>
  );
}

function UserBlock({ user }: { user: User }) {
  const router = useRouter();
  const toast = useToast();
  const logout = useLogout();
  return (
    <div className="console-account">
      <span className="account-icon">
        <UserRound size={19} aria-hidden />
      </span>
      <div className="min-w-0 grow">
        <strong className="block truncate">{user.name}</strong>
        <span className="text-xs text-ink-600">{ROLE_LABEL[primaryRole(user)]}</span>
      </div>
      <button
        type="button"
        aria-label="로그아웃"
        title="로그아웃"
        disabled={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSuccess: () => router.replace('/admin/login'),
            onError: () => toast.error('로그아웃 중 문제가 발생했습니다. 다시 시도해 주세요.'),
          })
        }
      >
        <LogOut size={18} aria-hidden />
      </button>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = ALL_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  const user = session?.user;
  const preference = useNavPreference(user?.id);
  if (!user) return null;
  const groups = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => allows(user, item.permission)),
  })).filter((group) => group.items.length);
  const current = groups.find((group) => group.items.some((item) => item.href === active?.href));
  return (
    <div className="admin-console workspace" data-nav={preference.layout}>
      <div className="workspace-frame console-frame">
        <header className="workspace-header">
          <div className="workspace-header-inner">
            <div className="workspace-brand">
              <Logo className="[&_img]:h-6 md:[&_img]:h-6" />
              <span>관리자</span>
            </div>
            <nav className="workspace-groups" aria-label="업무 영역">
              {groups.map((g) => (
                <Link
                  key={g.group}
                  href={g.items[0]!.href}
                  aria-current={current === g ? 'location' : undefined}
                >
                  {g.group}
                </Link>
              ))}
            </nav>
            <div className="workspace-tools">
              <NavPreference {...preference} />
              <ConsoleSearch user={user} menus={groups.flatMap((g) => g.items)} />
              <Link href="/" aria-label="사용자 화면" title="사용자 화면" className="workspace-site">
                <Globe size={18} aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="관리자 메뉴 열기"
                aria-expanded={menuOpen}
                className="workspace-menu"
              >
                <Menu size={20} aria-hidden />
              </button>
            </div>
          </div>
        </header>
        {preference.layout === 'side' && (
          <aside className="workspace-sidebar">
            <NavLinks user={user} active={active} />
            <UserBlock user={user} />
          </aside>
        )}
        {current && preference.layout === 'top' && (
          <nav className="workspace-local-nav" aria-label={current.group + ' 메뉴'}>
            <div>
              {current.items.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} aria-current={href === active?.href ? 'page' : undefined}>
                  <Icon size={16} aria-hidden />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
        <main id="main" tabIndex={-1} className="console-main workspace-main focus:outline-none">
          {children}
        </main>
        <SiteFooter compact />
      </div>
      <Modal
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="관리자 메뉴"
        variant="drawer"
        className="console-drawer"
        bodyClassName="console-drawer-body overflow-hidden p-0"
      >
        <div className="drawer-preference">
          <span>메뉴 배치</span>
          <NavPreference {...preference} />
        </div>
        <NavLinks user={user} active={active} onNavigate={() => setMenuOpen(false)} />
        <UserBlock user={user} />
      </Modal>
    </div>
  );
}
