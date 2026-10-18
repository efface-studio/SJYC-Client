'use client';

import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldMeta {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
}

const control =
  'block w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink-900 placeholder:text-ink-600/70 ' +
  'focus:border-brand-700 focus:outline-none focus-visible:outline-3 focus-visible:outline-brand-700/40 ' +
  'disabled:bg-surface-muted aria-invalid:border-danger-700';

function useFieldIds(error?: string, hint?: ReactNode) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return { id, hintId, errorId, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined };
}

function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[15px] font-semibold text-ink-900">
      {children}
      {required && (
        <span className="ml-1 text-danger-700">
          <span aria-hidden>*</span>
          <span className="sr-only">(필수)</span>
        </span>
      )}
    </label>
  );
}

export function FieldMessages({
  hintId,
  hint,
  errorId,
  error,
}: {
  hintId?: string;
  hint?: ReactNode;
  errorId?: string;
  error?: string;
}) {
  return (
    <>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-ink-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1 text-sm font-medium text-danger-700">
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
    </>
  );
}

type TextFieldProps = FieldMeta & ComponentProps<'input'>;

export function TextField({ label, error, hint, className, required, ...props }: TextFieldProps) {
  const ids = useFieldIds(error, hint);
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required}>
        {label}
      </Label>
      <input
        id={ids.id}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={ids.describedBy}
        className={cn(control, 'h-12')}
        {...props}
      />
      <FieldMessages {...ids} hint={hint} error={error} />
    </div>
  );
}

export function PasswordField({ label, error, hint, className, required, ...props }: TextFieldProps) {
  const ids = useFieldIds(error, hint);
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required}>
        {label}
      </Label>
      <div className="relative">
        <input
          id={ids.id}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={ids.describedBy}
          className={cn(control, 'h-12 pr-12')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? '비밀번호 숨기기' : '비밀번호 표시'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-ink-600 hover:text-ink-900"
        >
          {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      </div>
      <FieldMessages {...ids} hint={hint} error={error} />
    </div>
  );
}

type TextAreaFieldProps = FieldMeta & ComponentProps<'textarea'>;

export function TextAreaField({
  label,
  error,
  hint,
  className,
  required,
  rows = 5,
  ...props
}: TextAreaFieldProps) {
  const ids = useFieldIds(error, hint);
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required}>
        {label}
      </Label>
      <textarea
        id={ids.id}
        rows={rows}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={ids.describedBy}
        className={cn(control, 'py-3 leading-relaxed')}
        {...props}
      />
      <FieldMessages {...ids} hint={hint} error={error} />
    </div>
  );
}

type SelectFieldProps = FieldMeta & ComponentProps<'select'>;

export function SelectField({
  label,
  error,
  hint,
  className,
  required,
  children,
  ...props
}: SelectFieldProps) {
  const ids = useFieldIds(error, hint);
  return (
    <div className={className}>
      <Label htmlFor={ids.id} required={required}>
        {label}
      </Label>
      <select
        id={ids.id}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={ids.describedBy}
        className={cn(control, 'h-12 pr-8')}
        {...props}
      >
        {children}
      </select>
      <FieldMessages {...ids} hint={hint} error={error} />
    </div>
  );
}

type CheckboxFieldProps = FieldMeta & Omit<ComponentProps<'input'>, 'type'>;

export function CheckboxField({ label, error, hint, className, ...props }: CheckboxFieldProps) {
  const ids = useFieldIds(error, hint);
  return (
    <div className={className}>
      <div className="flex min-h-11 items-start gap-3">
        <input
          id={ids.id}
          type="checkbox"
          aria-invalid={!!error || undefined}
          aria-describedby={ids.describedBy}
          className="mt-0.5 size-5 shrink-0 accent-brand-700"
          {...props}
        />
        <label htmlFor={ids.id} className="text-[15px] leading-snug text-ink-900">
          {label}
        </label>
      </div>
      <div className="pl-8">
        <FieldMessages {...ids} hint={hint} error={error} />
      </div>
    </div>
  );
}

/** 폼 전체 오류(서버 응답 등) — 스크린 리더가 바로 읽도록 role="alert" */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-danger-700/30 bg-danger-50 p-3 text-[15px] text-danger-700"
    >
      <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
