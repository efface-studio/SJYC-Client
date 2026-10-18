import { Check, Minus } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

type ChoiceProps = Omit<ComponentProps<'input'>, 'type'> & { indeterminate?: boolean };

/**
 * 자체 체크박스 — 모양은 직접 그리고, 의미·폼 값·키보드는 input 요소가 그대로 맡는다.
 * indeterminate 는 시각 표시와 aria-checked="mixed" 로 함께 알린다.
 */
export function Checkbox({ className, indeterminate, checked, ...props }: ChoiceProps) {
  return (
    <span className={cn('relative inline-flex size-5 shrink-0', className)}>
      <input
        type="checkbox"
        checked={checked}
        aria-checked={indeterminate ? 'mixed' : undefined}
        className={cn(
          'peer m-0 size-5 cursor-pointer appearance-none rounded-sm border-2 border-line-strong bg-surface transition-colors',
          'checked:border-brand-700 checked:bg-brand-700 hover:border-ink-600 checked:hover:border-brand-800 checked:hover:bg-brand-800',
          'disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-muted aria-invalid:border-danger-700',
          indeterminate && 'border-brand-700 bg-brand-700',
        )}
        {...props}
      />
      {indeterminate ? (
        <Minus
          aria-hidden
          strokeWidth={3.5}
          className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white"
        />
      ) : (
        <Check
          aria-hidden
          strokeWidth={3.5}
          className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white opacity-0 peer-checked:opacity-100"
        />
      )}
    </span>
  );
}

/** 자체 라디오 버튼 */
export function Radio({ className, ...props }: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <span className={cn('relative inline-flex size-5 shrink-0', className)}>
      <input
        type="radio"
        className={cn(
          'peer m-0 size-5 cursor-pointer appearance-none rounded-full border-2 border-line-strong bg-surface transition-colors',
          'checked:border-brand-700 hover:border-ink-600 checked:hover:border-brand-800',
          'disabled:cursor-not-allowed disabled:bg-surface-muted',
        )}
        {...props}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto size-2.5 scale-0 rounded-full bg-brand-700 transition-transform peer-checked:scale-100"
      />
    </span>
  );
}
