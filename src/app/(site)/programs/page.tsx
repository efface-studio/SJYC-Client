'use client';

import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/api';
import { Pagination } from '@/components/ui/pagination';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { RECRUIT_STATUS } from '@/domain/labels';
import type { RecruitStatus } from '@/domain/types';
import {
  ProgramRow,
  ProgramViewToggle,
  useCategories,
  useCategoryName,
} from '@/features/programs/program-card';
import { cn } from '@/lib/cn';

const STATUS_FILTERS: { value: '' | RecruitStatus; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'open', label: RECRUIT_STATUS.open.text },
  { value: 'upcoming', label: RECRUIT_STATUS.upcoming.text },
  { value: 'full', label: RECRUIT_STATUS.full.text },
  { value: 'closed', label: RECRUIT_STATUS.closed.text },
];

const PAGE_SIZE = 10;

function isRecruitStatus(v: string | null): v is RecruitStatus {
  return v === 'open' || v === 'upcoming' || v === 'full' || v === 'closed';
}

function ProgramList() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const q = params.get('q') ?? '';
  const categoryId = params.get('category') ?? '';
  const rawStatus = params.get('status');
  const status = isRecruitStatus(rawStatus) ? rawStatus : undefined;
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = {
    q: q || undefined,
    categoryId: categoryId || undefined,
    recruitStatus: status,
    page,
    pageSize: PAGE_SIZE,
  };
  const programs = useQuery({ queryKey: ['programs', query], queryFn: () => api.programs.list(query) });
  const categories = useCategories();
  const categoryName = useCategoryName();

  const hrefWith = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    if (!('page' in patch)) next.delete('page');
    const s = next.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  const groups = [...new Set(categories.data?.map((c) => c.group) ?? [])];

  return (
    <>
      <title>프로그램 | 중구청소년센터</title>
      <div className="space-y-3">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const value = String(new FormData(e.currentTarget).get('q') ?? '').trim();
            router.push(hrefWith({ q: value }));
          }}
          className="flex gap-2"
        >
          <label htmlFor="program-q" className="sr-only">
            프로그램 검색
          </label>
          <input
            id="program-q"
            name="q"
            type="search"
            defaultValue={q}
            key={q}
            placeholder="프로그램명, 대상으로 검색"
            enterKeyHint="search"
            className="h-12 min-w-0 flex-1 rounded-md border border-line-strong px-3 text-base focus:border-brand-700 focus:outline-none"
          />
          <button
            type="submit"
            aria-label="검색"
            className="flex size-12 shrink-0 items-center justify-center rounded-md bg-ink-900 text-white"
          >
            <Search aria-hidden className="size-5" />
          </button>
        </form>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* 모바일에서 가로 스크롤되는 상태 탭 */}
          <nav aria-label="모집 상태" className="-mx-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="flex border-b border-line md:border-0">
              {STATUS_FILTERS.map((f) => {
                const active = (status ?? '') === f.value;
                return (
                  <li key={f.value || 'all'} className="shrink-0">
                    <Link
                      href={hrefWith({ status: f.value })}
                      aria-current={active ? 'true' : undefined}
                      className={cn(
                        'flex h-11 items-center border-b-2 px-3 text-[15px] font-semibold',
                        active ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
                      )}
                    >
                      {f.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <label htmlFor="program-category" className="shrink-0 text-[15px] font-semibold">
              분류
            </label>
            <select
              id="program-category"
              value={categoryId}
              onChange={(e) => router.push(hrefWith({ category: e.target.value }))}
              className="h-11 min-w-0 flex-1 rounded-md border border-line-strong px-3 text-base md:w-56 md:flex-none"
            >
              <option value="">전체 분류</option>
              {groups.map((g) => (
                <optgroup key={g} label={g}>
                  {categories.data
                    ?.filter((c) => c.group === g)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {programs.isPending ? (
          <ListSkeleton rows={3} label="프로그램 불러오는 중" />
        ) : programs.isError ? (
          <ErrorState error={programs.error} onRetry={() => void programs.refetch()} />
        ) : programs.data.items.length === 0 ? (
          <EmptyState
            title="조건에 맞는 프로그램이 없습니다"
            description="검색어나 필터를 바꿔 다시 찾아보세요."
            action={
              (q || categoryId || status) && (
                <Link href={pathname} className="font-semibold text-brand-700 underline">
                  필터 초기화
                </Link>
              )
            }
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-600" aria-live="polite">
              총 <strong className="text-ink-900">{programs.data.total}</strong>개
            </p>
            <ul className="border-t-2 border-ink-900">
              {programs.data.items.map((p) => (
                <li key={p.id}>
                  <ProgramRow program={p} categoryName={categoryName(p.categoryId)} />
                </li>
              ))}
            </ul>
            <Pagination
              page={page}
              total={programs.data.total}
              pageSize={PAGE_SIZE}
              hrefFor={(p) => hrefWith({ page: p })}
            />
          </>
        )}
      </div>
    </>
  );
}

export default function ProgramsPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <PageHeader
        title="프로그램"
        description="청소년활동·체육/교육·진로체험·꿈드림 프로그램을 찾아 신청하세요."
        actions={<ProgramViewToggle current="list" />}
      />
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <ProgramList />
      </Suspense>
    </div>
  );
}
