'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronRight, ClipboardList, FileText, RotateCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { Skeleton } from '@/components/ui/states';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { APPLICATION_STATUS, PUBLISH_STATUS } from '@/domain/labels';
import { can, managesAnyClub } from '@/domain/permissions';
import type { DashboardSummary, User } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { formatDate, formatDateTime } from '@/lib/format';

const QUEUES = [
  {
    key: 'applicationsSubmitted',
    label: '프로그램 신청',
    href: '/admin/applications?status=submitted',
    permission: 'application.decide',
    color: '#346dda',
  },
  {
    key: 'clubApplicationsPending',
    label: '동아리 가입',
    href: '/admin/clubs/applications?status=pending',
    permission: 'club.manage',
    color: '#56a9cd',
  },
  {
    key: 'reservationsPending',
    label: '공간 예약',
    href: '/admin/spaces?status=pending',
    permission: 'space.manage',
    color: '#7a76b6',
  },
  {
    key: 'inquiriesOpen',
    label: '문의 답변',
    href: '/admin/inquiries?status=open',
    permission: 'inquiry.answer',
    color: '#e3a156',
  },
] as const;

function DrillDown({ href, allowed, children }: { href: string; allowed: boolean; children: ReactNode }) {
  return allowed ? (
    <Link className="dash-row" href={href}>
      {children}
      <ChevronRight size={16} aria-hidden />
    </Link>
  ) : (
    <div className="dash-row">{children}</div>
  );
}

function WorkQueue({ data, user }: { data: DashboardSummary; user: User | undefined }) {
  const total = QUEUES.reduce((sum, q) => sum + data[q.key], 0);
  let offset = 0;
  return (
    <section className="dash-panel" aria-labelledby="queue-heading">
      <h2 id="queue-heading">처리 대기 업무</h2>
      <div className="queue-body">
        <div className="queue-chart">
          <svg aria-hidden="true" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r="48" fill="none" stroke="#e9edf2" strokeWidth="10" />
            {total > 0 &&
              QUEUES.map((q) => {
                const share = (data[q.key] / total) * 100;
                const start = offset;
                offset += share;
                if (share === 0) return null;
                const gap = share === 100 ? 0 : Math.min(1.4, share / 4);
                return (
                  <circle
                    key={q.key}
                    cx="56"
                    cy="56"
                    r="48"
                    pathLength="100"
                    fill="none"
                    stroke={q.color}
                    strokeWidth="10"
                    strokeDasharray={`${share - gap} ${100 - share + gap}`}
                    strokeDashoffset={-start}
                    transform="rotate(-90 56 56)"
                  />
                );
              })}
          </svg>
          <div className="queue-total">
            <span>전체 대기</span>
            <strong>
              {total.toLocaleString('ko-KR')}
              <small>건</small>
            </strong>
          </div>
        </div>
        <ul className="queue-legend">
          {QUEUES.map((q) => (
            <li key={q.key}>
              <DrillDown href={q.href} allowed={can(user, q.permission)}>
                <span className="queue-dot" aria-hidden style={{ backgroundColor: q.color }} />
                <span className="grow">{q.label}</span>
                <b>
                  {data[q.key].toLocaleString('ko-KR')}
                  <small>건</small>
                </b>
              </DrillDown>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function RecentHeading({ title, href, allowed }: { title: string; href: string; allowed: boolean }) {
  return (
    <div className="dash-section-heading">
      <h2>{title}</h2>
      {allowed && (
        <Link href={href} aria-label={`${title} 전체 보기`}>
          전체 보기
        </Link>
      )}
    </div>
  );
}

function Dashboard() {
  const [period, setPeriod] = useState<7 | 30>(7);
  const { data: session } = useSession();
  const summary = useQuery({
    queryKey: ['admin', 'dashboard', period],
    queryFn: async () => ({ ...(await api.admin.dashboard(period)), period }),
    placeholderData: keepPreviousData,
  });
  const user = session?.user;
  const stats = [
    {
      key: 'applicationsInPeriod',
      label: `최근 ${summary.data?.period ?? period}일 프로그램 신청`,
      unit: '건',
      icon: ClipboardList,
      href: '/admin/applications',
      permission: 'application.decide',
    },
    {
      key: 'programsOpen',
      label: '모집 중인 프로그램',
      unit: '개',
      icon: CalendarDays,
      href: '/admin/programs?status=published',
      permission: 'program.write',
    },
    {
      key: 'noticesPublished',
      label: '게시 중인 공지',
      unit: '건',
      icon: FileText,
      href: '/admin/notices?status=published',
      permission: 'notice.write',
    },
  ] as const;
  return (
    <AdminPage
      title="대시보드"
      permission="admin.access"
      actions={
        <div className="flex flex-wrap items-center gap-x-3">
          {summary.data && (
            <time className="text-sm text-ink-600 tabular-nums" dateTime={summary.data.generatedAt}>
              {formatDateTime(summary.data.generatedAt)} 기준
            </time>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="min-h-11"
            loading={summary.isFetching}
            onClick={() => void summary.refetch()}
          >
            {!summary.isFetching && <RotateCw size={15} aria-hidden />}새로고침
          </Button>
        </div>
      }
    >
      <QueryState query={summary} loading={<DashboardSkeleton />}>
        {(d) => (
          <div className="dashboard-grid">
            <WorkQueue data={d} user={user} />
            <section className="dash-panel" aria-labelledby="stats-heading">
              <div className="dash-section-heading">
                <h2 id="stats-heading">운영 현황</h2>
                <div role="group" aria-label="집계 기간" className="period-switch">
                  {([7, 30] as const).map((p) => (
                    <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
                      최근 {p}일
                    </button>
                  ))}
                </div>
              </div>
              <ul className="stats-list">
                {stats.map(({ key, label, unit, icon: Icon, href, permission }) => (
                  <li key={key}>
                    <DrillDown href={href} allowed={can(user, permission)}>
                      <Icon size={18} aria-hidden />
                      <span className="grow">{label}</span>
                      <b>
                        {d[key].toLocaleString('ko-KR')}
                        <small>{unit}</small>
                      </b>
                    </DrillDown>
                  </li>
                ))}
              </ul>
            </section>
            <section className="dash-panel recent-panel" aria-label="최근 프로그램 신청">
              <RecentHeading
                title="최근 프로그램 신청"
                href="/admin/applications"
                allowed={can(user, 'application.decide')}
              />
              {!d.recentApplications.length ? (
                <p className="dash-empty">최근 신청이 없습니다.</p>
              ) : (
                <table className="recent-table">
                  <caption className="sr-only">최근 프로그램 신청 내역</caption>
                  <thead>
                    <tr>
                      <th scope="col">프로그램</th>
                      <th scope="col">신청자</th>
                      <th scope="col" className="date-col">
                        신청 일시
                      </th>
                      <th scope="col">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recentApplications.map((a) => (
                      <tr key={a.id}>
                        <td>
                          {can(user, 'application.decide') ? (
                            <Link href={`/admin/applications/${a.id}`}>{a.programTitle}</Link>
                          ) : (
                            a.programTitle
                          )}
                          <time dateTime={a.createdAt} className="row-date">
                            {formatDateTime(a.createdAt)}
                          </time>
                        </td>
                        <td>{a.applicantName}</td>
                        <td className="date-col">
                          <time dateTime={a.createdAt}>{formatDateTime(a.createdAt)}</time>
                        </td>
                        <td>
                          <Badge tone={APPLICATION_STATUS[a.status].tone}>
                            {APPLICATION_STATUS[a.status].text}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
            <section className="dash-panel recent-panel" aria-label="최근 수정된 공지">
              <RecentHeading
                title="최근 수정된 공지"
                href="/admin/notices"
                allowed={can(user, 'notice.write')}
              />
              {!d.recentNotices.length ? (
                <p className="dash-empty">공지가 없습니다.</p>
              ) : (
                <ul className="dash-notices">
                  {d.recentNotices.map((n) => (
                    <li key={n.id}>
                      <div className="min-w-0">
                        <p>
                          {can(user, 'notice.write') ? (
                            <Link href={`/admin/notices/${n.id}`}>{n.title}</Link>
                          ) : (
                            n.title
                          )}
                        </p>
                        <time dateTime={n.updatedAt}>{formatDate(n.updatedAt)}</time>
                      </div>
                      <Badge tone={PUBLISH_STATUS[n.status].tone}>{PUBLISH_STATUS[n.status].text}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </QueryState>
    </AdminPage>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="운영 현황 불러오는 중" className="dashboard-grid">
      {[4, 3].map((rows) => (
        <div key={rows} className="dash-panel" aria-hidden="true">
          <Skeleton className="mb-4 h-6 w-28" />
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="dash-row">
              <Skeleton className="size-5" />
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="ml-auto h-4 w-8" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const managerOnly = !!session && !can(session.user, 'admin.access') && managesAnyClub(session.user);
  useEffect(() => {
    if (managerOnly) router.replace('/admin/my-clubs');
  }, [managerOnly, router]);
  if (managerOnly) return null;
  return <Dashboard />;
}
