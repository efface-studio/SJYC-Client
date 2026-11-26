'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/api';
import { DirectoryIntro } from '@/components/site/directory-intro';
import { SearchInput } from '@/components/ui/search-input';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { NOTICE_CATEGORY_LABEL } from '@/domain/labels';
import type { NoticeCategory } from '@/domain/types';
import { NoticeItem } from '@/features/notices/notice-item';
import { cn } from '@/lib/cn';

const TABS: { value: '' | NoticeCategory; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'center', label: NOTICE_CATEGORY_LABEL.center },
  { value: 'youth', label: NOTICE_CATEGORY_LABEL.youth },
  { value: 'education', label: NOTICE_CATEGORY_LABEL.education },
];
const PAGE_SIZE = 10;

function isCategory(v: string | null): v is NoticeCategory {
  return v === 'center' || v === 'youth' || v === 'education';
}

function NoticeList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get('q') ?? '';
  const rawCategory = params.get('category');
  const category = isCategory(rawCategory) ? rawCategory : undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = { q: q || undefined, category, page, pageSize: PAGE_SIZE };
  const notices = useQuery({ queryKey: ['notices', query], queryFn: () => api.notices.list(query) });

  const href = (patch: { category?: string; q?: string; page?: number }) => {
    const next = new URLSearchParams();
    const c = 'category' in patch ? patch.category : category;
    const s = 'q' in patch ? patch.q : q;
    if (c) next.set('category', c);
    if (s) next.set('q', s);
    if (patch.page && patch.page > 1) next.set('page', String(patch.page));
    const str = next.toString();
    return str ? `${pathname}?${str}` : pathname;
  };

  return (
    <>
      <nav
        aria-label="공지 분류"
        className="-mx-4 scrollbar-none overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0"
      >
        <ul className="flex">
          {TABS.map((t) => {
            const active = (category ?? '') === t.value;
            return (
              <li key={t.value || 'all'} className="shrink-0">
                <Link
                  href={href({ category: t.value })}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'flex h-12 items-center border-b-2 px-3 text-[15px] font-semibold',
                    active ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
                  )}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          router.push(href({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() }));
        }}
        className="mt-5 flex max-w-2xl gap-2"
      >
        <label htmlFor="notice-q" className="sr-only">
          공지 검색
        </label>
        <SearchInput
          id="notice-q"
          name="q"

          defaultValue={q}
          placeholder="제목·내용 검색"
          enterKeyHint="search"
          className="h-12 rounded-md border border-line-strong px-3 text-base focus:border-brand-700 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="검색"
          className="flex size-12 shrink-0 items-center justify-center rounded-md bg-ink-900 text-white"
        >
          <Search aria-hidden className="size-5" />
        </button>
      </form>

      <div className="mt-4">
        {notices.isPending ? (
          <ListSkeleton rows={4} label="공지 불러오는 중" />
        ) : notices.isError ? (
          <ErrorState error={notices.error} onRetry={() => void notices.refetch()} />
        ) : notices.data.items.length === 0 ? (
          <EmptyState title="공지가 없습니다" description={q ? '다른 검색어로 찾아보세요.' : undefined} />
        ) : (
          <>
            <p className="mb-2 text-sm text-ink-600" aria-live="polite">
              총 <strong className="text-ink-900">{notices.data.total}</strong>건
            </p>
            <ul className="notice-feed">
              {notices.data.items.map((n) => (
                <NoticeItem key={n.id} notice={n} />
              ))}
            </ul>
            <Pagination
              page={page}
              total={notices.data.total}
              pageSize={PAGE_SIZE}
              hrefFor={(p) => href({ page: p })}
            />
          </>
        )}
      </div>
    </>
  );
}

export default function NoticesPage() {
  return (
    <div className="directory-page directory-notices">
      <title>공지사항 | 중구청소년센터</title>
      <DirectoryIntro kind="notices" />
      <div id="directory-content" className="directory-content">
        <h2 className="directory-content-heading">센터 공지</h2>
        <Suspense fallback={<ListSkeleton rows={4} />}>
          <NoticeList />
        </Suspense>
      </div>
    </div>
  );
}
