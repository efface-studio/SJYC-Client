'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/cn';
import { useListParams } from './list-params';

export const inputClass =
  'h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink-900 focus:border-brand-700 focus:outline-none';

export interface Option {
  value: string;
  label: string;
}

/** 레이블 맵(PUBLISH_STATUS 등) → 셀렉트 옵션. 첫 항목은 "전체" */
export function optionsOf(map: Record<string, { text: string } | string>, allLabel = '전체'): Option[] {
  return [
    { value: '', label: allLabel },
    ...Object.entries(map).map(([value, l]) => ({ value, label: typeof l === 'string' ? l : l.text })),
  ];
}

export const SORT_OPTIONS: Option[] = [
  { value: '', label: '최신순' },
  { value: 'oldest', label: '오래된 순' },
  { value: 'title', label: '제목순' },
];

/** URL 파라미터 하나와 연결된 셀렉트 필터 */
export function FilterSelect({ label, param, options }: { label: string; param: string; options: Option[] }) {
  const { get, set } = useListParams();
  const id = useId();
  if (param === 'status')
    return (
      <div className="status-options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={get(param) === option.value}
            onClick={() => set({ [param]: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  return (
    <div className="min-w-0 md:w-44">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      <Select
        id={id}
        title={label}
        size="md"
        value={get(param)}
        onValueChange={(v) => set({ [param]: v })}
        options={options}
      />
    </div>
  );
}

/** URL 파라미터와 연결된 날짜 필터 (YYYY-MM-DD) */
export function FilterDate({ label, param }: { label: string; param: string }) {
  const { get, set } = useListParams();
  const id = useId();
  return (
    <div className="min-w-0 md:w-44">
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-ink-700">
        {label}
      </label>
      <DatePicker
        id={id}
        title={label}
        size="md"
        clearable
        value={get(param)}
        onValueChange={(v) => set({ [param]: v || undefined })}
      />
    </div>
  );
}

interface FilterBarProps {
  searchLabel: string;
  placeholder: string;
  /** 주 필터 — 모바일에서도 항상 보인다 */
  primary?: ReactNode;
  /** 보조 필터 — 모바일에서는 "필터" 버튼으로 접는다 */
  secondary?: ReactNode;
  total?: number;
}

export function FilterBar({ searchLabel, placeholder, primary, secondary, total }: FilterBarProps) {
  const { q, set, pathname, hasFilters } = useListParams();
  const [open, setOpen] = useState(false);
  const searchId = useId();
  const panelId = useId();

  return (
    <div className="console-surface console-filters mb-4 space-y-3 p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
        <form
          role="search"
          className="list-search"
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: String(new FormData(e.currentTarget).get('q') ?? '').trim() });
          }}
        >
          <label htmlFor={searchId} className="sr-only">
            {searchLabel}
          </label>
          <div className="list-search-input">
            <SearchInput
              id={searchId}

              name="q"
              defaultValue={q}
              placeholder={placeholder}
              enterKeyHint="search"
              className={inputClass}
            />
            <button type="submit" aria-label="검색" className="list-search-submit">
              <Search aria-hidden size={18} />
            </button>
          </div>
        </form>
        {primary}
        {secondary && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 text-[15px] font-semibold"
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            필터
          </button>
        )}
        {secondary && (
          <div id={panelId} className={cn('w-full flex-wrap items-end gap-3', open ? 'flex' : 'hidden')}>
            {secondary}
          </div>
        )}
      </div>
      <div className="flex min-h-6 items-center gap-3 text-sm text-ink-600">
        {total !== undefined && (
          <p aria-live="polite">
            총 <strong className="text-ink-900 tabular-nums">{total.toLocaleString('ko-KR')}</strong>건
          </p>
        )}
        {hasFilters && (
          <Link
            href={pathname}
            className="inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-2"
          >
            필터 초기화
          </Link>
        )}
      </div>
    </div>
  );
}
