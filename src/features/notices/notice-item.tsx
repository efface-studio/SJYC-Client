import { Paperclip, Pin } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { NOTICE_CATEGORY_LABEL } from '@/domain/labels';
import type { Notice } from '@/domain/types';
import { formatDate } from '@/lib/format';

export function NoticeItem({ notice }: { notice: Notice }) {
  return (
    <li>
      <Link href={`/notices/${notice.id}`} className="notice-row group">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-xs text-ink-600">
            {notice.pinned && (
              <Badge tone="brand">
                <Pin aria-hidden size={12} />
                중요
              </Badge>
            )}
            <span>{NOTICE_CATEGORY_LABEL[notice.category]}</span>
          </div>
          <p className="flex items-center gap-1 font-semibold group-hover:underline">
            <span className="line-clamp-2">{notice.title}</span>
            {notice.attachments.length > 0 && (
              <>
                <Paperclip aria-hidden size={15} className="shrink-0 text-ink-600" />
                <span className="sr-only">첨부파일 있음</span>
              </>
            )}
          </p>
        </div>
        {notice.publishedAt && <time dateTime={notice.publishedAt}>{formatDate(notice.publishedAt)}</time>}
      </Link>
    </li>
  );
}
