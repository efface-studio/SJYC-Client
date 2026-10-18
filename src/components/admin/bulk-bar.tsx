import type { ReactNode } from 'react';

/**
 * 선택한 행에 대한 일괄 작업 바. 모바일은 화면 하단 고정(안전 영역 여백 포함),
 * 데스크톱은 표 바로 위에 놓인다. 모바일에서 마지막 행이 가려지지 않도록 목록 뒤에 <BulkBarSpacer /> 를 둔다.
 */
export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div
      role="region"
      aria-label="선택 항목 작업"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-line-strong bg-surface px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:static md:mb-2 md:border md:border-line md:px-3 md:py-2"
    >
      <p className="mr-auto text-[15px]">
        <strong className="tabular-nums">{count}</strong>건 선택
        <button
          type="button"
          onClick={onClear}
          className="ml-2 inline-flex min-h-11 items-center px-1 text-sm text-ink-600 underline"
        >
          선택 해제
        </button>
      </p>
      {children}
    </div>
  );
}

/** 모바일 고정 바 높이만큼의 여백 — 목록 맨 뒤에 둔다 */
export function BulkBarSpacer({ count }: { count: number }) {
  return count > 0 ? <div aria-hidden className="h-20 md:hidden" /> : null;
}
