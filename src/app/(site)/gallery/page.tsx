'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/api';
import { REFERENCE_COLLECTED_AT } from '@/api/mock/research';
import { PageHeader } from '@/components/ui/page-header';
import { Callout, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { IS_MOCK } from '@/config/env';
import type { MediaItem } from '@/domain/types';

function SourceLink({ href, label = '출처' }: { href: string; label?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
      {label}
      <span className="sr-only">(새 창)</span>
    </a>
  );
}

function Photos({ items }: { items: MediaItem[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <li key={p.url}>
          <figure>
            <img
              src={p.thumbnailUrl}
              alt={p.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="aspect-[4/3] w-full rounded-sm bg-surface-muted object-cover"
            />
            <figcaption className="mt-1.5 text-sm leading-snug">
              <span className="block font-semibold text-ink-900">{p.title}</span>
              <span className="text-ink-600">
                {p.date && <span className="tabular-nums">{p.date} · </span>}
                <SourceLink href={p.sourceUrl} />
              </span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}

/** 영상은 썸네일 대신 제목 목록 — 썸네일의 청소년 얼굴 노출을 검수하지 않았다 */
function Videos({ items }: { items: MediaItem[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((v) => (
        <li key={v.url}>
          <a
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-0.5 py-3 hover:bg-surface-muted md:flex-row md:items-baseline md:gap-4 md:px-2"
          >
            {v.date && <span className="shrink-0 text-sm text-ink-600 tabular-nums">{v.date}</span>}
            <span className="font-semibold">{v.title}</span>
            <span className="text-sm text-ink-600 md:ml-auto md:shrink-0">
              유튜브에서 보기<span className="sr-only">(새 창)</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function GalleryPage() {
  const media = useQuery({ queryKey: ['media'], queryFn: () => api.media.list() });
  const photos = media.data?.filter((m) => m.kind === 'photo') ?? [];
  const videos = media.data?.filter((m) => m.kind === 'video') ?? [];

  return (
    <div className="container-page py-6 md:py-10">
      <title>센터 소식 · 갤러리 | 중구청소년센터</title>
      <PageHeader
        title="센터 소식 · 갤러리"
        description="센터 공식 채널에 올라온 사진과 영상을 모았습니다."
      />
      {media.isPending ? (
        <ListSkeleton rows={3} label="갤러리 불러오는 중" />
      ) : media.isError ? (
        <ErrorState error={media.error} onRetry={() => void media.refetch()} />
      ) : media.data.length === 0 ? (
        <EmptyState
          title="등록된 사진·영상이 없습니다"
          description="센터 소식이 올라오면 이곳에서 볼 수 있습니다."
        />
      ) : (
        <>
          {IS_MOCK && (
            <Callout className="mb-6">
              센터 공식 채널에서 수집한 참고 정보입니다 (수집일 {REFERENCE_COLLECTED_AT}). 사진·영상의
              저작권은 센터와 원저작자에게 있으며, 각 항목의 출처에서 원문을 확인할 수 있습니다.
            </Callout>
          )}
          {photos.length > 0 && (
            <section aria-labelledby="photos-title" className="border-t-2 border-ink-900 pt-3">
              <h2 id="photos-title" className="mb-4 text-xl font-extrabold">
                사진 <span className="text-base text-brand-700 tabular-nums">{photos.length}</span>
              </h2>
              <Photos items={photos} />
            </section>
          )}
          {videos.length > 0 && (
            <section aria-labelledby="videos-title" className="mt-12 border-t-2 border-ink-900 pt-3">
              <h2 id="videos-title" className="mb-2 text-xl font-extrabold">
                영상 <span className="text-base text-brand-700 tabular-nums">{videos.length}</span>
              </h2>
              <Videos items={videos} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
