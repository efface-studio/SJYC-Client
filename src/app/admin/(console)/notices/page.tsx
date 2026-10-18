'use client';

import { useQuery } from '@tanstack/react-query';
import { Pin } from 'lucide-react';
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
import { NOTICE_CATEGORY_LABEL, PUBLISH_STATUS } from '@/domain/labels';
import type { Notice } from '@/domain/types';
import { formatDate } from '@/lib/format';

const COLUMNS: Column<Notice>[] = [
  {
    key: 'title',
    header: '제목',
    sort: 'title',
    primary: true,
    cell: (n) => (
      <span className="inline-flex items-center gap-1.5">
        {n.pinned && (
          <>
            <Pin aria-hidden className="size-3.5 shrink-0 text-brand-700" />
            <span className="sr-only">상단 고정</span>
          </>
        )}
        <RowLink href={`/admin/notices/${n.id}`}>{n.title}</RowLink>
      </span>
    ),
  },
  {
    key: 'category',
    header: '분류',
    cell: (n) => NOTICE_CATEGORY_LABEL[n.category],
    className: 'whitespace-nowrap',
  },
  {
    key: 'status',
    header: '상태',
    status: true,
    cell: (n) => <Badge tone={PUBLISH_STATUS[n.status].tone}>{PUBLISH_STATUS[n.status].text}</Badge>,
  },
  {
    key: 'updatedAt',
    header: '수정일',
    sort: 'date',
    cell: (n) => formatDate(n.updatedAt),
    className: 'tabular-nums whitespace-nowrap',
  },
];

function NoticeList() {
  const lp = useListParams();
  const query = {
    q: lp.q || undefined,
    status: oneOf(lp.get('status'), PUBLISH_STATUS) || undefined,
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const notices = useQuery({
    queryKey: ['admin', 'notices', query],
    queryFn: () => api.admin.notices.list(query),
  });

  return (
    <>
      <FilterBar
        searchLabel="공지 검색"
        placeholder="제목으로 검색"
        total={notices.data?.total}
        primary={<FilterSelect label="상태" param="status" options={optionsOf(PUBLISH_STATUS)} />}
        secondary={<FilterSelect label="정렬" param="sort" options={SORT_OPTIONS} />}
      />
      <QueryState
        query={notices}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <EmptyState title="조건에 맞는 공지가 없습니다" description="검색어나 상태 필터를 바꿔 보세요." />
        }
      >
        {(d) => (
          <>
            <DataList
              caption="공지 목록"
              rows={d.items}
              columns={COLUMNS}
              rowLabel={(n) => n.title}
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

export default function AdminNoticesPage() {
  return (
    <AdminPage
      title="공지 관리"
      permission="notice.write"
      actions={
        <Link href="/admin/notices/new" className={buttonClass({ size: 'md' })}>
          공지 등록
        </Link>
      }
    >
      <NoticeList />
    </AdminPage>
  );
}
