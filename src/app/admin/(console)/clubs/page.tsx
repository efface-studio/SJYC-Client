'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, RowLink, type Column } from '@/components/admin/data-list';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import type { Club } from '@/domain/types';

const COLUMNS: Column<Club>[] = [
  {
    key: 'name',
    header: '동아리명',
    primary: true,
    cell: (c) => <RowLink href={`/admin/clubs/${c.id}`}>{c.name}</RowLink>,
  },
  { key: 'field', header: '활동 분야', cell: (c) => c.field },
  {
    key: 'members',
    header: '회원 수',
    cell: (c) => `${c.memberCount}명`,
    className: 'tabular-nums whitespace-nowrap',
  },
  {
    key: 'recruiting',
    header: '모집',
    cell: (c) => (c.recruiting ? '모집 중' : '모집 안 함'),
    className: 'whitespace-nowrap',
  },
  {
    key: 'status',
    header: '운영',
    status: true,
    cell: (c) =>
      c.status === 'active' ? <Badge tone="success">운영 중</Badge> : <Badge tone="neutral">운영 중지</Badge>,
  },
];

function ClubList() {
  const clubs = useQuery({ queryKey: ['admin', 'clubs'], queryFn: () => api.admin.clubs.list() });
  return (
    <QueryState
      query={clubs}
      isEmpty={(d) => d.length === 0}
      empty={
        <EmptyState title="등록된 동아리가 없습니다" description="오른쪽 위 '동아리 등록'으로 추가하세요." />
      }
    >
      {(d) => (
        <>
          <p className="mb-3 text-sm text-ink-600">
            총 <strong className="text-ink-900 tabular-nums">{d.length}</strong>개
          </p>
          <DataList caption="동아리 목록" rows={d} columns={COLUMNS} rowLabel={(c) => c.name} />
        </>
      )}
    </QueryState>
  );
}

export default function AdminClubsPage() {
  return (
    <AdminPage
      title="동아리 관리"
      permission="club.manage"
      actions={
        <>
          <Link href="/admin/clubs/applications" className={buttonClass({ variant: 'secondary' })}>
            가입 신청 검토
          </Link>
          <Link href="/admin/clubs/new" className={buttonClass()}>
            동아리 등록
          </Link>
        </>
      }
    >
      <ClubList />
    </AdminPage>
  );
}
