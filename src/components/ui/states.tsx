import { AlertTriangle, Inbox, Info, Lock, RotateCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { errorMessage } from '@/api/errors';
import { cn } from '@/lib/cn';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('motion-safe:animate-pulse rounded-md bg-line/60', className)} />;
}

/** 목록 로딩 — 실제 레이아웃과 비슷한 자리 표시 */
export function ListSkeleton({ rows = 4, label = '불러오는 중' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 rounded-md border border-line p-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

interface StateProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

function StateBox({
  icon,
  title,
  description,
  action,
  className,
  role,
}: StateProps & { icon: ReactNode; role?: string }) {
  return (
    <div role={role} className={cn('flex flex-col items-center px-4 py-12 text-center', className)}>
      <div className="mb-3 text-ink-600">{icon}</div>
      <p className="text-base font-bold text-ink-900">{title}</p>
      {description && <div className="mt-1 max-w-md text-[15px] text-ink-600">{description}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <StateBox icon={<Inbox aria-hidden className="size-8" />} {...props} />;
}

export function ErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <StateBox
      role="alert"
      icon={<AlertTriangle aria-hidden className="size-8 text-danger-700" />}
      title="정보를 불러오지 못했습니다"
      description={errorMessage(error)}
      className={className}
      action={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            <RotateCw aria-hidden className="size-4" />
            다시 시도
          </Button>
        )
      }
    />
  );
}

export function ForbiddenState({ description, action }: { description?: ReactNode; action?: ReactNode }) {
  return (
    <StateBox
      role="alert"
      icon={<Lock aria-hidden className="size-8" />}
      title="접근 권한이 없습니다"
      description={description ?? '이 화면을 볼 수 있는 권한이 없습니다. 필요한 경우 센터에 문의해 주세요.'}
      action={action}
    />
  );
}

const CALLOUT = {
  info: 'border-info-700/25 bg-info-50 text-info-700',
  warning: 'border-warning-800/25 bg-warning-50 text-warning-800',
  brand: 'border-brand-200 bg-brand-50 text-brand-800',
} as const;

export function Callout({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof CALLOUT;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('flex gap-2 rounded-md border p-3 text-[15px] leading-relaxed', CALLOUT[tone], className)}
    >
      <Info aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        {title && <p className="font-bold">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
