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
import { INQUIRY_CATEGORY_LABEL, INQUIRY_STATUS } from '@/domain/labels';
import type { Inquiry } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

const COLUMNS: Column<Inquiry>[] = [
  {
    key: 'title',
    header: '제목',
    sort: 'title',
    primary: true,
    cell: (x) => <RowLink href={`/admin/inquiries/${x.id}`}>{x.title}</RowLink>,
  },
  {
    key: 'category',
    header: '분류',
    cell: (x) => INQUIRY_CATEGORY_LABEL[x.category],
    className: 'whitespace-nowrap',
  },
  { key: 'author', header: '작성자', cell: (x) => x.authorName, className: 'whitespace-nowrap' },
  {
    key: 'createdAt',
    header: '등록 일시',
    sort: 'date',
    cell: (x) => formatDateTime(x.createdAt),
    className: 'tabular-nums whitespace-nowrap',
  },
  {
    key: 'status',
    header: '상태',
    status: true,
    cell: (x) => <Badge tone={INQUIRY_STATUS[x.status].tone}>{INQUIRY_STATUS[x.status].text}</Badge>,
  },
];

function InquiryList() {
  const lp = useListParams();
  const query = {
    q: lp.q || undefined,
    status: oneOf(lp.get('status'), INQUIRY_STATUS) || undefined,
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const list = useQuery({
    queryKey: ['admin', 'inquiries', query],
    queryFn: () => api.admin.inquiries.list(query),
  });

  return (
    <>
      <FilterBar
        searchLabel="문의 검색"
        placeholder="제목 또는 작성자"
        total={list.data?.total}
        primary={<FilterSelect label="상태" param="status" options={optionsOf(INQUIRY_STATUS)} />}
        secondary={<FilterSelect label="정렬" param="sort" options={SORT_OPTIONS} />}
      />
      <QueryState
        query={list}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="조건에 맞는 문의가 없습니다" />}
      >
        {(d) => (
          <>
            <DataList
              caption="문의 목록"
              rows={d.items}
              columns={COLUMNS}
              rowLabel={(x) => x.title}
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

export default function AdminInquiriesPage() {
  return (
    <AdminPage
      title="문의"
      permission="inquiry.answer"
      docTitle="문의 관리"
      actions={
        <Link href="/admin/faqs" className={buttonClass({ variant: 'secondary' })}>
          FAQ 관리
        </Link>
      }
    >
      <InquiryList />
    </AdminPage>
  );
}
