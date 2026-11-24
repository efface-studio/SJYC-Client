'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useId, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { CheckboxField, FormError, TextAreaField } from '@/components/ui/field';
import { ArrowLeft } from 'lucide-react';
import { ClubVisual } from '@/components/site/club-visual';
import '../clubs.css';
import { Callout, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { CLUB_APPLICATION_STATUS } from '@/domain/labels';
import { clubApplySchema, parseForm, type FieldErrors } from '@/domain/schemas';
import type { Club, ClubRole } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/format';

const POST_KIND = { notice: '공지', schedule: '일정', activity: '활동 기록' } as const;
const ROLE_LABEL: Record<ClubRole, string> = { leader: '대표', member: '동아리원' };

function MemberArea({ clubId }: { clubId: string }) {
  const [tab, setTab] = useState<'posts' | 'members'>('posts');
  const base = useId();
  const posts = useQuery({ queryKey: ['club-posts', clubId], queryFn: () => api.clubs.posts(clubId) });
  const members = useQuery({
    queryKey: ['club-members', clubId],
    queryFn: () => api.clubs.members(clubId),
    enabled: tab === 'members',
  });

  return (
    <section aria-label="동아리원 전용" className="mt-8">
      <div role="tablist" aria-label="동아리원 메뉴" className="flex border-b border-line">
        {(
          [
            ['posts', '소식·일정'],
            ['members', '동아리원'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${base}-${key}-tab`}
            aria-selected={tab === key}
            aria-controls={`${base}-${key}-panel`}
            onClick={() => setTab(key)}
            className={cn(
              'h-12 border-b-2 px-4 text-[15px] font-semibold',
              tab === key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${base}-${tab}-panel`}
        aria-labelledby={`${base}-${tab}-tab`}
        className="pt-4"
      >
        {tab === 'posts' &&
          (posts.isPending ? (
            <ListSkeleton rows={2} />
          ) : posts.isError ? (
            <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />
          ) : posts.data.length === 0 ? (
            <EmptyState title="등록된 소식이 없습니다" />
          ) : (
            <ul className="divide-y divide-line">
              {posts.data.map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-center gap-2 text-sm text-ink-600">
                    <Badge tone={p.kind === 'schedule' ? 'info' : 'neutral'}>{POST_KIND[p.kind]}</Badge>
                    <time dateTime={p.at}>{formatDateTime(p.at)}</time>
                  </div>
                  <p className="mt-1 font-semibold">{p.title}</p>
                  <p className="text-[15px] text-ink-700">{p.body}</p>
                </li>
              ))}
            </ul>
          ))}
        {tab === 'members' &&
          (members.isPending ? (
            <ListSkeleton rows={2} />
          ) : members.isError ? (
            <ErrorState error={members.error} onRetry={() => void members.refetch()} />
          ) : (
            <>
              <p className="mb-2 text-sm text-ink-600">개인정보 보호를 위해 이름 일부만 표시합니다.</p>
              <ul className="divide-y divide-line">
                {members.data.map((m, i) => (
                  <li key={i} className="flex items-center justify-between py-3">
                    <span className="font-semibold">{m.displayName}</span>
                    <span className="flex items-center gap-2 text-sm text-ink-600">
                      {m.role === 'leader' && <Badge tone="brand">{ROLE_LABEL.leader}</Badge>}
                      {formatDate(m.joinedAt)} 가입
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ))}
      </div>
    </section>
  );
}

function JoinArea({ club }: { club: Club }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: session } = useSession();
  const [errors, setErrors] = useState<FieldErrors>({});
  const myApps = useQuery({
    queryKey: ['my-club-applications'],
    queryFn: () => api.me.clubApplications(),
    enabled: !!session,
  });
  const apply = useMutation({
    mutationFn: (input: Parameters<typeof api.clubs.apply>[1]) => api.clubs.apply(club.id, input),
    onSuccess: () => {
      toast.success('가입 신청을 보냈습니다. 검토 결과는 마이페이지에서 확인할 수 있습니다.');
      void qc.invalidateQueries({ queryKey: ['my-club-applications'] });
    },
    onError: (e) => {
      if (isApiError(e) && e.fieldErrors) setErrors(e.fieldErrors);
    },
  });

  if (!session && club.recruiting) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/clubs/${club.id}`)}`}
        className={buttonClass({ size: 'lg', block: true })}
      >
        로그인하고 가입 신청하기
      </Link>
    );
  }
  const pending = myApps.data?.find((a) => a.clubId === club.id && a.status === 'pending');
  if (pending) {
    return (
      <Callout tone="info" title="가입 신청 검토 중">
        {formatDate(pending.createdAt)}에 신청했습니다. 상태: {CLUB_APPLICATION_STATUS.pending.text}
      </Callout>
    );
  }
  if (!club.recruiting) {
    return <Callout tone="warning">현재 가입 신청을 받지 않는 동아리입니다.</Callout>;
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (apply.isPending) return;
        const parsed = parseForm(clubApplySchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        apply.mutate(parsed.data);
      }}
      className="space-y-4"
    >
      <TextAreaField
        label="가입 동기"
        name="motivation"
        rows={4}
        maxLength={500}
        required
        hint="10~500자. 동아리 대표와 담당 선생님이 확인합니다."
        error={errors.motivation}
      />
      <CheckboxField
        name="agreePrivacy"
        label="[필수] 가입 검토를 위해 이름과 가입 동기를 동아리 대표·담당자에게 제공하는 데 동의합니다."
        error={errors.agreePrivacy}
      />
      <FormError message={apply.isError ? errorMessage(apply.error) : null} />
      <Button type="submit" size="lg" block loading={apply.isPending}>
        가입 신청하기
      </Button>
    </form>
  );
}

/** 센터 공식 채널에서 가져온 사진 — 캡션과 출처를 함께 표시한다 */
function ClubPhotos({ club }: { club: Club }) {
  if (!club.photos.length) return null;
  return (
    <section className="club-gallery" aria-labelledby="club-photos-title">
      <h2 id="club-photos-title">활동 자료</h2>
      <ul>
        {club.photos.map((photo) => (
          <li key={photo.url}>
            <figure>
              <ClubVisual photo={photo} field={club.field} />
              <figcaption>
                <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {photo.caption}
                  <span className="sr-only"> 출처 (새 창)</span>
                </a>
                {photo.date && <span>{photo.date}</span>}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClubActivities({ club }: { club: Club }) {
  if (club.activities.length === 0 && club.sourceUrls.length === 0) return null;
  return (
    <>
      {club.activities.length > 0 && (
        <section aria-labelledby="activities-title" className="mt-8">
          <h2 id="activities-title" className="mb-2 text-lg font-bold">
            최근 활동
          </h2>
          <ol className="space-y-3 border-l-2 border-line pl-4">
            {club.activities.map((a) => (
              <li key={`${a.date}-${a.title}`}>
                <p className="text-sm text-ink-600 tabular-nums">{a.date}</p>
                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                  >
                    {a.title}
                    <span className="sr-only">(새 창)</span>
                  </a>
                ) : (
                  <p className="font-semibold">{a.title}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
      {club.sourceUrls.length > 0 && (
        <p className="mt-6 text-sm text-ink-600">
          정보 출처:{' '}
          {club.sourceUrls.map((u, i) => (
            <span key={u}>
              {i > 0 && ', '}
              <a href={u} target="_blank" rel="noopener noreferrer" className="underline">
                {new URL(u).hostname}
                <span className="sr-only">(새 창)</span>
              </a>
            </span>
          ))}
        </p>
      )}
    </>
  );
}

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const club = useQuery({ queryKey: ['club', id], queryFn: () => api.clubs.get(id) });
  const { data: session } = useSession();
  const myClubs = useQuery({ queryKey: ['my-clubs'], queryFn: () => api.me.clubs(), enabled: !!session });
  const membership = myClubs.data?.find((m) => m.club.id === id);
  const introduction = club.data?.description.startsWith(club.data.summary)
    ? club.data.description.slice(club.data.summary.length).trim()
    : club.data?.description;

  return (
    <div className="club-page container-page">
      <Link href="/clubs" className="club-back">
        <ArrowLeft aria-hidden size={16} />
        동아리 목록
      </Link>
      {club.isPending ? (
        <ListSkeleton rows={2} />
      ) : club.isError ? (
        isApiError(club.error, 'NOT_FOUND') ? (
          <EmptyState title="동아리를 찾을 수 없습니다" />
        ) : (
          <ErrorState error={club.error} onRetry={() => void club.refetch()} />
        )
      ) : (
        <>
          <title>{`${club.data.name} | 중구청소년센터`}</title>
          <header className="club-profile">
            <div>
              <span className="club-field">{club.data.field}</span>
              <h1>{club.data.name}</h1>
              <p>{club.data.summary}</p>
            </div>
            <ClubVisual key={id} photo={club.data.photos[0]} field={club.data.field} />
          </header>
          <div className="club-detail-layout">
            <section className="club-participate" aria-labelledby="club-participate-title">
              <h2 id="club-participate-title">참여 안내</h2>
              <dl>
                {club.data.target && (
                  <>
                    <dt>활동 대상</dt>
                    <dd>{club.data.target}</dd>
                  </>
                )}
                <dt>모임 안내</dt>
                <dd>{club.data.meetingInfo}</dd>
                <dt>활동 인원</dt>
                <dd>{club.data.memberCount}명</dd>
              </dl>
              {membership ? (
                <Callout tone="brand">{ROLE_LABEL[membership.role]}(으)로 활동 중인 동아리입니다.</Callout>
              ) : (
                <div className="club-join">
                  <h3>가입 신청</h3>
                  <JoinArea club={club.data} />
                </div>
              )}
            </section>
            <div className="club-story">
              {introduction && (
                <section aria-labelledby="club-intro-title">
                  <h2 id="club-intro-title">동아리 소개</h2>
                  <p className="whitespace-pre-line">{introduction}</p>
                </section>
              )}
              <ClubActivities club={club.data} />
              <ClubPhotos club={club.data} />
              {membership && <MemberArea clubId={id} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
