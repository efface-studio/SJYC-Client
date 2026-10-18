'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import type { Decision } from '@/api/client';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, type Column } from '@/components/admin/data-list';
import { FilterBar, FilterDate, FilterSelect, optionsOf } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, oneOf, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { RejectDialog } from '@/components/admin/reject-dialog';
import { SpaceSettings, useAdminSpaces } from '@/components/admin/space-settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { RESERVATION_STATUS } from '@/domain/labels';
import type { SpaceReservation } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

interface Target {
  r: SpaceReservation;
  decision: Decision;
}

function ReservationList() {
  const lp = useListParams();
  const qc = useQueryClient();
  const toast = useToast();
  const spaces = useAdminSpaces();
  const [target, setTarget] = useState<Target | null>(null);
  const query = {
    q: lp.q || undefined,
    status: oneOf(lp.get('status'), RESERVATION_STATUS) || undefined,
    spaceId: lp.get('spaceId') || undefined,
    date: lp.get('date') || undefined,
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const list = useQuery({
    queryKey: ['admin', 'reservations', query],
    queryFn: () => api.admin.spaces.reservations(query),
  });

  const decide = useMutation({
    mutationFn: ({ r, decision, reason }: Target & { reason: string | null }) =>
      api.admin.spaces.decideReservation(r.id, decision, reason),
    onSuccess: (r) => {
      setTarget(null);
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['spaces'] });
      toast.success(r.status === 'approved' ? '예약을 확정했습니다.' : '예약을 반려했습니다.');
    },
    onError: (e) => {
      setTarget(null);
      toast.error(errorMessage(e));
    },
  });

  const columns: Column<SpaceReservation>[] = [
    { key: 'space', header: '공간', primary: true, sort: 'title', cell: (r) => r.spaceName },
    {
      key: 'when',
      header: '이용 일시',
      cell: (r) => `${formatDate(`${r.date}T00:00:00+09:00`)} ${r.startTime}~${r.endTime}`,
      className: 'tabular-nums whitespace-nowrap',
    },
    { key: 'name', header: '신청자', cell: (r) => `${r.applicantName} · ${r.headcount}명` },
    { key: 'phone', header: '연락처', cell: (r) => r.phone, className: 'tabular-nums whitespace-nowrap' },
    {
      key: 'purpose',
      header: '이용 목적',
      cell: (r) => (
        <span className="line-clamp-2 md:max-w-xs">
          {r.purpose}
          {r.reason && <span className="block text-ink-600">반려 사유: {r.reason}</span>}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      status: true,
      cell: (r) => (
        <Badge tone={RESERVATION_STATUS[r.status].tone}>{RESERVATION_STATUS[r.status].text}</Badge>
      ),
    },
    {
      key: 'actions',
      header: '처리',
      cell: (r) =>
        r.status === 'pending' ? (
          <span className="flex gap-2">
            <Button size="sm" className="min-h-11" onClick={() => setTarget({ r, decision: 'approved' })}>
              확정
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="min-h-11 text-danger-700"
              onClick={() => setTarget({ r, decision: 'rejected' })}
            >
              반려
            </Button>
          </span>
        ) : (
          <span className="text-ink-600">-</span>
        ),
    },
  ];

  const spaceOptions = [
    { value: '', label: '전체 공간' },
    ...(spaces.data?.map((s) => ({ value: s.id, label: s.name })) ?? []),
  ];
  const summary =
    target &&
    `${target.r.spaceName} ${target.r.date} ${target.r.startTime}~${target.r.endTime} · ${target.r.applicantName}`;

  return (
    <>
      <FilterBar
        searchLabel="예약 검색"
        placeholder="신청자, 공간, 이용 목적"
        total={list.data?.total}
        primary={<FilterSelect label="상태" param="status" options={optionsOf(RESERVATION_STATUS)} />}
        secondary={
          <>
            <FilterSelect label="공간" param="spaceId" options={spaceOptions} />
            <FilterDate label="이용 날짜" param="date" />
          </>
        }
      />
      <QueryState
        query={list}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="조건에 맞는 예약 요청이 없습니다" />}
      >
        {(d) => (
          <>
            <DataList
              caption="공간 예약 요청 목록"
              rows={d.items}
              columns={columns}
              rowLabel={(r) => `${r.spaceName} ${r.applicantName}`}
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
        title="예약을 확정할까요?"
        description={<>{summary} 예약을 확정합니다. 결과는 신청자 화면에 바로 표시됩니다.</>}
        confirmLabel="확정"
        loading={decide.isPending}
        onConfirm={() => target && decide.mutate({ ...target, reason: null })}
        onClose={() => setTarget(null)}
      />
      <RejectDialog
        open={target?.decision === 'rejected'}
        title="예약을 반려할까요?"
        description={<>{summary} 예약 요청을 반려합니다.</>}
        loading={decide.isPending}
        onConfirm={(reason) => target && decide.mutate({ ...target, reason })}
        onClose={() => setTarget(null)}
      />
    </>
  );
}

function SpacesTabs() {
  const lp = useListParams();
  const tab = lp.get('tab') === 'settings' ? 'settings' : 'requests';
  const tabs = [
    { id: 'requests', label: '예약 요청', href: lp.pathname },
    { id: 'settings', label: '공간 설정', href: `${lp.pathname}?tab=settings` },
  ] as const;
  return (
    <>
      <nav aria-label="공간 예약 메뉴" className="mb-5 border-b border-line">
        <ul className="flex gap-1">
          {tabs.map((t) => (
            <li key={t.id}>
              <Link
                href={t.href}
                aria-current={tab === t.id ? 'page' : undefined}
                className={cn(
                  '-mb-px flex min-h-11 items-center border-b-2 px-3 text-[15px] font-semibold',
                  tab === t.id
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-ink-600 hover:text-ink-900',
                )}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {tab === 'settings' ? <SpaceSettings /> : <ReservationList />}
    </>
  );
}

export default function AdminSpacesPage() {
  return (
    <AdminPage title="공간 예약" permission="space.manage" docTitle="공간 예약 관리">
      <SpacesTabs />
    </AdminPage>
  );
}
