'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/api';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { RESERVATION_MAX_DAYS_AHEAD, RESERVATION_MAX_HOURS } from '@/domain/space';

export default function SpacesPage() {
  const spaces = useQuery({ queryKey: ['spaces'], queryFn: () => api.spaces.list() });

  return (
    <div className="container-page py-6 md:py-10">
      <title>공간 예약 | 중구청소년센터</title>
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="공간 예약"
          description={`내일부터 ${RESERVATION_MAX_DAYS_AHEAD}일 이내, 1시간 단위로 최대 ${RESERVATION_MAX_HOURS}시간까지 신청할 수 있습니다. 담당자 확인 후 확정됩니다.`}
        />
        {spaces.isPending ? (
          <ListSkeleton rows={4} label="공간 불러오는 중" />
        ) : spaces.isError ? (
          <ErrorState error={spaces.error} onRetry={() => void spaces.refetch()} />
        ) : spaces.data.length === 0 ? (
          <EmptyState title="예약할 수 있는 공간이 없습니다" />
        ) : (
          <ul className="border-t-2 border-ink-900">
            {spaces.data.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/spaces/${s.id}`}
                  className="group grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-line py-4 active:bg-surface-muted"
                >
                  <span className="text-[15px] font-extrabold text-brand-700">{s.floor}</span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-bold group-hover:underline">{s.name}</span>
                    <span className="mt-0.5 block text-sm text-ink-600">
                      최대 {s.capacity}명 · {s.description}
                    </span>
                    {!s.reservable && (
                      <Badge tone="warning" className="mt-1">
                        예약 중지
                      </Badge>
                    )}
                  </span>
                  <ChevronRight aria-hidden className="size-5 text-ink-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
