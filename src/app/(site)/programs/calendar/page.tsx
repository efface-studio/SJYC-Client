'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/api';
import { PageHeader } from '@/components/ui/page-header';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import type { Program } from '@/domain/types';
import { ProgramViewToggle, RecruitBadge } from '@/features/programs/program-card';
import { isMonth, monthGrid, programsOn, shiftMonth } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import { formatPeriod, todayKst } from '@/lib/format';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const monthLabel = (month: string) => `${month.slice(0, 4)}년 ${Number(month.slice(5))}월`;
const dayLabel = (date: string) =>
  `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일 (${WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()]})`;

function AgendaList({ title, programs, empty }: { title: string; programs: Program[]; empty: string }) {
  return (
    <section className="mt-5">
      <h3 className="text-[15px] font-bold">
        {title} <span className="text-brand-700 tabular-nums">{programs.length}</span>
      </h3>
      {programs.length === 0 ? (
        <p className="mt-2 text-[15px] text-ink-600">{empty}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {programs.map((p) => (
            <li key={p.id}>
              <Link href={`/programs/${p.id}`} className="block py-3 hover:bg-surface-muted md:px-2">
                <RecruitBadge program={p} />
                <span className="mt-1 block font-semibold">{p.title}</span>
                <span className="block text-sm text-ink-600 tabular-nums">
                  운영 {formatPeriod(p.startsAt, p.endsAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CalendarView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const today = todayKst();
  const rawMonth = params.get('month');
  const month = isMonth(rawMonth) ? rawMonth : today.slice(0, 7);
  const rawDate = params.get('date') ?? '';
  const selected =
    DATE_RE.test(rawDate) && rawDate.startsWith(month)
      ? rawDate
      : today.startsWith(month)
        ? today
        : `${month}-01`;

  // ponytail: 게시된 프로그램을 한 번에 받는다 (최대 100개). 늘어나면 서버에 기간(from·to) 조회를 추가한다.
  const programs = useQuery({
    queryKey: ['programs', { pageSize: 100 }],
    queryFn: () => api.programs.list({ pageSize: 100 }),
  });

  const href = (m: string, d?: string) => `${pathname}?month=${m}${d ? `&date=${d}` : ''}`;
  const items = programs.data?.items ?? [];
  const day = programsOn(selected, items);

  return (
    <>
      <div className="flex items-center justify-between gap-2 border-t-2 border-ink-900 pt-3">
        <Link
          href={href(shiftMonth(month, -1))}
          aria-label={`이전 달 (${monthLabel(shiftMonth(month, -1))})`}
          className="flex size-11 items-center justify-center rounded-md hover:bg-surface-muted"
        >
          <ChevronLeft aria-hidden className="size-6" />
        </Link>
        <h2 className="text-xl font-extrabold tabular-nums" aria-live="polite">
          {monthLabel(month)}
        </h2>
        <Link
          href={href(shiftMonth(month, 1))}
          aria-label={`다음 달 (${monthLabel(shiftMonth(month, 1))})`}
          className="flex size-11 items-center justify-center rounded-md hover:bg-surface-muted"
        >
          <ChevronRight aria-hidden className="size-6" />
        </Link>
      </div>
      {month !== today.slice(0, 7) && (
        <p className="text-center">
          <Link href={pathname} className="inline-flex min-h-11 items-center text-sm font-semibold underline">
            이번 달로 이동
          </Link>
        </p>
      )}

      {programs.isError ? (
        <ErrorState error={programs.error} onRetry={() => void programs.refetch()} />
      ) : (
        <>
          <table className="mt-2 w-full table-fixed border-collapse" aria-busy={programs.isPending}>
            <caption className="sr-only">
              {monthLabel(month)} 프로그램 일정 — 날짜를 선택하면 아래에 목록이 표시됩니다
            </caption>
            <thead>
              <tr>
                {WEEKDAYS.map((w, i) => (
                  <th
                    key={w}
                    scope="col"
                    abbr={`${w}요일`}
                    className={cn(
                      'border-b border-line py-2 text-sm font-semibold',
                      i === 0 ? 'text-danger-700' : 'text-ink-600',
                    )}
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(month).map((week) => (
                <tr key={week[0]}>
                  {week.map((date) => {
                    const inMonth = date.startsWith(month);
                    if (!inMonth) {
                      return (
                        <td key={date} className="h-14 border-b border-line align-top md:h-28">
                          <span aria-hidden className="block p-1 text-sm text-ink-600/50 tabular-nums">
                            {Number(date.slice(8))}
                          </span>
                        </td>
                      );
                    }
                    const { deadline, running } = programsOn(date, items);
                    const isToday = date === today;
                    const isSelected = date === selected;
                    return (
                      <td key={date} className="h-14 border-b border-line p-0 align-top md:h-28">
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          aria-current={isToday ? 'date' : undefined}
                          aria-label={`${dayLabel(date)}${isToday ? ' 오늘' : ''}, 모집 마감 ${deadline.length}건, 운영 ${running.length}건`}
                          onClick={() => router.replace(href(month, date), { scroll: false })}
                          className={cn(
                            'flex size-full flex-col items-stretch gap-0.5 p-1 text-left hover:bg-surface-muted',
                            isSelected && 'bg-brand-50 outline-2 -outline-offset-2 outline-ink-900',
                          )}
                        >
                          <span
                            className={cn(
                              'self-start px-0.5 text-sm tabular-nums',
                              isToday
                                ? 'border-b-2 border-brand-500 font-extrabold text-brand-700'
                                : 'font-semibold',
                            )}
                          >
                            {Number(date.slice(8))}
                          </span>
                          {/* 모바일: 표식만 */}
                          <span aria-hidden className="flex gap-0.5 md:hidden">
                            {deadline.length > 0 && <span className="h-1 flex-1 bg-brand-500" />}
                            {running.length > 0 && <span className="h-1 flex-1 bg-info-700/60" />}
                          </span>
                          {/* 데스크톱: 마감 프로그램명 + 운영 건수 */}
                          <span aria-hidden className="hidden min-w-0 flex-col gap-0.5 text-xs md:flex">
                            {deadline.slice(0, 2).map((p) => (
                              <span key={p.id} className="truncate font-semibold text-brand-700">
                                마감 · {p.title}
                              </span>
                            ))}
                            {deadline.length > 2 && (
                              <span className="text-brand-700">마감 외 {deadline.length - 2}건</span>
                            )}
                            {running.length > 0 && (
                              <span className="text-info-700">운영 {running.length}건</span>
                            )}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 flex gap-4 text-xs text-ink-600">
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-1 w-4 bg-brand-500" />
              모집 마감
            </span>
            <span className="inline-flex items-center gap-1">
              <span aria-hidden className="h-1 w-4 bg-info-700/60" />
              운영 기간
            </span>
          </p>

          <section aria-labelledby="agenda-title" className="mt-8">
            <h2 id="agenda-title" className="text-lg font-bold">
              {dayLabel(selected)} 일정
            </h2>
            {programs.isPending ? (
              <ListSkeleton rows={2} />
            ) : (
              <>
                <AgendaList
                  title="모집 마감"
                  programs={day.deadline}
                  empty="이 날 마감되는 모집이 없습니다."
                />
                <AgendaList
                  title="운영 중"
                  programs={day.running}
                  empty="이 날 운영되는 프로그램이 없습니다."
                />
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}

export default function ProgramCalendarPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <title>프로그램 일정 | 중구청소년센터</title>
      <PageHeader
        breadcrumbs={[{ label: '프로그램', href: '/programs' }, { label: '일정 달력' }]}
        title="프로그램 일정"
        description="모집 마감일과 운영 기간을 달력으로 확인하세요."
        actions={<ProgramViewToggle current="calendar" />}
      />
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <CalendarView />
      </Suspense>
    </div>
  );
}
