'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type SearchInputProps = Omit<ComponentProps<'input'>, 'type' | 'defaultValue'> & {
  defaultValue?: string;
  /** 바깥 래퍼 클래스 (input 자체 클래스는 className) */
  wrapperClassName?: string;
};

/** 검색 입력 — 브라우저 기본 지우기 버튼 대신 자체 지우기 버튼 */
export function SearchInput({ defaultValue, className, wrapperClassName, ...props }: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [filled, setFilled] = useState(!!defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const composing = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (ref.current && ref.current.value.trim() !== (defaultValue ?? '')) {
      clearTimeout(timer.current);
      ref.current.value = defaultValue ?? '';
      setFilled(Boolean(defaultValue));
    }
  }, [defaultValue]);

  function search(value: string) {
    clearTimeout(timer.current);
    if (composing.current) return;
    const pathname = window.location.pathname;
    timer.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (url.pathname !== pathname || (url.searchParams.get('q') ?? '') === value.trim()) return;
      if (value.trim()) url.searchParams.set('q', value.trim());
      else url.searchParams.delete('q');
      url.searchParams.delete('page');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }, 220);
  }

  return (
    <div className={cn('relative min-w-0 flex-1', wrapperClassName)}>
      <input
        ref={ref}
        type="search"
        defaultValue={defaultValue}
        onCompositionStart={() => {
          composing.current = true;
          clearTimeout(timer.current);
        }}
        onCompositionEnd={(e) => {
          composing.current = false;
          search(e.currentTarget.value);
        }}
        onInput={(e) => {
          setFilled(Boolean(e.currentTarget.value));
          search(e.currentTarget.value);
        }}
        className={cn('w-full pr-11', className)}
        {...props}
      />
      {filled && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            if (!ref.current) return;
            ref.current.value = '';
            setFilled(false);
            search('');
            ref.current.focus();
          }}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-600 hover:text-ink-900"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-ink-600/15">
            <X aria-hidden className="size-3.5" strokeWidth={2.5} />
          </span>
        </button>
      )}
    </div>
  );
}
