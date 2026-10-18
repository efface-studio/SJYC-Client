import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-800',
  secondary: 'border border-line-strong bg-surface text-ink-900 hover:bg-surface-muted active:bg-line',
  tertiary: 'text-brand-700 underline-offset-4 hover:underline hover:bg-brand-50',
  destructive: 'bg-danger-700 text-white hover:bg-[#8f1c13] active:bg-[#8f1c13]',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-[15px]',
  lg: 'min-h-13 px-5 text-base',
};

interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

/** <Link> 등 버튼처럼 보여야 하는 요소에 같은 스타일을 입힌다 */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
}: ButtonClassOptions = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    VARIANT[variant],
    SIZE[size],
    block && 'w-full',
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonClassOptions {
  loading?: boolean;
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </button>
  );
}
