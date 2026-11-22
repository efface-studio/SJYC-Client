'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { api, isApiError } from '@/api';
import { buttonClass } from '@/components/ui/button';
import '@/components/site/directories.css';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { remainingSeats } from '@/domain/program';
import type { Program } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { RecruitBadge, useCategoryName } from '@/features/programs/program-card';
import { formatDate, formatDateTime, formatPeriod } from '@/lib/format';

function ApplyAction({ program }: { program: Program }) {
  const { data: session } = useSession();
  const mine = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.me.applications(),
    enabled: !!session,
  });
  const active = mine.data?.find(
    (a) => a.programId === program.id && (a.status === 'submitted' || a.status === 'approved'),
  );

  const disabled = (label: string, hint?: string) => (
    <div>
      <span aria-disabled className={buttonClass({ size: 'lg', block: true, variant: 'secondary' })}>
        {label}
      </span>
      {hint && <p className="mt-1.5 text-center text-sm text-ink-600">{hint}</p>}
    </div>
  );

  if (active) {
    return (
      <Link
        href={`/my/applications/${active.id}`}
        className={buttonClass({ size: 'lg', block: true, variant: 'secondary' })}
      >
        신청 완료 · 신청 내역 보기
      </Link>
    );
  }
  switch (program.recruitStatus) {
    case 'upcoming':
      return disabled('모집 예정', `${formatDateTime(program.recruitStartsAt)}부터 신청할 수 있습니다.`);
    case 'closed':
      return disabled('모집 종료');
    case 'full':
      return disabled('정원 마감', '취소 인원이 생기면 다시 신청할 수 있습니다.');
    case 'open':
      return session ? (
        <Link href={`/programs/${program.id}/apply`} className={buttonClass({ size: 'lg', block: true })}>
          신청하기
        </Link>
      ) : (
        <Link
          href={`/login?next=${encodeURIComponent(`/programs/${program.id}/apply`)}`}
          className={buttonClass({ size: 'lg', block: true })}
        >
          로그인하고 신청하기
        </Link>
      );
  }
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 border-b border-line py-3 text-[15px] md:grid-cols-[120px_1fr]">
      <dt className="font-semibold text-ink-600">{label}</dt>
      <dd className="text-ink-900">{children}</dd>
    </div>
  );
}

export default function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>();
  const program = useQuery({ queryKey: ['program', id], queryFn: () => api.programs.get(id) });
  const categoryName = useCategoryName();

  if (program.isPending) {
    return (
      <div className="container-page py-6">
        <ListSkeleton rows={2} />
      </div>
    );
  }
  if (program.isError) {
    return (
      <div className="container-page py-6">
        {isApiError(program.error, 'NOT_FOUND') ? (
          <EmptyState
            title="프로그램을 찾을 수 없습니다"
            description="삭제되었거나 비공개로 전환된 프로그램입니다."
            action={
              <Link href="/programs" className={buttonClass({ variant: 'secondary' })}>
                프로그램 목록
              </Link>
            }
          />
        ) : (
          <ErrorState error={program.error} onRetry={() => void program.refetch()} />
        )}
      </div>
    );
  }

  const p = program.data;
  return (
    <div className="directory-detail directory-programs directory-content">
      <title>{`${p.title} | 중구청소년센터`}</title>
      <PageHeader
        breadcrumbs={[
          { label: '프로그램', href: '/programs' },
          { label: categoryName(p.categoryId) || '상세' },
        ]}
        title={p.title}
        description={
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <RecruitBadge program={p} />
            {p.summary}
          </span>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <dl className="border-t border-line-strong">
            <Row label="분류">{categoryName(p.categoryId)}</Row>
            <Row label="대상">{p.target}</Row>
            <Row label="장소">{p.place}</Row>
            <Row label="운영 기간">{formatPeriod(p.startsAt, p.endsAt)}</Row>
            <Row label="모집 기간">
              {formatDateTime(p.recruitStartsAt)} ~ {formatDateTime(p.recruitEndsAt)}
            </Row>
            <Row label="정원">
              {p.capacity}명 (신청 {p.appliedCount}명 · 잔여 {remainingSeats(p)}석)
            </Row>
            <Row label="취소 기한">{formatDate(p.cancelDeadline)}까지 마이페이지에서 취소 가능</Row>
          </dl>

          <section aria-labelledby="desc-title" className="mt-8">
            <h2 id="desc-title" className="text-lg font-bold">
              프로그램 안내
            </h2>
            <p className="mt-3 text-base leading-relaxed whitespace-pre-line text-ink-700">{p.description}</p>
          </section>
        </div>

        {/* 모바일: 하단 탭바 위에 고정되는 신청 영역 / 데스크톱: 우측 고정 */}
        <aside className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 -mx-4 border-t border-line bg-surface px-4 py-3 md:bottom-0 lg:top-24 lg:mx-0 lg:self-start lg:rounded-xl lg:border lg:bg-surface-muted lg:p-6">
          <p className="mb-3 hidden text-[15px] text-ink-700 lg:block">
            모집 마감{' '}
            <strong className="mt-1 block text-lg text-ink-900">{formatDateTime(p.recruitEndsAt)}</strong>
          </p>
          <ApplyAction program={p} />
        </aside>
      </div>
    </div>
  );
}
