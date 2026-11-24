import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { isApiError } from '@/api';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';

interface QueryStateProps<T> {
  query: UseQueryResult<T>;
  /** 비어 있음 판정 — 생략하면 빈 상태를 쓰지 않는다 */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  notFound?: string;
  rows?: number;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}

/** 로딩 · 오류(재시도) · 404 · 빈 상태를 한 곳에서 처리한다 */
export function QueryState<T>({
  query,
  isEmpty,
  empty,
  notFound,
  rows = 4,
  loading,
  children,
}: QueryStateProps<T>) {
  if (query.isPending) return loading ?? <ListSkeleton rows={rows} />;
  if (query.isError) {
    if (notFound && isApiError(query.error, 'NOT_FOUND')) return <EmptyState title={notFound} />;
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (isEmpty?.(query.data)) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
