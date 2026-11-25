'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import type { Decision } from '@/api/client';
import { AdminPage } from '@/components/admin/admin-page';
import { BulkBar, BulkBarSpacer } from '@/components/admin/bulk-bar';
import { BulkResultView } from '@/components/admin/bulk-result';
import { DataList, RowLink, type Column } from '@/components/admin/data-list';
import { FilterBar, FilterSelect, optionsOf, SORT_OPTIONS } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, oneOf, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { RejectDialog } from '@/components/admin/reject-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { APPLICATION_STATUS } from '@/domain/labels';
import type { BulkResult, ProgramApplication } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

const COLUMNS: Column<ProgramApplication>[] = [
  {
    key: 'name',
    header: '신청자',
    primary: true,
    cell: (a) => (
      <div className="list-subject">
        <RowLink href={`/admin/applications/${a.id}`}>{a.applicantName}</RowLink>
        <small>접수 번호 {a.receiptNo ?? '미발급'}</small>
      </div>
    ),
  },
  { key: 'program', header: '프로그램', sort: 'title', cell: (a) => a.programTitle },
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
    cell: (a) => <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].text}</Badge>,
  },
];

/** 신청 목록의 프로그램 필터 옵션 — 제목순 최대 200개 */
function useProgramOptions() {
  const programs = useQuery({
    queryKey: ['admin', 'programs', { sort: 'title', pageSize: 200 }],
    queryFn: () => api.admin.programs.list({ sort: 'title', pageSize: 200 }),
    staleTime: 60_000,
  });
  return [
    { value: '', label: '전체 프로그램' },
    ...(programs.data?.items.map((p) => ({ value: p.id, label: p.title })) ?? []),
  ];
}

function ApplicationList() {
  const lp = useListParams();
  const qc = useQueryClient();
  const toast = useToast();
  const programOptions = useProgramOptions();
  const query = {
    q: lp.q || undefined,
    programId: lp.get('programId') || undefined,
    status: oneOf(lp.get('status'), APPLICATION_STATUS) || undefined,
    sort: lp.sort,
    page: lp.page,
    pageSize: ADMIN_PAGE_SIZE,
  };
  const listKey = JSON.stringify(query);
  const apps = useQuery({
    queryKey: ['admin', 'applications', query],
    queryFn: () => api.admin.applications.list(query),
  });

  // 선택은 현재 페이지·필터에만 유효하다 — 조건이 바뀌면 자동으로 비운다
  const [sel, setSel] = useState<{ key: string; ids: Set<string> }>({ key: listKey, ids: new Set() });
  const selected = sel.key === listKey ? sel.ids : new Set<string>();
  const setSelected = (ids: Set<string>) => setSel({ key: listKey, ids });
  const [dialog, setDialog] = useState<Decision | null>(null);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());

  const decide = useMutation({
    mutationFn: ({ decision, reason }: { decision: Decision; reason: string | null }) =>
      api.admin.applications.decide([...selected], decision, reason),
    onSuccess: (r) => {
      setNames(new Map(apps.data?.items.map((a) => [a.id, `${a.applicantName} · ${a.programTitle}`])));
      setResult(r);
      setSelected(new Set());
      setDialog(null);
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['programs'] });
      if (r.failed.length === 0) toast.success(`${r.succeeded.length}건을 처리했습니다.`);
      else toast.error(`${r.failed.length}건은 처리하지 못했습니다. 사유를 확인해 주세요.`);
    },
    onError: (e) => {
      setDialog(null);
      toast.error(errorMessage(e));
    },
  });

  return (
    <>
      <FilterBar
        searchLabel="신청 검색"
        placeholder="신청자, 프로그램, 접수 번호"
        total={apps.data?.total}
        primary={<FilterSelect label="상태" param="status" options={optionsOf(APPLICATION_STATUS)} />}
        secondary={
          <>
            <FilterSelect label="프로그램" param="programId" options={programOptions} />
            <FilterSelect label="정렬" param="sort" options={SORT_OPTIONS} />
          </>
        }
      />
      {result && (
        <BulkResultView
          result={result}
          nameOf={(id) => names.get(id) ?? id}
          onDismiss={() => setResult(null)}
        />
      )}
      <BulkBar count={selected.size} onClear={() => setSelected(new Set())}>
        <Button size="sm" className="min-h-11" onClick={() => setDialog('approved')}>
          승인
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="min-h-11 text-danger-700"
          onClick={() => setDialog('rejected')}
        >
          반려
        </Button>
      </BulkBar>
      <QueryState
        query={apps}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="조건에 맞는 신청이 없습니다" description="검색어나 필터를 바꿔 보세요." />}
      >
        {(d) => (
          <>
            <DataList
              caption="프로그램 신청 목록"
              rows={d.items}
              columns={COLUMNS}
              rowLabel={(a) => `${a.applicantName} ${a.programTitle}`}
              sort={lp.sort}
              onSort={(sort) => lp.set({ sort: sort === 'newest' ? undefined : sort })}
              selection={{ selected, onChange: setSelected }}
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
      <BulkBarSpacer count={selected.size} />

      <ConfirmDialog
        open={dialog === 'approved'}
        title={`선택한 ${selected.size}건을 승인할까요?`}
        description="승인 결과는 신청자 화면에 바로 표시됩니다. 접수 상태가 아닌 신청은 처리되지 않고 실패로 안내됩니다."
        confirmLabel={`${selected.size}건 승인`}
        loading={decide.isPending}
        onConfirm={() => decide.mutate({ decision: 'approved', reason: null })}
        onClose={() => setDialog(null)}
      />
      <RejectDialog
        open={dialog === 'rejected'}
        title={`선택한 ${selected.size}건을 반려할까요?`}
        description="같은 반려 사유가 선택한 모든 신청자에게 안내됩니다."
        loading={decide.isPending}
        onConfirm={(reason) => decide.mutate({ decision: 'rejected', reason })}
        onClose={() => setDialog(null)}
      />
    </>
  );
}

export default function AdminApplicationsPage() {
  return (
    <AdminPage
      view="list"
      title="프로그램 신청"
      permission="application.decide"
      docTitle="프로그램 신청 관리"
    >
      <ApplicationList />
    </AdminPage>
  );
}
