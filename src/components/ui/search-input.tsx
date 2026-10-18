'use client';

import { X } from 'lucide-react';
import { useRef, useState, type ComponentProps } from 'react';
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
  return (
    <div className={cn('relative min-w-0 flex-1', wrapperClassName)}>
      <input
        ref={ref}
        type="search"
        defaultValue={defaultValue}
        onInput={(e) => setFilled(!!e.currentTarget.value)}
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
