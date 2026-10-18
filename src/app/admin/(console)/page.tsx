'use client';

import { useQuery } from '@tanstack/react-query';
import { RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APPLICATION_STATUS, PUBLISH_STATUS } from '@/domain/labels';
import { can, type Permission } from '@/domain/permissions';
import type { DashboardSummary } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/format';

const PERIODS = [7, 30] as const;

interface Kpi {
  label: string;
  value: (d: DashboardSummary) => number;
  href: string;
  permission: Permission;
}

const KPIS: Kpi[] = [
  {
    label: '모집 중 프로그램',
    value: (d) => d.programsOpen,
    href: '/admin/programs?status=published',
    permission: 'program.write',
  },
  {
    label: '승인 대기 신청',
    value: (d) => d.applicationsSubmitted,
    href: '/admin/applications?status=submitted',
    permission: 'application.decide',
  },
  {
    label: '기간 내 신청',
    value: (d) => d.applicationsInPeriod,
    href: '/admin/applications',
    permission: 'application.decide',
  },
  {
    label: '동아리 가입 대기',
    value: (d) => d.clubApplicationsPending,
    href: '/admin/clubs/applications?status=pending',
    permission: 'club.manage',
  },
  {
    label: '공간 예약 대기',
    value: (d) => d.reservationsPending,
    href: '/admin/spaces?status=pending',
    permission: 'space.manage',
  },
  {
    label: '답변 대기 문의',
    value: (d) => d.inquiriesOpen,
    href: '/admin/inquiries?status=open',
    permission: 'inquiry.answer',
  },
  {
    label: '게시 공지',
    value: (d) => d.noticesPublished,
    href: '/admin/notices?status=published',
    permission: 'notice.write',
  },
];

function Dashboard() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(7);
  const { data: session } = useSession();
  const summary = useQuery({
    queryKey: ['admin', 'dashboard', period],
    queryFn: () => api.admin.dashboard(period),
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label="집계 기간" className="inline-flex border border-line-strong bg-surface">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                'min-h-11 px-4 text-[15px] font-semibold',
                period === p ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-surface-muted',
              )}
            >
              최근 {p}일
            </button>
          ))}
        </div>
        {summary.data && (
          <p className="text-sm text-ink-600 tabular-nums">
            갱신 시각{' '}
            <time dateTime={summary.data.generatedAt}>{formatDateTime(summary.data.generatedAt)}</time>
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="min-h-11"
          loading={summary.isFetching}
          onClick={() => void summary.refetch()}
        >
          {!summary.isFetching && <RotateCw aria-hidden className="size-4" />}
          새로고침
        </Button>
      </div>

      <QueryState query={summary}>
        {(d) => (
          <>
            <section aria-labelledby="kpi-title">
              <h2 id="kpi-title" className="sr-only">
                운영 현황
              </h2>
              <dl className="grid grid-cols-2 border-t border-l border-line bg-surface sm:grid-cols-3 xl:grid-cols-4">
                {KPIS.map((k) => (
                  <div key={k.label} className="flex flex-col border-r border-b border-line px-4 py-3">
                    <dt className="text-sm text-ink-600">
                      {k.label}
                      {k.label === '기간 내 신청' && ` (${period}일)`}
                    </dt>
                    <dd className="mt-1 text-3xl font-bold text-ink-900 tabular-nums">
                      {k.value(d).toLocaleString('ko-KR')}
                    </dd>
                    {can(session?.user, k.permission) && (
                      <dd className="mt-auto">
                        <Link
                          href={k.href}
                          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-700 hover:underline"
                        >
                          목록 보기<span className="sr-only">: {k.label}</span>
                        </Link>
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </section>

            <div className="mt-8 grid gap-8 xl:grid-cols-2">
              <section aria-labelledby="recent-apps">
                <h2 id="recent-apps" className="mb-2 border-b border-ink-900 pb-2 text-base font-bold">
                  최근 프로그램 신청
                </h2>
                {d.recentApplications.length === 0 ? (
                  <p className="py-6 text-[15px] text-ink-600">최근 신청이 없습니다.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {d.recentApplications.map((a) => (
                      <li key={a.id} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/applications/${a.id}`}
                            className="block truncate font-semibold hover:underline"
                          >
                            {a.applicantName} · {a.programTitle}
                          </Link>
                          <p className="text-sm text-ink-600 tabular-nums">{formatDateTime(a.createdAt)}</p>
                        </div>
                        <Badge tone={APPLICATION_STATUS[a.status].tone}>
                          {APPLICATION_STATUS[a.status].text}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section aria-labelledby="recent-notices">
                <h2 id="recent-notices" className="mb-2 border-b border-ink-900 pb-2 text-base font-bold">
                  최근 수정된 공지
                </h2>
                {d.recentNotices.length === 0 ? (
                  <p className="py-6 text-[15px] text-ink-600">공지가 없습니다.</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {d.recentNotices.map((n) => (
                      <li key={n.id} className="flex items-center gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/admin/notices/${n.id}`}
                            className="block truncate font-semibold hover:underline"
                          >
                            {n.title}
                          </Link>
                          <p className="text-sm text-ink-600 tabular-nums">{formatDate(n.updatedAt)}</p>
                        </div>
                        <Badge tone={PUBLISH_STATUS[n.status].tone}>{PUBLISH_STATUS[n.status].text}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </QueryState>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminPage title="대시보드" permission="admin.access">
      <Dashboard />
    </AdminPage>
  );
}
