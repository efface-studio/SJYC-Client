'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  MessageCircle,
  UsersRound,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  RotateCw,
} from 'lucide-react';
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
    icon: ClipboardList,
  },
  {
    key: 'clubApplicationsPending',
    label: '동아리 가입',
    href: '/admin/clubs/applications?status=pending',
    permission: 'club.manage',
    icon: UsersRound,
  },
  {
    key: 'reservationsPending',
    label: '공간 예약',
    href: '/admin/spaces?status=pending',
    permission: 'space.manage',
    icon: CalendarCheck,
  },
  {
    key: 'inquiriesOpen',
    label: '문의 답변',
    href: '/admin/inquiries?status=open',
    permission: 'inquiry.answer',
    icon: MessageCircle,
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
  const available = QUEUES.filter((queue) => can(user, queue.permission));
  const [choice, setChoice] = useState<(typeof QUEUES)[number]['key']>();
  const active = available.find((queue) => queue.key === choice) ?? available[0];
  const query = useQuery({
    queryKey: ['admin', 'inbox', user?.id, active?.key],
    enabled: !!active,
    queryFn: async () => {
      const paging = { page: 1, pageSize: 5 };
      switch (active?.key) {
        case 'applicationsSubmitted':
          return (await api.admin.applications.list({ ...paging, status: 'submitted' })).items.map((a) => ({
            id: a.id,
            title: a.programTitle,
            note: a.applicantName,
            at: a.createdAt,
            href: '/admin/applications/' + a.id,
          }));
        case 'clubApplicationsPending':
          return (await api.admin.clubs.applications({ ...paging, status: 'pending' })).items.map((a) => ({
            id: a.id,
            title: a.clubName,
            note: a.applicantName,
            at: a.createdAt,
            href: '/admin/clubs/applications?status=pending&q=' + encodeURIComponent(a.applicantName),
          }));
        case 'reservationsPending':
          return (await api.admin.spaces.reservations({ ...paging, status: 'pending' })).items.map((a) => ({
            id: a.id,
            title: a.spaceName,
            note: a.applicantName + ' · ' + a.startTime + '–' + a.endTime,
            at: a.createdAt,
            href:
              '/admin/spaces?status=pending&date=' +
              encodeURIComponent(a.date) +
              '&spaceId=' +
              encodeURIComponent(a.spaceId),
          }));
        case 'inquiriesOpen':
          return (await api.admin.inquiries.list({ ...paging, status: 'open' })).items.map((a) => ({
            id: a.id,
            title: a.title,
            note: a.authorName,
            at: a.createdAt,
            href: '/admin/inquiries/' + a.id,
          }));
        default:
          return [];
      }
    },
  });
  if (!active) return null;
  const total = available.reduce((sum, q) => sum + data[q.key], 0);
  return (
    <section className="inbox" aria-labelledby="queue-heading">
      <div className="inbox-summary">
        <h2 id="queue-heading">처리 대기</h2>
        <p className="inbox-total">
          {total.toLocaleString('ko-KR')}
          <small>건</small>
        </p>
        <div role="group" aria-label="대기 업무 선택" className="inbox-folders">
          {available.map((q) => (
            <button
              type="button"
              key={q.key}
              aria-pressed={q.key === active.key}
              onClick={() => setChoice(q.key)}
            >
              <q.icon aria-hidden size={17} />
              <span>{q.label}</span>
              <b>{data[q.key]}</b>
            </button>
          ))}
        </div>
      </div>
      <div className="inbox-content">
        <div className="inbox-head">
          <h3>{active.label}</h3>
          <Link href={active.href}>
            전체 보기 <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
        <QueryState query={query} rows={3}>
          {(rows) =>
            rows.length ? (
              <ul className="inbox-records">
                {rows.map((row) => (
                  <li key={row.id}>
                    <Link href={row.href}>
                      <div>
                        <strong>{row.title}</strong>
                        <span>{row.note}</span>
                      </div>
                      <time dateTime={row.at}>{formatDate(row.at)}</time>
                      <ChevronRight size={16} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="inbox-empty">처리를 기다리는 {active.label} 내역이 없습니다.</p>
            )
          }
        </QueryState>
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
  const cache = useQueryClient();
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
      view="inbox"
      title="업무 인박스"
      docTitle="대시보드"
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
            onClick={() => {
              void summary.refetch();
              void cache.invalidateQueries({ queryKey: ['admin', 'inbox'] });
            }}
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
            <section className="dash-panel overview-stats" aria-labelledby="stats-heading">
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
