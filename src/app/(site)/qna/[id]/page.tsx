'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, isApiError } from '@/api';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { INQUIRY_CATEGORY_LABEL, INQUIRY_STATUS } from '@/domain/labels';
import { RequireAuth } from '@/features/auth/guards';
import { formatDateTime } from '@/lib/format';

function InquiryDetail() {
  const { id } = useParams<{ id: string }>();
  const q = useQuery({ queryKey: ['my-inquiry', id], queryFn: () => api.me.inquiry(id) });

  if (q.isPending) return <ListSkeleton rows={2} />;
  if (q.isError) {
    return isApiError(q.error, 'NOT_FOUND') ? (
      <EmptyState title="문의를 찾을 수 없습니다" />
    ) : (
      <ErrorState error={q.error} onRetry={() => void q.refetch()} />
    );
  }
  const s = INQUIRY_STATUS[q.data.status];
  return (
    <article>
      <title>{`${q.data.title} | 중구청소년센터`}</title>
      <div className="flex items-center gap-2 text-sm text-ink-600">
        <Badge tone={s.tone}>{s.text}</Badge>
        <span>{INQUIRY_CATEGORY_LABEL[q.data.category]}</span>
        <time className="tabular-nums" dateTime={q.data.createdAt}>
          {formatDateTime(q.data.createdAt)}
        </time>
      </div>
      <h2 className="mt-2 text-xl font-bold">{q.data.title}</h2>
      <p className="mt-4 border-b border-line pb-6 text-base leading-relaxed whitespace-pre-line">
        {q.data.body}
      </p>

      <section aria-labelledby="answer-title" className="mt-6">
        <h3 id="answer-title" className="font-extrabold">
          센터 답변
        </h3>
        {q.data.answer ? (
          <div className="mt-3 border-l-[3px] border-brand-500 pl-4">
            <p className="text-base leading-relaxed whitespace-pre-line">{q.data.answer.body}</p>
            <p className="mt-2 text-sm text-ink-600 tabular-nums">
              {formatDateTime(q.data.answer.answeredAt)}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-[15px] text-ink-600">담당자가 확인 후 답변을 등록하면 이곳에 표시됩니다.</p>
        )}
      </section>

      <Link href="/qna" className={`${buttonClass({ variant: 'secondary' })} mt-10`}>
        목록으로
      </Link>
    </article>
  );
}

export default function InquiryPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="1:1 문의"
          breadcrumbs={[{ label: '질문 · 문의', href: '/qna' }, { label: '문의 내용' }]}
        />
        <RequireAuth>
          <InquiryDetail />
        </RequireAuth>
      </div>
    </div>
  );
}
