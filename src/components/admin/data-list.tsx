'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/choice';
import { cn } from '@/lib/cn';
import type { AdminSort } from './list-params';

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** 정렬 가능한 열 — title: 제목순, date: 최신/오래된 순 */
  sort?: 'title' | 'date';
  /** 표 셀 클래스 (예: 'tabular-nums whitespace-nowrap') */
  className?: string;
  /** 모바일 목록에서 제목 줄로 쓴다 */
  primary?: boolean;
  /** 모바일 목록에서 제목 줄 오른쪽에 둔다 */
  status?: boolean;
}

export interface Selection {
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}

interface DataListProps<T extends { id: string }> {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  /** 체크박스 레이블용 행 이름 */
  rowLabel: (row: T) => string;
  sort?: AdminSort;
  onSort?: (sort: AdminSort) => void;
  selection?: Selection;
}

/** 행 제목 링크 — 모바일에서는 행 전체가 눌리도록 영역을 넓힌다 (li 가 relative) */
export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-semibold text-ink-900 after:absolute after:inset-0 hover:text-brand-700 hover:underline md:after:hidden"
    >
      {children}
    </Link>
  );
}

function ariaSort(col: 'title' | 'date' | undefined, sort: AdminSort | undefined) {
  if (!col || !sort) return undefined;
  if (col === 'title') return sort === 'title' ? 'ascending' : 'none';
  if (sort === 'title') return 'none';
  return sort === 'newest' ? 'descending' : 'ascending';
}

function nextSort(col: 'title' | 'date', sort: AdminSort | undefined): AdminSort {
  if (col === 'title') return 'title';
  return sort === 'newest' ? 'oldest' : 'newest';
}

function SelectAll({ rows, selection }: { rows: { id: string }[]; selection: Selection }) {
  const count = rows.filter((r) => selection.selected.has(r.id)).length;
  const all = rows.length > 0 && count === rows.length;
  return (
    <Checkbox
      aria-label="이 페이지 전체 선택"
      checked={all}
      indeterminate={count > 0 && !all}
      onChange={() => selection.onChange(all ? new Set() : new Set(rows.map((r) => r.id)))}
    />
  );
}

function toggle(selection: Selection, id: string) {
  const next = new Set(selection.selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selection.onChange(next);
}

/**
 * 관리자 목록 — md 이상은 실제 <table>, 그 미만은 같은 행을 세로로 쌓은 목록으로 렌더링한다.
 * 좁은 화면에 표를 욱여넣지 않는다.
 */
export function DataList<T extends { id: string }>({
  caption,
  rows,
  columns,
  rowLabel,
  sort,
  onSort,
  selection,
}: DataListProps<T>) {
  const primary = columns.find((c) => c.primary);
  const status = columns.find((c) => c.status);
  const meta = columns.filter((c) => !c.primary && !c.status);

  return (
    <>
      <div className="hidden overflow-x-auto border-y border-line bg-surface md:block">
        <table className="w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line-strong bg-surface-admin/60 text-sm text-ink-700">
              {selection && (
                <th scope="col" className="w-12 px-3 py-2">
                  <SelectAll rows={rows} selection={selection} />
                </th>
              )}
              {columns.map((c) => {
                const sortable = c.sort && onSort;
                const as = ariaSort(c.sort, sort);
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={sortable ? as : undefined}
                    className="px-3 py-2 font-semibold whitespace-nowrap"
                  >
                    {sortable && c.sort ? (
                      <button
                        type="button"
                        onClick={() => onSort(nextSort(c.sort ?? 'date', sort))}
                        className="-mx-1 inline-flex min-h-9 items-center gap-1 rounded px-1 hover:text-ink-900"
                      >
                        {c.header}
                        {as === 'ascending' ? (
                          <ArrowUp aria-hidden className="size-3.5" />
                        ) : as === 'descending' ? (
                          <ArrowDown aria-hidden className="size-3.5" />
                        ) : (
                          <ArrowUpDown aria-hidden className="size-3.5 text-line-strong" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b border-line last:border-b-0 hover:bg-surface-admin/50',
                  selection?.selected.has(row.id) && 'bg-brand-50/60',
                )}
              >
                {selection && (
                  <td className="px-3 py-2.5">
                    <Checkbox
                      aria-label={`${rowLabel(row)} 선택`}
                      checked={selection.selected.has(row.id)}
                      onChange={() => toggle(selection, row.id)}
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-3 py-2.5 align-middle', c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="divide-y divide-line border-y border-line bg-surface md:hidden">
        {rows.map((row) => (
          <li
            key={row.id}
            className={cn(
              'relative flex gap-1 px-4 py-3',
              selection?.selected.has(row.id) && 'bg-brand-50/60',
            )}
          >
            {selection && (
              <label className="relative z-10 -ml-3 flex size-11 shrink-0 items-start justify-center pt-0.5">
                <Checkbox
                  aria-label={`${rowLabel(row)} 선택`}
                  checked={selection.selected.has(row.id)}
                  onChange={() => toggle(selection, row.id)}
                />
              </label>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-base font-semibold">{primary?.cell(row)}</div>
                {status && <div className="shrink-0 pt-0.5">{status.cell(row)}</div>}
              </div>
              {meta.length > 0 && (
                <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 text-sm text-ink-700">
                  {meta.map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-ink-600">{c.header}</dt>
                      <dd className={cn('min-w-0', c.className)}>{c.cell(row)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
