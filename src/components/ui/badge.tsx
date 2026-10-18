import type { ReactNode } from 'react';
import type { Tone } from '@/domain/labels';
import { cn } from '@/lib/cn';

const TONE: Record<Tone, string> = {
  neutral: 'text-ink-600',
  brand: 'text-brand-700',
  success: 'text-success-700',
  danger: 'text-danger-700',
  warning: 'text-warning-800',
  info: 'text-info-700',
};

const MARK: Record<Tone, string> = {
  neutral: 'bg-line-strong',
  brand: 'bg-brand-500',
  success: 'bg-success-700',
  danger: 'bg-danger-700',
  warning: 'bg-warning-800',
  info: 'bg-info-700',
};

/**
 * 상태 표시 — 색 띠 + 굵은 텍스트. 알약형 배경 배지 대신 정보 밀도를 해치지 않는 형태.
 * 색상만으로 구분하지 않도록 항상 텍스트를 함께 쓴다.
 */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 text-[13px] leading-5 font-bold whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      <span aria-hidden className={cn('h-3 w-[3px]', MARK[tone])} />
      {children}
    </span>
  );
}
