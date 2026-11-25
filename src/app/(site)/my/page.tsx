'use client';

import { ProfilePhoto } from '@/features/profile/profile-photo';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { NOTIFICATIONS_KEY } from '@/components/site/site-header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { APPLICATION_STATUS, CLUB_APPLICATION_STATUS, RESERVATION_STATUS } from '@/domain/labels';
import type { SpaceReservation } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { formatDate } from '@/lib/format';

function MyReservations() {
  const qc = useQueryClient();
  const toast = useToast();
  const [target, setTarget] = useState<SpaceReservation | null>(null);
  const reservations = useQuery({ queryKey: ['my-reservations'], queryFn: () => api.me.reservations() });
  const cancel = useMutation({
    mutationFn: (id: string) => api.me.cancelReservation(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['my-reservations'] });
      void qc.invalidateQueries({ queryKey: ['space-availability'] });
      toast.success('예약을 취소했습니다.');
      setTarget(null);
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      setTarget(null);
    },
  });

  return (
    <section id="reservations" aria-labelledby="reservations-title" className="mt-10 scroll-mt-24">
      <h2 id="reservations-title" className="mb-2 text-lg font-bold">
        공간 예약
      </h2>
      {reservations.isPending ? (
        <ListSkeleton rows={1} />
      ) : reservations.isError ? (
        <ErrorState error={reservations.error} onRetry={() => void reservations.refetch()} />
      ) : reservations.data.length === 0 ? (
        <EmptyState
          title="예약 내역이 없습니다"
          action={
            <Link href="/spaces" className={buttonClass({ variant: 'secondary' })}>
              공간 예약하기
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {reservations.data.map((r) => {
            const s = RESERVATION_STATUS[r.status];
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-4">
                <div className="min-w-0 flex-1">
                  <Badge tone={s.tone}>{s.text}</Badge>
                  <p className="mt-1 font-semibold">{r.spaceName}</p>
                  <p className="text-sm text-ink-600 tabular-nums">
                    {r.date} {r.startTime}–{r.endTime} · {r.headcount}명
                  </p>
                  {r.reason && <p className="mt-1 text-sm text-ink-700">사유: {r.reason}</p>}
                </div>
                {r.cancellable && (
                  <Button variant="secondary" size="sm" onClick={() => setTarget(r)}>
                    예약 취소
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={!!target}
        title="예약을 취소할까요?"
        description={target && `${target.spaceName} · ${target.date} ${target.startTime}–${target.endTime}`}
        confirmLabel="예약 취소"
        cancelLabel="유지"
        destructive
        loading={cancel.isPending}
        onConfirm={() => target && cancel.mutate(target.id)}
        onClose={() => setTarget(null)}
      />
      <p className="mt-6 text-[15px]">
        문의 내역은{' '}
        <Link href="/qna" className="font-semibold text-brand-700 underline">
          질문·문의
        </Link>
        에서 확인할 수 있습니다.
      </p>
    </section>
  );
}

export default function MyPage() {
  const { data: session } = useSession();
  const applications = useQuery({ queryKey: ['my-applications'], queryFn: () => api.me.applications() });
  const clubs = useQuery({ queryKey: ['my-clubs'], queryFn: () => api.me.clubs() });
  const clubApps = useQuery({ queryKey: ['my-club-applications'], queryFn: () => api.me.clubApplications() });
  const openClubApps = clubApps.data?.filter((a) => a.status !== 'approved') ?? [];
  const notifications = useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: () => api.me.notifications() });
  const unread = notifications.data?.filter((n) => n.readAt === null).length ?? 0;

  return (
    <>
      <title>마이페이지 | 중구청소년센터</title>
      <div className="flex items-center gap-3">
        {session && <ProfilePhoto userId={session.user.id} />}
        <p className="text-base">
          <strong>{session?.user.name}</strong>님, 안녕하세요.
        </p>
      </div>
      <Link
        href="/notifications"
        className="mt-3 mb-6 flex items-center gap-3 border-y border-line py-3 hover:bg-surface-muted"
      >
        <span className="flex-1 text-[15px] font-semibold">
          알림
          {unread > 0 && <span className="ml-2 text-brand-700 tabular-nums">읽지 않은 알림 {unread}개</span>}
        </span>
        <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-600" />
      </Link>
      {(session?.user.managedClubIds.length ?? 0) > 0 && (
        <Link
          href="/admin/my-clubs"
          className="-mt-3 mb-6 flex items-center gap-3 border-b border-line py-3 hover:bg-surface-muted"
        >
          <span className="flex-1 text-[15px] font-semibold">
            담당 동아리 운영
            <span className="ml-2 font-normal text-ink-600">회원·가입 신청·출석·소식 관리</span>
          </span>
          <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-600" />
        </Link>
      )}

      <section aria-labelledby="apps-title">
        <h2 id="apps-title" className="mb-2 text-lg font-bold">
          프로그램 신청 내역
        </h2>
        {applications.isPending ? (
          <ListSkeleton rows={2} />
        ) : applications.isError ? (
          <ErrorState error={applications.error} onRetry={() => void applications.refetch()} />
        ) : applications.data.length === 0 ? (
          <EmptyState
            title="신청한 프로그램이 없습니다"
            action={
              <Link href="/programs" className={buttonClass({ variant: 'secondary' })}>
                프로그램 둘러보기
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {applications.data.map((a) => {
              const s = APPLICATION_STATUS[a.status];
              return (
                <li key={a.id}>
                  <Link
                    href={`/my/applications/${a.id}`}
                    className="flex items-center gap-3 py-4 hover:bg-surface-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={s.tone}>{s.text}</Badge>
                        <span className="text-sm text-ink-600">{formatDate(a.createdAt)} 신청</span>
                      </div>
                      <p className="mt-1 truncate text-base font-semibold">{a.programTitle}</p>
                    </div>
                    <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-600" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <MyReservations />

      <section aria-labelledby="clubs-title" className="mt-10">
        <h2 id="clubs-title" className="mb-2 text-lg font-bold">
          내 동아리
        </h2>
        {clubs.isPending ? (
          <ListSkeleton rows={1} />
        ) : clubs.isError ? (
          <ErrorState error={clubs.error} onRetry={() => void clubs.refetch()} />
        ) : clubs.data.length === 0 ? (
          <EmptyState
            title="가입한 동아리가 없습니다"
            action={
              <Link href="/clubs" className={buttonClass({ variant: 'secondary' })}>
                동아리 둘러보기
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {clubs.data.map(({ club, role }) => (
              <li key={club.id}>
                <Link
                  href={`/clubs/${club.id}`}
                  className="flex items-center gap-3 py-4 hover:bg-surface-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{club.name}</p>
                    <p className="text-sm text-ink-600">{club.meetingInfo}</p>
                  </div>
                  {role === 'leader' && <Badge tone="brand">대표</Badge>}
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {openClubApps.length > 0 && (
          <>
            <h3 className="mt-6 mb-2 font-bold">동아리 가입 신청</h3>
            <ul className="divide-y divide-line border-y border-line">
              {openClubApps.map((a) => {
                const s = CLUB_APPLICATION_STATUS[a.status];
                return (
                  <li key={a.id} className="py-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={s.tone}>{s.text}</Badge>
                      <span className="text-sm text-ink-600">{formatDate(a.createdAt)} 신청</span>
                    </div>
                    <p className="mt-1 font-semibold">{a.clubName}</p>
                    {a.reason && <p className="mt-1 text-sm text-ink-700">사유: {a.reason}</p>}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
