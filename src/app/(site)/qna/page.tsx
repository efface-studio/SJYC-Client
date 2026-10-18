'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/api';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { CENTER } from '@/config/center';
import { INQUIRY_CATEGORY_LABEL, INQUIRY_STATUS } from '@/domain/labels';
import type { InquiryCategory } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

function FaqList() {
  const faqs = useQuery({ queryKey: ['faqs'], queryFn: () => api.faqs.list() });
  const [category, setCategory] = useState<InquiryCategory | ''>('');

  if (faqs.isPending) return <ListSkeleton rows={3} />;
  if (faqs.isError) return <ErrorState error={faqs.error} onRetry={() => void faqs.refetch()} />;
  if (faqs.data.length === 0) return <EmptyState title="등록된 질문이 없습니다" />;

  const categories = [...new Set(faqs.data.map((f) => f.category))];
  const list = faqs.data.filter((f) => !category || f.category === category);

  return (
    <>
      <div role="group" aria-label="질문 분류" className="-mx-4 scrollbar-none overflow-x-auto px-4">
        <div className="flex gap-1">
          {(['', ...categories] as const).map((c) => (
            <button
              key={c || 'all'}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                'h-10 shrink-0 border-b-2 px-3 text-[15px] font-semibold',
                category === c ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
              )}
            >
              {c ? INQUIRY_CATEGORY_LABEL[c] : '전체'}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-2 border-t border-line">
        {list.map((f) => (
          <li key={f.id} className="border-b border-line">
            {/* 네이티브 details — 키보드·스크린 리더 지원 */}
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-start gap-3 py-4 [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="text-[17px] font-extrabold text-brand-700">
                  Q
                </span>
                <span className="flex-1 text-base font-semibold">{f.question}</span>
                <ChevronDown
                  aria-hidden
                  className="mt-1 size-5 shrink-0 text-ink-600 transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="flex gap-3 pb-5">
                <span aria-hidden className="text-[17px] font-extrabold text-ink-600">
                  A
                </span>
                <p className="flex-1 text-[15px] leading-relaxed whitespace-pre-line text-ink-700">
                  {f.answer}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}

function MyInquiries() {
  const { data: session, isPending } = useSession();
  const inquiries = useQuery({
    queryKey: ['my-inquiries'],
    queryFn: () => api.me.inquiries(),
    enabled: !!session,
  });

  if (isPending) return <ListSkeleton rows={1} />;
  if (!session) {
    return (
      <div className="border-b border-line py-6">
        <p className="text-[15px] text-ink-700">
          1:1 문의는 로그인 후 작성할 수 있으며, 답변은 본인만 볼 수 있습니다.
        </p>
        <Link href={`/login?next=${encodeURIComponent('/qna/new')}`} className={`${buttonClass()} mt-4`}>
          로그인하고 문의하기
        </Link>
      </div>
    );
  }
  return (
    <>
      <Link href="/qna/new" className={`${buttonClass({ block: true, size: 'lg' })} my-4 sm:w-auto`}>
        문의하기
      </Link>
      {inquiries.isPending ? (
        <ListSkeleton rows={2} />
      ) : inquiries.isError ? (
        <ErrorState error={inquiries.error} onRetry={() => void inquiries.refetch()} />
      ) : inquiries.data.length === 0 ? (
        <EmptyState title="작성한 문의가 없습니다" />
      ) : (
        <ul className="border-t border-line">
          {inquiries.data.map((q) => {
            const s = INQUIRY_STATUS[q.status];
            return (
              <li key={q.id}>
                <Link
                  href={`/qna/${q.id}`}
                  className="group flex items-center gap-3 border-b border-line py-4 active:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-ink-600">
                      <Badge tone={s.tone}>{s.text}</Badge>
                      <span>{INQUIRY_CATEGORY_LABEL[q.category]}</span>
                      <span className="tabular-nums">{formatDate(q.createdAt)}</span>
                    </div>
                    <p className="mt-1 truncate font-semibold group-hover:underline">{q.title}</p>
                  </div>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-600" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default function QnaPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <title>질문 · 문의 | 중구청소년센터</title>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="질문 · 문의"
          description={`급한 문의는 대표번호 ${CENTER.telDisplay}로 전화해 주세요.`}
        />
        <section aria-labelledby="faq-title" className="border-t-2 border-ink-900 pt-3">
          <h2 id="faq-title" className="mb-2 text-xl font-extrabold">
            자주 묻는 질문
          </h2>
          <FaqList />
        </section>
        <section aria-labelledby="inquiry-title" className="mt-12 border-t-2 border-ink-900 pt-3">
          <h2 id="inquiry-title" className="text-xl font-extrabold">
            1:1 문의
          </h2>
          <MyInquiries />
        </section>
      </div>
    </div>
  );
}
