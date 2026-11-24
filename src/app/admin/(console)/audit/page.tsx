'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { FileClock } from 'lucide-react';
import '@/features/developer/operations.css';
import { FilterBar } from '@/components/admin/filter-bar';
import { ADMIN_PAGE_SIZE, useListParams } from '@/components/admin/list-params';
import { QueryState } from '@/components/admin/query-state';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/states';
import { formatDateTime } from '@/lib/format';

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
      <div className="audit-workspace">
        <header className="operations-heading">
          <FileClock size={23} />
          <strong>Audit trail</strong>
          <span>관리자 작업 이력</span>
        </header>
        <FilterBar
          searchLabel="감사 로그 검색"
          placeholder="내용, 처리자로 검색"
          total={events.data?.total}
        />
        <QueryState
          query={events}
          isEmpty={(d) => d.items.length === 0}
          empty={<EmptyState title="기록된 이벤트가 없습니다" />}
        >
          {(d) => (
            <>
              <ol className="audit-stream">
                {d.items.map((e) => (
                  <li key={e.id}>
                    <details>
                      <summary>
                        <time dateTime={e.at}>{formatDateTime(e.at)}</time>
                        <div>
                          <code>{e.action}</code>
                          <strong>{e.summary}</strong>
                        </div>
                        <span>{e.actorName}</span>
                      </summary>
                      <dl>
                        <dt>이벤트 ID</dt>
                        <dd>{e.id}</dd>
                        <dt>대상</dt>
                        <dd>
                          {e.targetType} / {e.targetId}
                        </dd>
                      </dl>
                    </details>
                  </li>
                ))}
              </ol>
              <Pagination
                page={lp.page}
                total={d.total}
                pageSize={ADMIN_PAGE_SIZE}
                hrefFor={(p) => lp.hrefWith({ page: p })}
              />
            </>
          )}
        </QueryState>
      </div>
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
