'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, RowLink, type Column } from '@/components/admin/data-list';
import { FilterBar, FilterSelect, optionsOf } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, oneOf, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { USER_STATUS } from '@/domain/labels';
import { ROLE_LABEL } from '@/domain/permissions';
import type { User } from '@/domain/types';
import { formatDate } from '@/lib/format';

const SORT = [
  { value: '', label: '최근 가입순' },
  { value: 'oldest', label: '오래된 가입순' },
  { value: 'title', label: '이름순' },
];

const COLUMNS: Column<User>[] = [
  {
    key: 'name',
    header: '이름',
    sort: 'title',
    primary: true,
    cell: (u) => (
      <div className="member-identity">
        <span aria-hidden>{Array.from(u.name)[0]}</span>
        <div className="list-subject">
          <RowLink href={`/admin/members/${u.id}`}>{u.name}</RowLink>
          <small>{u.email}</small>
        </div>
      </div>
    ),
  },

  {
    key: 'roles',
    header: '역할',
    cell: (u) => u.roles.map((r) => ROLE_LABEL[r]).join(', '),
    className: 'whitespace-nowrap',
  },
  {
    key: 'createdAt',
    header: '가입일',
    sort: 'date',
    cell: (u) => formatDate(u.createdAt),
    className: 'tabular-nums whitespace-nowrap',
  },
  {
    key: 'status',
    header: '상태',
    status: true,
    cell: (u) => <Badge tone={USER_STATUS[u.status].tone}>{USER_STATUS[u.status].text}</Badge>,
  },
];

function MemberList() {
  const lp = useListParams();
  const query = {
    q: lp.q || undefined,
    status: oneOf(lp.get('status'), USER_STATUS) || undefined,
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const members = useQuery({
    queryKey: ['admin', 'members', query],
    queryFn: () => api.admin.members.list(query),
  });

  return (
    <>
      <FilterBar
        searchLabel="회원 검색"
        placeholder="이름 또는 이메일"
        total={members.data?.total}
        primary={<FilterSelect label="상태" param="status" options={optionsOf(USER_STATUS)} />}
        secondary={<FilterSelect label="정렬" param="sort" options={SORT} />}
      />
      <QueryState
        query={members}
        isEmpty={(d) => d.items.length === 0}
        empty={
          <EmptyState title="조건에 맞는 회원이 없습니다" description="검색어나 상태 필터를 바꿔 보세요." />
        }
      >
        {(d) => (
          <>
            <DataList
              caption="회원 목록"
              rows={d.items}
              columns={COLUMNS}
              rowLabel={(u) => u.name}
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

export default function AdminMembersPage() {
  return (
    <AdminPage
      view="list"
      title="회원"
      permission="member.read"
      docTitle="회원 관리"
      description="개인정보는 업무에 필요한 최소 범위만 표시합니다."
    >
      <MemberList />
    </AdminPage>
  );
}
