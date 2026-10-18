'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Phone } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { api } from '@/api';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { CENTER, DESK_HOURS, hoursOn } from '@/config/center';
import { NoticeItem } from '@/features/notices/notice-item';
import { ProgramRow, useCategoryName } from '@/features/programs/program-card';
import { cn } from '@/lib/cn';

function Section({
  id,
  title,
  count,
  more,
  children,
  className,
}: {
  id: string;
  title: string;
  count?: number;
  more?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn('border-t-2 border-ink-900 pt-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={id} className="text-xl font-extrabold">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-base font-bold text-brand-700 tabular-nums">{count}</span>
          )}
        </h2>
        {more && (
          <Link
            href={more.href}
            className="flex min-h-11 items-center text-[15px] font-semibold text-ink-700 hover:underline"
          >
            {more.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function TodayStatus() {
  const now = new Date();
  const today = hoursOn(now);
  const date = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const desk = DESK_HOURS.find((d) => d.label === (today.weekday === '토' ? '토요일' : '평일'));

  return (
    <div className="border-b border-line">
      <div className="container-page flex flex-col gap-3 py-5 md:flex-row md:items-end md:justify-between md:py-7">
        <div suppressHydrationWarning>
          <p className="text-[15px] font-semibold text-ink-600">
            {date} {today.weekday}요일 · 오늘
          </p>
          <p className="mt-1 text-[26px] leading-tight font-extrabold tracking-tight tabular-nums md:text-[32px]">
            {today.open ? (
              <>
                {today.hours} <span className="text-brand-700">운영</span>
              </>
            ) : (
              <span className="text-danger-700">{today.hours}</span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-600">
            {desk && today.weekday !== '일' ? `안내데스크 ${desk.value} · ` : ''}공휴일·임시 휴관은 공지를
            확인해 주세요.
          </p>
        </div>
        <a
          href={`tel:${CENTER.tel}`}
          className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-semibold text-ink-900 underline underline-offset-4 md:self-auto"
        >
          <Phone aria-hidden className="size-4" />
          {CENTER.telDisplay}
        </a>
      </div>
    </div>
  );
}

const INDEX = [
  { href: '/spaces', title: '공간 예약', desc: '체육관·스터디룸·뮤직스튜디오 등 센터 공간 예약 신청' },
  { href: '/clubs', title: '동아리', desc: '활동 중인 청소년 동아리 둘러보기와 가입 신청' },
  { href: '/programs/calendar', title: '프로그램 일정', desc: '모집 마감일과 운영 기간을 달력으로 보기' },
  { href: '/gallery', title: '센터 소식 · 갤러리', desc: '센터 공식 채널의 행사 사진과 영상' },
  { href: '/qna', title: '질문 · 문의', desc: '자주 묻는 질문과 1:1 문의' },
  { href: '/about', title: '센터 안내', desc: '운영시간, 오시는 길, 층별 안내' },
];

export default function HomePage() {
  const programs = useQuery({
    queryKey: ['programs', { recruitStatus: 'open', pageSize: 5 }],
    queryFn: () => api.programs.list({ recruitStatus: 'open', pageSize: 5 }),
  });
  const notices = useQuery({
    queryKey: ['notices', { pageSize: 5 }],
    queryFn: () => api.notices.list({ pageSize: 5 }),
  });
  const categoryName = useCategoryName();

  return (
    <>
      <h1 className="sr-only">{CENTER.formalName}</h1>
      <TodayStatus />

      <div className="container-page grid gap-10 py-8 lg:grid-cols-[1fr_380px] lg:gap-14 lg:py-12">
        <Section
          id="programs-title"
          title="모집 중인 프로그램"
          count={programs.data?.total}
          more={{ href: '/programs', label: '전체 프로그램' }}
        >
          {programs.isPending ? (
            <ListSkeleton rows={3} />
          ) : programs.isError ? (
            <ErrorState error={programs.error} onRetry={() => void programs.refetch()} />
          ) : programs.data.items.length === 0 ? (
            <EmptyState
              title="지금 모집 중인 프로그램이 없습니다"
              description="모집 예정 프로그램은 전체 프로그램에서 확인할 수 있습니다."
            />
          ) : (
            <ul>
              {programs.data.items.map((p) => (
                <li key={p.id}>
                  <ProgramRow program={p} categoryName={categoryName(p.categoryId)} />
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="space-y-10">
          <Section id="notices-title" title="공지사항" more={{ href: '/notices', label: '전체 공지' }}>
            {notices.isPending ? (
              <ListSkeleton rows={3} />
            ) : notices.isError ? (
              <ErrorState error={notices.error} onRetry={() => void notices.refetch()} />
            ) : notices.data.items.length === 0 ? (
              <EmptyState title="등록된 공지가 없습니다" />
            ) : (
              <ul>
                {notices.data.items.map((n) => (
                  <NoticeItem key={n.id} notice={n} />
                ))}
              </ul>
            )}
          </Section>

          <Section id="index-title" title="센터 이용">
            <ul>
              {INDEX.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-center justify-between gap-4 border-b border-line py-4 active:bg-surface-muted"
                  >
                    <span>
                      <span className="block text-[17px] font-bold group-hover:underline">{item.title}</span>
                      <span className="mt-0.5 block text-sm text-ink-600">{item.desc}</span>
                    </span>
                    <ArrowRight aria-hidden className="size-5 shrink-0 text-ink-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}
