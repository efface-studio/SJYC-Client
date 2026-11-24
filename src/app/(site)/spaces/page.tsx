'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/api';
import { Badge } from '@/components/ui/badge';
import { SpacePhoto } from '@/components/site/space-photo';
import { DirectorySkeleton } from '@/components/site/directory-skeleton';
import { DirectoryIntro } from '@/components/site/directory-intro';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { FLOORS } from '@/config/center';
import type { Space } from '@/domain/types';
import { RESERVATION_MAX_DAYS_AHEAD, RESERVATION_MAX_HOURS } from '@/domain/space';

export default function SpacesPage() {
  const spaces = useQuery({ queryKey: ['spaces'], queryFn: () => api.spaces.list() });

  const spacesByFloor = new Map<string, Space[]>();
  for (const space of spaces.data ?? []) {
    const group = spacesByFloor.get(space.floor);
    if (group) group.push(space);
    else spacesByFloor.set(space.floor, [space]);
  }
  const floors = [...new Set([...FLOORS.map((f) => f.floor), ...spacesByFloor.keys()])].filter((floor) =>
    spacesByFloor.has(floor),
  );

  return (
    <div className="directory-page directory-spaces">
      <title>공간 예약 | 중구청소년센터</title>
      <DirectoryIntro kind="spaces" />
      <div id="directory-content" className="directory-content">
        <div className="directory-toolbar">
          <h2>층별 공간</h2>
        </div>
        <p className="reservation-rule">
          내일부터 {RESERVATION_MAX_DAYS_AHEAD}일 이내 · 1시간 단위 · 최대 {RESERVATION_MAX_HOURS}시간 ·
          담당자 확인 후 확정
        </p>
        {spaces.isPending ? (
          <DirectorySkeleton kind="spaces" />
        ) : spaces.isError ? (
          <ErrorState error={spaces.error} onRetry={() => void spaces.refetch()} />
        ) : spaces.data.length === 0 ? (
          <EmptyState title="예약할 수 있는 공간이 없습니다" />
        ) : (
          <div>
            {floors.map((floor) => (
              <section key={floor} aria-label={floor} className="space-floor">
                <h2>{floor}</h2>
                <ul>
                  {spacesByFloor.get(floor)?.map((s) => (
                    <li key={s.id}>
                      <Link href={`/spaces/${s.id}`} className="space-row group">
                        <SpacePhoto space={s} thumbnail />
                        <span className="min-w-0 flex-1">
                          <span className="block text-lg font-bold group-hover:underline">{s.name}</span>
                          <span className="mt-1 block text-sm text-ink-600">
                            최대 {s.capacity}명 · {s.description}
                          </span>
                          {!s.reservable && (
                            <Badge tone="warning" className="mt-1">
                              예약 중지
                            </Badge>
                          )}
                        </span>
                        <ChevronRight size={18} aria-hidden className="shrink-0 text-ink-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
