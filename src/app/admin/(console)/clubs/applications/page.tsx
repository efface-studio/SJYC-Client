'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import type { Decision } from '@/api/client';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, type Column } from '@/components/admin/data-list';
import { FilterBar, FilterSelect, optionsOf } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, oneOf, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { RejectDialog } from '@/components/admin/reject-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { CLUB_APPLICATION_STATUS } from '@/domain/labels';
import type { ClubApplication } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

interface Target {
  app: ClubApplication;
  decision: Decision;
}

function ClubApplicationList() {
  const lp = useListParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [target, setTarget] = useState<Target | null>(null);
  const query = {
    q: lp.q || undefined,
    status: oneOf(lp.get('status'), CLUB_APPLICATION_STATUS),
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const apps = useQuery({
    queryKey: ['admin', 'club-applications', query],
    queryFn: () => api.admin.clubs.applications(query),
  });

  const decide = useMutation({
    mutationFn: ({ app, decision, reason }: Target & { reason: string | null }) =>
      api.admin.clubs.decideApplication(app.id, decision, reason),
    onSuccess: (a) => {
      setTarget(null);
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['clubs'] });
      toast.success(
        `${a.applicantName}님의 가입 신청을 ${a.status === 'approved' ? '승인' : '반려'}했습니다.`,
      );
    },
    onError: (e) => {
      setTarget(null);
      toast.error(errorMessage(e));
    },
  });

  const columns: Column<ClubApplication>[] = [
    { key: 'name', header: '신청자', primary: true, cell: (a) => a.applicantName },
    { key: 'club', header: '동아리', cell: (a) => a.clubName },
    {
      key: 'motivation',
      header: '가입 동기',
      cell: (a) => (
        <span className="line-clamp-3 whitespace-pre-line md:max-w-sm" title={a.motivation}>
          {a.motivation}
          {a.reason && <span className="mt-1 block text-ink-600">반려 사유: {a.reason}</span>}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '신청 일시',
      sort: 'date',
      cell: (a) => formatDateTime(a.createdAt),
      className: 'tabular-nums whitespace-nowrap',
    },
    {
      key: 'status',
      header: '상태',
      status: true,
      cell: (a) => (
        <Badge tone={CLUB_APPLICATION_STATUS[a.status].tone}>{CLUB_APPLICATION_STATUS[a.status].text}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '처리',
      cell: (a) =>
        a.status === 'pending' ? (
          <span className="flex gap-2">
            <Button
              size="sm"
              className="min-h-11"
              onClick={() => setTarget({ app: a, decision: 'approved' })}
            >
              승인
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11 text-danger-700"
              onClick={() => setTarget({ app: a, decision: 'rejected' })}
            >
              반려
            </Button>
          </span>
        ) : (
          <span className="text-ink-600">-</span>
        ),
    },
  ];

  return (
    <>
      <FilterBar
        searchLabel="가입 신청 검색"
        placeholder="신청자 또는 동아리명"
        total={apps.data?.total}
        primary={<FilterSelect label="상태" param="status" options={optionsOf(CLUB_APPLICATION_STATUS)} />}
        secondary={
          <FilterSelect
            label="정렬"
            param="sort"
            options={[
              { value: '', label: '최신순' },
              { value: 'oldest', label: '오래된 순' },
              { value: 'title', label: '동아리명순' },
            ]}
          />
        }
      />
      <QueryState
        query={apps}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="조건에 맞는 가입 신청이 없습니다" />}
      >
        {(d) => (
          <>
            <DataList
              caption="동아리 가입 신청 목록"
              rows={d.items}
              columns={columns}
              rowLabel={(a) => `${a.applicantName} ${a.clubName}`}
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

      <ConfirmDialog
        open={target?.decision === 'approved'}
        title="가입을 승인할까요?"
        description={
          target && (
            <>
              <strong>{target.app.applicantName}</strong>님을 <strong>{target.app.clubName}</strong> 회원으로
              승인합니다.
            </>
          )
        }
        confirmLabel="승인"
        loading={decide.isPending}
        onConfirm={() => target && decide.mutate({ ...target, reason: null })}
        onClose={() => setTarget(null)}
      />
      <RejectDialog
        open={target?.decision === 'rejected'}
        title="가입 신청을 반려할까요?"
        description={
          target && (
            <>
              <strong>{target.app.applicantName}</strong>님의 <strong>{target.app.clubName}</strong> 가입
              신청을 반려합니다.
            </>
          )
        }
        loading={decide.isPending}
        onConfirm={(reason) => target && decide.mutate({ ...target, reason })}
        onClose={() => setTarget(null)}
      />
    </>
  );
}

export default function AdminClubApplicationsPage() {
  return (
    <AdminPage
      title="동아리 가입 신청"
      permission="club.manage"
      breadcrumbs={[{ label: '동아리 관리', href: '/admin/clubs' }, { label: '가입 신청' }]}
    >
      <ClubApplicationList />
    </AdminPage>
  );
}
