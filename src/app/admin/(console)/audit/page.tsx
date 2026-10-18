'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { DataList, type Column } from '@/components/admin/data-list';
import { FilterBar } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import type { AuditEvent } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

const COLUMNS: Column<AuditEvent>[] = [
  { key: 'summary', header: '내용', primary: true, cell: (e) => e.summary },
  {
    key: 'at',
    header: '일시',
    cell: (e) => formatDateTime(e.at),
    className: 'tabular-nums whitespace-nowrap',
  },
  { key: 'actor', header: '처리자', cell: (e) => e.actorName, className: 'whitespace-nowrap' },
  { key: 'action', header: '작업', cell: (e) => <code className="text-sm">{e.action}</code> },
  {
    key: 'target',
    header: '대상',
    cell: (e) => <code className="text-sm break-all">{`${e.targetType}:${e.targetId}`}</code>,
  },
];

function AuditList() {
  const lp = useListParams();
  // 감사 로그는 서버가 최신순으로만 내려준다
  const query = { q: lp.q || undefined, page: lp.page, pageSize: ADMIN_PAGE_SIZE };
  const events = useQuery({
    queryKey: ['admin', 'audit', query],
    queryFn: () => api.admin.audit.list(query),
  });

  return (
    <>
      <FilterBar searchLabel="감사 로그 검색" placeholder="내용, 처리자로 검색" total={events.data?.total} />
      <QueryState
        query={events}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title="기록된 이벤트가 없습니다" />}
      >
        {(d) => (
          <>
            <DataList caption="감사 로그" rows={d.items} columns={COLUMNS} rowLabel={(e) => e.summary} />
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

export default function AdminAuditPage() {
  return (
    <AdminPage
      title="감사 로그"
      permission="audit.read"
      description="관리자 작업 기록입니다. 수정·삭제할 수 없습니다."
    >
      <AuditList />
    </AdminPage>
  );
}
