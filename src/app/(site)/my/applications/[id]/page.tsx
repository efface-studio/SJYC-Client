'use client';

import { ApplicationEditor } from '@/features/applications/content';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Callout, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { APPLICATION_STATUS } from '@/domain/labels';
import { formatDateTime } from '@/lib/format';

const ACTOR = { applicant: '신청자', staff: '센터', system: '시스템' } as const;

function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const done = useSearchParams().get('done') === '1';
  const qc = useQueryClient();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const app = useQuery({ queryKey: ['my-application', id], queryFn: () => api.me.application(id) });

  const cancel = useMutation({
    mutationFn: () => api.me.cancelApplication(id),
    onSuccess: (updated) => {
      qc.setQueryData(['my-application', id], updated);
      void qc.invalidateQueries({ queryKey: ['my-applications'] });
      void qc.invalidateQueries({ queryKey: ['programs'] });
      setConfirming(false);
      toast.success('신청을 취소했습니다.');
    },
    onError: (e) => {
      setConfirming(false);
      toast.error(errorMessage(e));
    },
  });

  if (app.isPending) return <ListSkeleton rows={2} />;
  if (app.isError) {
    return isApiError(app.error, 'NOT_FOUND') ? (
      <EmptyState title="신청 내역을 찾을 수 없습니다" />
    ) : (
      <ErrorState error={app.error} onRetry={() => void app.refetch()} />
    );
  }

  const a = app.data;
  const s = APPLICATION_STATUS[a.status];
  return (
    <>
      <title>신청 내역 | 중구청소년센터</title>
      {done && a.status === 'submitted' && (
        <Callout tone="brand" title="신청이 접수되었습니다" className="mb-6">
          {a.receiptNo ? (
            <>
              접수 번호 <strong>{a.receiptNo}</strong>
            </>
          ) : (
            '접수 번호는 센터 확인 후 안내됩니다.'
          )}
          . 센터 확인 후 승인 여부가 이 화면에 표시됩니다.
        </Callout>
      )}

      <div className="flex items-center gap-2">
        <Badge tone={s.tone}>{s.text}</Badge>
        {a.receiptNo && <span className="text-sm text-ink-600">접수 번호 {a.receiptNo}</span>}
      </div>
      <h2 className="mt-2 text-xl font-bold">
        <Link href={`/programs/${a.programId}`} className="hover:underline">
          {a.programTitle}
        </Link>
      </h2>

      <dl className="mt-4 grid grid-cols-[88px_1fr] gap-y-2 border-y border-line py-4 text-[15px]">
        <dt className="font-semibold text-ink-600">신청자</dt>
        <dd>{a.applicantName}</dd>
        <dt className="font-semibold text-ink-600">연락처</dt>
        <dd>{a.phone}</dd>
        <dt className="font-semibold text-ink-600">요청 사항</dt>
        <dd className="whitespace-pre-line">
          {a.note || '없음'}
          <ApplicationEditor kind="program" id={id} value={a.note} revision={a.contentEdits?.length ?? 0} />
        </dd>
      </dl>

      <section aria-labelledby="history-title" className="mt-6">
        <h3 id="history-title" className="mb-2 font-bold">
          처리 이력
        </h3>
        <ol className="space-y-3 border-l-2 border-line pl-4">
          {a.history.map((h, i) => (
            <li key={i}>
              <p className="text-[15px] font-semibold">
                {APPLICATION_STATUS[h.status].text}{' '}
                <span className="font-normal text-ink-600">· {ACTOR[h.actor]}</span>
              </p>
              <p className="text-sm text-ink-600">{formatDateTime(h.at)}</p>
              {h.reason && <p className="mt-1 text-sm text-ink-700">사유: {h.reason}</p>}
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Link href="/my" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          신청 내역 목록
        </Link>
        {a.cancellable ? (
          <Button variant="destructive" size="lg" onClick={() => setConfirming(true)}>
            신청 취소
          </Button>
        ) : (
          (a.status === 'submitted' || a.status === 'approved') && (
            <p className="self-center text-sm text-ink-600">
              취소 가능 기간이 지나 온라인 취소가 불가합니다. 센터로 문의해 주세요.
            </p>
          )
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        title="신청을 취소할까요?"
        description={
          <>
            <strong>{a.programTitle}</strong> 신청을 취소합니다. 취소 후 정원이 마감되면 다시 신청하지 못할 수
            있습니다.
          </>
        }
        confirmLabel="신청 취소"
        cancelLabel="유지"
        destructive
        loading={cancel.isPending}
        onConfirm={() => cancel.mutate()}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}

export default function MyApplicationPage() {
  return (
    <Suspense fallback={<ListSkeleton rows={2} />}>
      <ApplicationDetail />
    </Suspense>
  );
}
