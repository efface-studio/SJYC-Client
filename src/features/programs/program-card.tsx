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

function Deadline({ program }: { program: Program }) {
  if (program.recruitStatus === 'open') {
    const days = daysUntil(program.recruitEndsAt);
    return (
      <div className="program-deadline">
        <strong>{days <= 0 ? '오늘 마감' : `D-${days}`}</strong>
        <span>{formatShortDate(program.recruitEndsAt)} 마감</span>
      </div>
    );
  }
  return (
    <div className="program-deadline">
      <RecruitBadge program={program} />
      {program.recruitStatus === 'upcoming' && <span>{formatShortDate(program.recruitStartsAt)} 시작</span>}
    </div>
  );
}

export function ProgramRow({ program, categoryName }: { program: Program; categoryName: string }) {
  return (
    <Link href={`/programs/${program.id}`} className="program-row group">
      <div className="min-w-0">
        <p className="text-[13px] text-ink-600">
          {[categoryName, program.target].filter(Boolean).join(' · ')}
        </p>
        <h3 className="group-hover:underline">{program.title}</h3>
        <p className="line-clamp-1 text-sm text-ink-600">{program.summary}</p>
        {program.recruitStatus === 'open' && (
          <p className="mt-1 text-[13px] text-ink-600">
            잔여 <b className="text-ink-900">{remainingSeats(program)}석</b> / 정원 {program.capacity}명
          </p>
        )}
      </div>
      <Deadline program={program} />
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
