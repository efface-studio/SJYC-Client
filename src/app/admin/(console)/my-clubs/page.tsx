'use client';

import Link from 'next/link';
import { AdminPage } from '@/components/admin/admin-page';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/states';
import { managesAnyClub } from '@/domain/permissions';
import { useManagedClubs } from '@/features/club-ops/club-ops';

function MyClubs() {
  const clubs = useManagedClubs();
  return (
    <QueryState query={clubs}>
      {(list) =>
        list.length === 0 ? (
          <EmptyState title="운영하는 동아리가 없습니다" />
        ) : (
          <ul className="managed-clubs">
            {list.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/my-clubs/${c.id}`}
                  className="console-surface block h-full p-4 hover:border-ink-600"
                >
                  <p className="text-sm text-ink-600">{c.field}</p>
                  <p className="mt-0.5 text-base font-bold">{c.name}</p>
                  <p className="mt-1 line-clamp-2 text-[15px] text-ink-700">{c.summary}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink-600">
                    <span className="tabular-nums">회원 {c.memberCount}명</span>
                    {c.recruiting ? <Badge tone="success">모집 중</Badge> : <Badge>모집 마감</Badge>}
                    {c.status === 'inactive' && <Badge tone="warning">운영 중지</Badge>}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )
      }
    </QueryState>
  );
}

export default function MyClubsPage() {
  return (
    <AdminPage
      view="directory"
      title="동아리 운영"
      permission={managesAnyClub}
      description="담당 동아리의 회원·가입 신청·출석·소식·소개를 관리합니다."
    >
      <MyClubs />
    </AdminPage>
  );
}
