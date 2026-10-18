'use client';

import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, type KeyboardEvent } from 'react';
import { AdminPage } from '@/components/admin/admin-page';
import { QueryState } from '@/components/admin/query-state';
import { EmptyState } from '@/components/ui/states';
import { managesAnyClub } from '@/domain/permissions';
import type { Club } from '@/domain/types';
import {
  ApplicationsTab,
  AttendanceTab,
  IntroTab,
  MembersTab,
  PostsTab,
  useManagedClubs,
} from '@/features/club-ops/club-ops';
import { cn } from '@/lib/cn';

const TABS = [
  { key: 'members', label: '회원', render: (c: Club) => <MembersTab clubId={c.id} /> },
  { key: 'applications', label: '가입 신청', render: (c: Club) => <ApplicationsTab clubId={c.id} /> },
  { key: 'attendance', label: '출석', render: (c: Club) => <AttendanceTab club={c} /> },
  { key: 'posts', label: '소식', render: (c: Club) => <PostsTab clubId={c.id} /> },
  { key: 'intro', label: '소개', render: (c: Club) => <IntroTab club={c} /> },
] as const;

function ClubOps({ club }: { club: Club }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const active = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0];
  const select = (key: string) => router.replace(`${pathname}?tab=${key}`, { scroll: false });
  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TABS[(i + step + TABS.length) % TABS.length]!;
    select(next.key);
    listRef.current?.querySelector<HTMLButtonElement>(`#club-tab-${next.key}`)?.focus();
  };

  return (
    <>
      <p className="-mt-3 mb-5 text-[15px] text-ink-600">
        <strong className="text-ink-900">{club.name}</strong> · {club.field} · 회원 {club.memberCount}명 ·{' '}
        {club.meetingInfo}
      </p>
      <div
        ref={listRef}
        role="tablist"
        aria-label={`${club.name} 운영`}
        className="-mx-4 mb-6 scrollbar-none flex overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0"
      >
        {TABS.map((t, i) => (
          <button
            key={t.key}
            id={`club-tab-${t.key}`}
            type="button"
            role="tab"
            aria-selected={t.key === active.key}
            aria-controls="club-panel"
            tabIndex={t.key === active.key ? 0 : -1}
            onClick={() => select(t.key)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'h-11 shrink-0 border-b-2 px-3 text-[15px] font-semibold whitespace-nowrap',
              t.key === active.key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="club-panel" role="tabpanel" aria-labelledby={`club-tab-${active.key}`}>
        {active.render(club)}
      </div>
    </>
  );
}

function ClubOpsLoader({ id }: { id: string }) {
  const clubs = useManagedClubs();
  return (
    <QueryState query={clubs}>
      {(list) => {
        const club = list.find((c) => c.id === id);
        return club ? (
          <>
            <title>{`${club.name} 운영 | 중구청소년센터 관리자`}</title>
            <ClubOps club={club} />
          </>
        ) : (
          <EmptyState title="운영 권한이 있는 동아리가 아닙니다" />
        );
      }}
    </QueryState>
  );
}

export default function ClubOpsPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPage
      title="동아리 운영"
      permission={managesAnyClub}
      breadcrumbs={[{ label: '동아리 운영', href: '/admin/my-clubs' }, { label: '상세' }]}
    >
      <ClubOpsLoader id={id} />
    </AdminPage>
  );
}
