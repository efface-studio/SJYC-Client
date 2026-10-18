'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, RowLink, type Column } from '@/components/admin/data-list';
import { FilterBar, FilterSelect, optionsOf, SORT_OPTIONS } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, oneOf, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { PUBLISH_STATUS, RECRUIT_STATUS } from '@/domain/labels';
import type { Program } from '@/domain/types';
import { useCategoryName } from '@/features/programs/program-card';
import { formatDate } from '@/lib/format';

function columns(categoryName: (id: string) => string): Column<Program>[] {
  return [
    {
      key: 'title',
      header: '프로그램명',
      sort: 'title',
      primary: true,
      cell: (p) => <RowLink href={`/admin/programs/${p.id}`}>{p.title}</RowLink>,
    },
    {
      key: 'category',
      header: '분류',
      cell: (p) => categoryName(p.categoryId) || '-',
      className: 'whitespace-nowrap',
    },
    {
      key: 'recruit',
      header: '모집',
      cell: (p) => (
        <Badge tone={RECRUIT_STATUS[p.recruitStatus].tone}>{RECRUIT_STATUS[p.recruitStatus].text}</Badge>
      ),
    },
    {
      key: 'count',
      header: '신청/정원',
      cell: (p) => `${p.appliedCount}/${p.capacity}`,
      className: 'tabular-nums whitespace-nowrap',
    },
    {
      key: 'period',
      header: '모집 기간',
      cell: (p) => `${formatDate(p.recruitStartsAt)} ~ ${formatDate(p.recruitEndsAt)}`,
      className: 'tabular-nums whitespace-nowrap',
    },
    {
      key: 'status',
      header: '게시',
      status: true,
      cell: (p) => <Badge tone={PUBLISH_STATUS[p.status].tone}>{PUBLISH_STATUS[p.status].text}</Badge>,
    },
    {
      key: 'updatedAt',
      header: '수정일',
      sort: 'date',
      cell: (p) => formatDate(p.updatedAt),
      className: 'tabular-nums whitespace-nowrap',
    },
  ];
}

function ProgramList() {
  const lp = useListParams();
  const categoryName = useCategoryName();
  const query = {
    q: lp.q || undefined,
    status: oneOf(lp.get('status'), PUBLISH_STATUS) || undefined,
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const programs = useQuery({
    queryKey: ['admin', 'programs', query],
    queryFn: () => api.admin.programs.list(query),
  });

  return (
    <>
      <FilterBar
        searchLabel="프로그램 검색"
        placeholder="프로그램명으로 검색"
        total={programs.data?.total}
        primary={<FilterSelect label="게시 상태" param="status" options={optionsOf(PUBLISH_STATUS)} />}
        secondary={<FilterSelect label="정렬" param="sort" options={SORT_OPTIONS} />}
      />
      <QueryState
        query={programs}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <EmptyState
            title="조건에 맞는 프로그램이 없습니다"
            description="검색어나 상태 필터를 바꿔 보세요."
          />
        }
      >
        {(d) => (
          <>
            <DataList
              caption="프로그램 목록"
              rows={d.items}
              columns={columns(categoryName)}
              rowLabel={(p) => p.title}
              sort={lp.sort}
              onSort={(sort) => lp.set({ sort: sort === 'newest' ? undefined : sort })}
            />
            <Pagination
              page={lp.page}
              total={d.total}
              pageSize={ADMIN_PAGE_SIZE}
              hrefFor={(p) => lp.hrefWith({ page: p })}
            />
          </>
        )}
      </QueryState>
    </>
  );
}

export default function AdminProgramsPage() {
  return (
    <AdminPage
      title="프로그램 관리"
      permission="program.write"
      actions={
        <Link href="/admin/programs/new" className={buttonClass()}>
          프로그램 등록
        </Link>
      }
    >
      <ProgramList />
    </AdminPage>
  );
}
