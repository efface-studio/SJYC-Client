'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { ClubVisual } from '@/components/site/club-visual';
import { ChevronRight } from 'lucide-react';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { buttonClass } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';

function ClubList() {
  const clubs = useQuery({ queryKey: ['admin', 'clubs'], queryFn: () => api.admin.clubs.list() });
  return (
    <QueryState
      query={clubs}
      isEmpty={(d) => d.length === 0}
      empty={
        <EmptyState title="등록된 동아리가 없습니다" description="오른쪽 위 '동아리 등록'으로 추가하세요." />
      }
    >
      {(d) => (
        <>
          <p className="mb-3 text-sm text-ink-600">
            총 <strong className="text-ink-900 tabular-nums">{d.length}</strong>개
          </p>
          <ul className="club-catalog">
            {d.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/clubs/${c.id}`}>
                  <ClubVisual photo={c.photos[0]} field={c.field} decorative />
                  <div>
                    <small>{c.field}</small>
                    <strong>{c.name}</strong>
                    <span>
                      회원 {c.memberCount}명 · {c.recruiting ? '모집 중' : '모집 안 함'}
                    </span>
                  </div>
                  <Badge tone={c.status === 'active' ? 'success' : 'neutral'}>
                    {c.status === 'active' ? '운영 중' : '운영 중지'}
                  </Badge>
                  <ChevronRight size={15} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </QueryState>
  );
}

export default function AdminClubsPage() {
  return (
    <AdminPage
      view="list"
      title="동아리 관리"
      permission="club.manage"
      actions={
        <>
          <Link href="/admin/clubs/applications" className={buttonClass({ variant: 'secondary' })}>
            가입 신청 검토
          </Link>
          <Link href="/admin/clubs/new" className={buttonClass()}>
            동아리 등록
          </Link>
        </>
      }
    >
      <ClubList />
    </AdminPage>
  );
}
