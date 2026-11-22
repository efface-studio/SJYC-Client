'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarClock, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/api';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { DEMO_DATA } from '@/config/env';

export default function ClubsPage() {
  const clubs = useQuery({ queryKey: ['clubs'], queryFn: () => api.clubs.list() });

  return (
    <div className="container-page py-6 md:py-10">
      <title>동아리 | 중구청소년센터</title>
      <PageHeader
        className="directory-heading clubs-photo"
        title="동아리"
        description="센터에서 활동하는 청소년 동아리를 둘러보고 가입을 신청하세요."
      />
      {clubs.isPending ? (
        <ListSkeleton rows={3} label="동아리 불러오는 중" />
      ) : clubs.isError ? (
        <ErrorState error={clubs.error} onRetry={() => void clubs.refetch()} />
      ) : clubs.data.length === 0 ? (
        <EmptyState title="등록된 동아리가 없습니다" />
      ) : (
        <ul className="club-directory">
          {clubs.data.map((c) => (
            <li key={c.id}>
              <Link href={`/clubs/${c.id}`} className="club-entry group">
                {c.photos[0] && (
                  <img src={c.photos[0].url} alt="" loading="lazy" referrerPolicy="no-referrer" />
                )}
                <div className="min-w-0">
                  <h2 className="text-xl leading-snug font-bold group-hover:underline">{c.name}</h2>
                  <div className="my-1.5 flex flex-wrap items-center gap-2">
                    {c.recruiting ? (
                      <Badge tone="brand">가입 신청 가능</Badge>
                    ) : (
                      <Badge>현재 모집 없음</Badge>
                    )}
                    <span className="text-sm text-ink-600">{c.field}</span>
                  </div>

                  <p className="text-[15px] text-ink-600">{c.summary}</p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock aria-hidden className="size-4" />
                      {c.meetingInfo}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UsersRound aria-hidden className="size-4" />
                      {c.memberCount}명{DEMO_DATA && ' (데모)'}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
