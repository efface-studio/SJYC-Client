'use client';

import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, isApiError } from '@/api';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { NOTICE_CATEGORY_LABEL } from '@/domain/labels';
import { formatBytes, formatDateTime } from '@/lib/format';

export default function NoticeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const notice = useQuery({ queryKey: ['notice', id], queryFn: () => api.notices.get(id) });

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        {notice.isPending ? (
          <ListSkeleton rows={2} />
        ) : notice.isError ? (
          isApiError(notice.error, 'NOT_FOUND') ? (
            <EmptyState
              title="공지를 찾을 수 없습니다"
              action={
                <Link href="/notices" className={buttonClass({ variant: 'secondary' })}>
                  공지 목록
                </Link>
              }
            />
          ) : (
            <ErrorState error={notice.error} onRetry={() => void notice.refetch()} />
          )
        ) : (
          <article>
            <title>{`${notice.data.title} | 중구청소년센터`}</title>
            <PageHeader
              breadcrumbs={[
                { label: '공지사항', href: '/notices' },
                { label: NOTICE_CATEGORY_LABEL[notice.data.category] },
              ]}
              title={<span className="text-xl leading-snug md:text-2xl">{notice.data.title}</span>}
              description={
                notice.data.publishedAt && (
                  <time dateTime={notice.data.publishedAt}>{formatDateTime(notice.data.publishedAt)}</time>
                )
              }
              className="border-b border-ink-900 pb-4"
            />
            {/* 본문은 일반 텍스트로만 렌더링 (HTML 주입 없음) */}
            <div className="text-base leading-relaxed whitespace-pre-line text-ink-900">
              {notice.data.body}
            </div>

            {notice.data.attachments.length > 0 && (
              <section aria-labelledby="files-title" className="mt-8 rounded-md bg-surface-muted p-4">
                <h2 id="files-title" className="text-[15px] font-bold">
                  첨부파일
                </h2>
                <ul className="mt-2 space-y-1">
                  {notice.data.attachments.map((f) => (
                    <li key={f.id}>
                      <a
                        href={f.url}
                        download={f.name}
                        className="flex min-h-11 items-center gap-2 text-[15px] text-ink-900 underline"
                      >
                        <Download aria-hidden className="size-4 shrink-0" />
                        <span className="break-all">{f.name}</span>
                        <span className="shrink-0 text-sm text-ink-600">({formatBytes(f.size)})</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="mt-10 border-t border-line pt-6">
              <Link href="/notices" className={buttonClass({ variant: 'secondary' })}>
                목록으로
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
