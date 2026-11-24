'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import type { Decision } from '@/api/client';
import { AdminPage } from '@/components/admin/admin-page';
import { QueryState } from '@/components/admin/query-state';
import { RejectDialog } from '@/components/admin/reject-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { APPLICATION_STATUS } from '@/domain/labels';
import { formatDateTime } from '@/lib/format';

const ACTOR = { applicant: '신청자', staff: '센터', system: '시스템' } as const;

function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const toast = useToast();
  const [dialog, setDialog] = useState<Decision | null>(null);
  const app = useQuery({
    queryKey: ['admin', 'application', id],
    queryFn: () => api.admin.applications.get(id),
  });

  const decide = useMutation({
    mutationFn: ({ decision, reason }: { decision: Decision; reason: string | null }) =>
      api.admin.applications.decide([id], decision, reason),
    onSuccess: (r, v) => {
      setDialog(null);
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['programs'] });
      const failed = r.failed[0];
      if (failed) toast.error(failed.reason);
      else toast.success(v.decision === 'approved' ? '신청을 승인했습니다.' : '신청을 반려했습니다.');
    },
    onError: (e) => {
      setDialog(null);
      toast.error(errorMessage(e));
    },
  });

  return (
    <QueryState query={app} notFound="신청 내역을 찾을 수 없습니다">
      {(a) => (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={APPLICATION_STATUS[a.status].tone}>{APPLICATION_STATUS[a.status].text}</Badge>
            <span className="text-sm text-ink-600 tabular-nums">접수 번호 {a.receiptNo ?? '미발급'}</span>
          </div>
          <h2 className="mt-2 text-lg font-bold">
            {a.applicantName} · {a.programTitle}
          </h2>

          <dl className="console-surface mt-4 grid max-w-2xl grid-cols-[96px_1fr] gap-y-2 px-4 py-4 text-[15px]">
            <dt className="text-ink-600">프로그램</dt>
            <dd>
              <Link href={`/admin/programs/${a.programId}`} className="text-brand-700 hover:underline">
                {a.programTitle}
              </Link>
            </dd>
            <dt className="text-ink-600">신청자</dt>
            <dd>{a.applicantName}</dd>
            <dt className="text-ink-600">연락처</dt>
            <dd className="tabular-nums">{a.phone}</dd>
            <dt className="text-ink-600">신청 일시</dt>
            <dd className="tabular-nums">{formatDateTime(a.createdAt)}</dd>
            <dt className="text-ink-600">요청 사항</dt>
            <dd className="whitespace-pre-line">{a.note || '없음'}</dd>
          </dl>

          {a.status === 'submitted' && (
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button onClick={() => setDialog('approved')}>승인</Button>
              <Button variant="secondary" className="text-danger-700" onClick={() => setDialog('rejected')}>
                반려
              </Button>
            </div>
          )}

          <section aria-labelledby="history-title" className="mt-8 max-w-2xl">
            <h2 id="history-title" className="mb-3 text-base font-bold">
              처리 이력
            </h2>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {a.history.map((h, i) => (
                <li key={`${h.at}-${i}`}>
                  <p className="text-[15px] font-semibold">
                    {APPLICATION_STATUS[h.status].text}{' '}
                    <span className="font-normal text-ink-600">· {ACTOR[h.actor]}</span>
                  </p>
                  <p className="text-sm text-ink-600 tabular-nums">{formatDateTime(h.at)}</p>
                  {h.reason && <p className="mt-1 text-sm text-ink-700">사유: {h.reason}</p>}
                </li>
              ))}
            </ol>
          </section>

          <ConfirmDialog
            open={dialog === 'approved'}
            title="신청을 승인할까요?"
            description={
              <>
                <strong>{a.applicantName}</strong>님의 <strong>{a.programTitle}</strong> 신청을 승인합니다.
                결과는 신청자 화면에 바로 표시됩니다.
              </>
            }
            confirmLabel="승인"
            loading={decide.isPending}
            onConfirm={() => decide.mutate({ decision: 'approved', reason: null })}
            onClose={() => setDialog(null)}
          />
          <RejectDialog
            open={dialog === 'rejected'}
            title="신청을 반려할까요?"
            description={
              <>
                <strong>{a.applicantName}</strong>님의 <strong>{a.programTitle}</strong> 신청을 반려합니다.
              </>
            }
            loading={decide.isPending}
            onConfirm={(reason) => decide.mutate({ decision: 'rejected', reason })}
            onClose={() => setDialog(null)}
          />
        </>
      )}
    </QueryState>
  );
}

export default function AdminApplicationDetailPage() {
  return (
    <AdminPage
      title="신청 상세"
      permission="application.decide"
      breadcrumbs={[{ label: '프로그램 신청', href: '/admin/applications' }, { label: '상세' }]}
    >
      <ApplicationDetail />
    </AdminPage>
  );
}
