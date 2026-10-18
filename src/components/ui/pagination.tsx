import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
}

const item = 'flex size-11 items-center justify-center rounded-md text-[15px] font-semibold';

export function Pagination({ page, total, pageSize, hrefFor }: PaginationProps) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  if (last <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, last - 4));
  const pages = Array.from({ length: Math.min(5, last) }, (_, i) => start + i);

  return (
    <nav aria-label="페이지 이동" className="mt-6 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(item, 'hover:bg-surface-muted')}
          aria-label="이전 페이지"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </Link>
      ) : (
        <span className={cn(item, 'text-line-strong')} aria-hidden>
          <ChevronLeft className="size-5" />
        </span>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`${p}페이지`}
          className={cn(item, p === page ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-surface-muted')}
        >
          {p}
        </Link>
      ))}
      {page < last ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(item, 'hover:bg-surface-muted')}
          aria-label="다음 페이지"
        >
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      ) : (
        <span className={cn(item, 'text-line-strong')} aria-hidden>
          <ChevronRight className="size-5" />
        </span>
      )}
    </nav>
  );
}
