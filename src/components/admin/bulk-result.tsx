import type { BulkResult } from '@/domain/types';

/** 일괄 처리 결과 — 성공/실패 건수와 실패 사유 */
export function BulkResultView({
  result,
  nameOf,
  onDismiss,
}: {
  result: BulkResult;
  nameOf: (id: string) => string;
  onDismiss: () => void;
}) {
  return (
    <div role="status" className="console-surface mb-4 p-3 text-[15px]">
      <div className="flex items-start justify-between gap-2">
        <p>
          처리 결과: 성공 <strong className="text-success-700 tabular-nums">{result.succeeded.length}</strong>
          건 / 실패{' '}
          <strong className={result.failed.length ? 'text-danger-700 tabular-nums' : 'tabular-nums'}>
            {result.failed.length}
          </strong>
          건
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="-my-2 inline-flex min-h-11 items-center px-2 text-sm text-ink-600 underline"
        >
          닫기
        </button>
      </div>
      {result.failed.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink-700">
          {result.failed.map((f) => (
            <li key={f.id}>
              {nameOf(f.id)} — {f.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
