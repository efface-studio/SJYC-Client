import { Paperclip, Pin } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { NOTICE_CATEGORY_LABEL } from '@/domain/labels';
import type { Notice } from '@/domain/types';
import { formatDate } from '@/lib/format';

export function NoticeItem({ notice }: { notice: Notice }) {
  return (
    <li>
      <Link
        href={`/notices/${notice.id}`}
        className="group flex flex-col gap-1 border-b border-line py-4 active:bg-surface-muted"
      >
        <div className="flex items-center gap-2 text-sm text-ink-600">
          {notice.pinned && (
            <Badge tone="brand">
              <Pin aria-hidden className="mr-0.5 size-3" />
              중요
            </Badge>
          )}
          <span>{NOTICE_CATEGORY_LABEL[notice.category]}</span>
          <span aria-hidden>·</span>
          <time className="tabular-nums" dateTime={notice.publishedAt ?? undefined}>
            {notice.publishedAt && formatDate(notice.publishedAt)}
          </time>
        </div>
        <p className="flex items-start gap-1 text-base leading-snug font-semibold text-ink-900 group-hover:underline">
          <span className="line-clamp-2">{notice.title}</span>
          {notice.attachments.length > 0 && (
            <>
              <Paperclip aria-hidden className="mt-1 size-4 shrink-0 text-ink-600" />
              <span className="sr-only">첨부파일 있음</span>
            </>
          )}
        </p>
      </Link>
    </li>
  );
}
