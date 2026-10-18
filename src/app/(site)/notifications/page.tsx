'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api, errorMessage } from '@/api';
import { NOTIFICATIONS_KEY } from '@/components/site/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { NOTIFICATION_KIND_LABEL } from '@/domain/labels';
import { RequireAuth } from '@/features/auth/guards';
import { formatDateTime } from '@/lib/format';

function NotificationList() {
  const qc = useQueryClient();
  const toast = useToast();
  const list = useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: () => api.me.notifications() });
  const markRead = useMutation({
    mutationFn: (ids?: string[]) => api.me.markNotificationsRead(ids),
    onSettled: () => void qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (list.isPending) return <ListSkeleton rows={3} label="알림 불러오는 중" />;
  if (list.isError) return <ErrorState error={list.error} onRetry={() => void list.refetch()} />;
  if (list.data.length === 0) {
    return (
      <EmptyState
        title="받은 알림이 없습니다"
        description="프로그램 신청·공간 예약·동아리 가입·문의가 처리되면 여기에서 알려 드립니다."
      />
    );
  }

  const unread = list.data.filter((n) => n.readAt === null).length;
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-600" aria-live="polite">
          읽지 않은 알림 <strong className="text-ink-900 tabular-nums">{unread}</strong>개
        </p>
        <Button
          variant="secondary"
          size="sm"
          disabled={unread === 0}
          loading={markRead.isPending && markRead.variables === undefined}
          onClick={() => markRead.mutate(undefined)}
        >
          모두 읽음으로 표시
        </Button>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {list.data.map((n) => (
          <li key={n.id}>
            <Link
              href={n.link}
              onClick={() => n.readAt === null && markRead.mutate([n.id])}
              className="block py-4 hover:bg-surface-muted md:px-2"
            >
              <span className="flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                {n.readAt === null && <Badge tone="brand">새 알림</Badge>}
                <span>{NOTIFICATION_KIND_LABEL[n.kind]}</span>
                <time dateTime={n.createdAt} className="tabular-nums">
                  {formatDateTime(n.createdAt)}
                </time>
              </span>
              <span
                className={
                  n.readAt === null
                    ? 'mt-1 block text-base font-bold text-ink-900'
                    : 'mt-1 block text-base font-semibold text-ink-700'
                }
              >
                {n.title}
              </span>
              <span className="mt-0.5 block text-[15px] text-ink-600">{n.body}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default function NotificationsPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <title>알림 | 중구청소년센터</title>
        <PageHeader title="알림" description="신청·예약·가입·문의 처리 결과를 알려 드립니다." />
        <RequireAuth>
          <NotificationList />
        </RequireAuth>
      </div>
    </div>
  );
}
