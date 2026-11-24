'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { DirectorySkeleton } from '@/components/site/directory-skeleton';
import { DirectoryIntro } from '@/components/site/directory-intro';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/api';
import { ClubVisual } from '@/components/site/club-visual';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState } from '@/components/ui/states';
import './clubs.css';

export default function ClubsPage() {
  const clubs = useQuery({ queryKey: ['clubs'], queryFn: () => api.clubs.list() });
  const [recruitingOnly, setRecruitingOnly] = useState(false);
  const visible = clubs.data?.filter((club) => !recruitingOnly || club.recruiting);

  return (
    <div className="club-page directory-page directory-clubs">
      <title>동아리 | 중구청소년센터</title>
      <DirectoryIntro kind="clubs" />
      <div className="directory-content" id="directory-content">
        {clubs.isPending ? (
          <DirectorySkeleton kind="clubs" />
        ) : clubs.isError ? (
          <ErrorState error={clubs.error} onRetry={() => void clubs.refetch()} />
        ) : !clubs.data.length ? (
          <EmptyState title="등록된 동아리가 없습니다" />
        ) : (
          <section aria-labelledby="club-list-heading">
            <div className="club-list-tools">
              <h2 id="club-list-heading">
                동아리 목록 <span aria-live="polite">{visible?.length}개</span>
              </h2>
              <label>
                <input
                  type="checkbox"
                  checked={recruitingOnly}
                  onChange={(e) => setRecruitingOnly(e.target.checked)}
                />
                모집 중만 보기
              </label>
            </div>
            {visible?.length ? (
              <ul className="clubs-index">
                {visible.map((club) => (
                  <li key={club.id}>
                    <Link href={`/clubs/${club.id}`} className="club-list-link">
                      <ClubVisual photo={club.photos[0]} field={club.field} decorative />
                      <div className="club-list-copy">
                        <span className="club-field">{club.field}</span>
                        <h3>{club.name}</h3>
                        <p>{club.summary}</p>
                        <Badge tone={club.recruiting ? 'brand' : 'neutral'}>
                          {club.recruiting ? '가입 신청 가능' : '현재 모집 없음'}
                        </Badge>
                      </div>
                      <ArrowUpRight className="club-open" size={18} aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="모집 중인 동아리가 없습니다"
                action={
                  <button className="underline" type="button" onClick={() => setRecruitingOnly(false)}>
                    전체 동아리 보기
                  </button>
                }
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
