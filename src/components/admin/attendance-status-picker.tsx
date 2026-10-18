'use client';

import { useRef, type KeyboardEvent } from 'react';
import { ATTENDANCE_STATUS } from '@/domain/labels';
import type { AttendanceStatus } from '@/domain/types';
import { cn } from '@/lib/cn';

const ORDER: AttendanceStatus[] = ['present', 'late', 'absent', 'excused'];

const ACTIVE: Record<AttendanceStatus, string> = {
  present: 'border-success-700 bg-success-700 text-white',
  late: 'border-warning-800 bg-warning-800 text-white',
  absent: 'border-danger-700 bg-danger-700 text-white',
  excused: 'border-info-700 bg-info-700 text-white',
};

interface Props {
  label: string;
  value: AttendanceStatus | null;
  onChange: (next: AttendanceStatus | null) => void;
  disabled?: boolean;
}

/**
 * 출석 상태 한 번에 고르기 (라디오 그룹). 선택된 항목을 다시 누르면 체크를 해제한다.
 * 키보드: ←→ 로 이동하며 선택.
 */
export function AttendanceStatusPicker({ label, value, onChange, disabled }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const focusIndex = value ? ORDER.indexOf(value) : 0;

  const onKey = (e: KeyboardEvent, i: number) => {
    const forward = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
    if (!forward && !back) return;
    e.preventDefault();
    const next = ORDER[(i + (forward ? 1 : -1) + ORDER.length) % ORDER.length]!;
    onChange(next);
    ref.current?.querySelector<HTMLButtonElement>(`[data-status="${next}"]`)?.focus();
  };

  return (
    <div ref={ref} role="radiogroup" aria-label={label} className="grid grid-cols-4 gap-1">
      {ORDER.map((s, i) => {
        const checked = value === s;
        return (
          <button
            key={s}
            type="button"
            role="radio"
            data-status={s}
            aria-checked={checked}
            tabIndex={i === focusIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(checked ? null : s)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'h-10 min-w-12 rounded-md border px-2 text-[15px] font-semibold transition-colors disabled:opacity-50',
              checked ? ACTIVE[s] : 'border-line-strong bg-surface text-ink-700 hover:bg-surface-muted',
            )}
          >
            {ATTENDANCE_STATUS[s].text}
          </button>
        );
      })}
    </div>
  );
}
