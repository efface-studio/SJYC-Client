'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/api';
import { Badge } from '@/components/ui/badge';
import { RECRUIT_STATUS } from '@/domain/labels';
import { remainingSeats } from '@/domain/program';
import type { Program } from '@/domain/types';
import { cn } from '@/lib/cn';
import { daysUntil, formatShortDate } from '@/lib/format';

export function useCategories() {
  return useQuery({
    queryKey: ['program-categories'],
    queryFn: () => api.programs.categories(),
    staleTime: 10 * 60_000,
  });
}

export function useCategoryName(): (id: string) => string {
  const { data } = useCategories();
  return (id) => data?.find((c) => c.id === id)?.name ?? '';
}

export function RecruitBadge({ program }: { program: Pick<Program, 'recruitStatus'> }) {
  const s = RECRUIT_STATUS[program.recruitStatus];
  return <Badge tone={s.tone}>{s.text}</Badge>;
}

/** 왼쪽 일정 열: 모집 중이면 마감까지 D-day, 예정이면 접수 시작일, 그 외는 상태 */
function DateColumn({ program }: { program: Program }) {
  if (program.recruitStatus === 'open') {
    const d = daysUntil(program.recruitEndsAt);
    return (
      <>
        <span className="text-[26px] leading-none font-extrabold tracking-tight text-brand-700 tabular-nums">
          {d <= 0 ? '오늘' : `D-${d}`}
        </span>
        <span className="mt-1.5 text-xs text-ink-600 tabular-nums">
          {formatShortDate(program.recruitEndsAt)} 마감
        </span>
      </>
    );
  }
  if (program.recruitStatus === 'upcoming') {
    return (
      <>
        <span className="text-[17px] leading-tight font-bold text-info-700 tabular-nums">
          {formatShortDate(program.recruitStartsAt)}
        </span>
        <span className="mt-1 text-xs text-ink-600">접수 시작</span>
      </>
    );
  }
  return (
    <span className="text-[15px] font-bold text-ink-600">{RECRUIT_STATUS[program.recruitStatus].text}</span>
  );
}

export function ProgramRow({ program, categoryName }: { program: Program; categoryName: string }) {
  const muted = program.recruitStatus === 'closed' || program.recruitStatus === 'full';
  return (
    <Link
      href={`/programs/${program.id}`}
      className="group grid grid-cols-[76px_1fr] gap-4 border-b border-line py-4 active:bg-surface-muted md:grid-cols-[96px_1fr] md:px-2"
    >
      <div className="flex flex-col items-start pt-0.5">
        <DateColumn program={program} />
      </div>
      <div className="min-w-0">
        <p className="text-[13px] text-ink-600">
          {categoryName}
          {categoryName && ' · '}
          {program.target}
        </p>
        <h3
          className={cn(
            'mt-0.5 text-[17px] leading-snug font-bold group-hover:underline',
            muted ? 'text-ink-600' : 'text-ink-900',
          )}
        >
          {program.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-[15px] text-ink-600">{program.summary}</p>
        {program.recruitStatus === 'open' && (
          <p className="mt-1.5 text-[13px] font-semibold text-ink-700 tabular-nums">
            잔여 {remainingSeats(program)}석{' '}
            <span className="font-normal text-ink-600">/ 정원 {program.capacity}명</span>
          </p>
        )}
      </div>
    </Link>
  );
}

const VIEWS = [
  { key: 'list', href: '/programs', label: '목록' },
  { key: 'calendar', href: '/programs/calendar', label: '달력' },
] as const;

/** 프로그램 목록 ↔ 일정 달력 전환 */
export function ProgramViewToggle({ current }: { current: (typeof VIEWS)[number]['key'] }) {
  return (
    <nav aria-label="보기 방식">
      <ul className="flex border-b border-line">
        {VIEWS.map((v) => (
          <li key={v.key}>
            <Link
              href={v.href}
              aria-current={v.key === current ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center border-b-2 px-4 text-[15px] font-semibold',
                v.key === current ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
              )}
            >
              {v.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
