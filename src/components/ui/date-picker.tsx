'use client';

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { addDays, weekdayOf } from '@/domain/space';
import { monthGrid, shiftMonth } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import { todayKst } from '@/lib/format';
import { PopoverPanel, useAnchoredPopover } from './popover';
import { controlBase } from './select';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' → '2026. 10. 18. (일)' */
export function formatPickerDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${y}. ${Number(m)}. ${Number(d)}. (${WEEKDAYS[weekdayOf(date)]})`;
}

function spoken(date: string): string {
  const [y, m, d] = date.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일 ${WEEKDAYS[weekdayOf(date)]}요일`;
}

export interface DatePickerProps {
  id?: string;
  /** 폼 전송용 이름 — 숨김 input 으로 'YYYY-MM-DD' 를 보낸다 */
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 고를 수 있는 범위 (포함, 'YYYY-MM-DD') */
  min?: string;
  max?: string;
  placeholder?: string;
  /** 모바일 하단 시트 제목 */
  title: ReactNode;
  /** 값 지우기 버튼 표시 */
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  size?: 'md' | 'lg';
}

/**
 * 자체 날짜 선택 (달력 그리드).
 * 키보드: ←→ 하루, ↑↓ 한 주, PageUp/PageDown 한 달, Home/End 주의 처음·끝, Enter 선택, Esc 닫기.
 */
export function DatePicker({
  id,
  name,
  value,
  defaultValue = '',
  onValueChange,
  min,
  max,
  placeholder = '날짜 선택',
  title,
  clearable,
  disabled,
  invalid,
  describedBy,
  className,
  size = 'lg',
}: DatePickerProps) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const valid = DATE_RE.test(current) ? current : '';
  const { open, hide, anchorProps, panelProps } = useAnchoredPopover();
  const today = todayKst();
  const [focusDate, setFocusDate] = useState(valid || today);
  const gridRef = useRef<HTMLTableElement>(null);
  const month = focusDate.slice(0, 7);

  const outOfRange = (d: string) => (!!min && d < min) || (!!max && d > max);

  useEffect(() => {
    if (open) setFocusDate(valid || (min && today < min ? min : today));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 열릴 때 한 번만
  }, [open]);

  useEffect(() => {
    if (open) gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [open, focusDate]);

  function commit(next: string) {
    if (next && outOfRange(next)) return;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
    hide();
  }

  function onGridKey(e: KeyboardEvent) {
    const wd = weekdayOf(focusDate);
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      Home: () => addDays(focusDate, -wd),
      End: () => addDays(focusDate, 6 - wd),
      PageUp: () => shiftDate(focusDate, -1),
      PageDown: () => shiftDate(focusDate, 1),
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    setFocusDate(next());
  }

  return (
    <>
      <button
        {...anchorProps}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(controlBase, size === 'lg' ? 'h-12' : 'h-11', className)}
      >
        <span className={cn('min-w-0 flex-1 truncate tabular-nums', !valid && 'text-ink-600')}>
          {valid ? formatPickerDate(valid) : placeholder}
        </span>
        <CalendarDays aria-hidden className="size-4 shrink-0 text-ink-600" />
      </button>
      {name && <input type="hidden" name={name} value={valid} />}
      <PopoverPanel panelProps={panelProps} open={open} title={title} className="md:max-h-none md:w-80">
        <div
          role="dialog"
          aria-label={`${typeof title === 'string' ? title : '날짜'} 선택`}
          className="px-4 pt-3 pb-4"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setFocusDate(shiftDate(focusDate, -1))}
              aria-label="이전 달"
              className="flex size-11 items-center justify-center rounded-md text-ink-700 hover:bg-surface-muted"
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <p aria-live="polite" className="text-base font-bold tabular-nums">
              {month.slice(0, 4)}년 {Number(month.slice(5))}월
            </p>
            <button
              type="button"
              onClick={() => setFocusDate(shiftDate(focusDate, 1))}
              aria-label="다음 달"
              className="flex size-11 items-center justify-center rounded-md text-ink-700 hover:bg-surface-muted"
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>
          <table
            ref={gridRef}
            role="grid"
            className="w-full table-fixed border-collapse"
            onKeyDown={onGridKey}
          >
            <thead>
              <tr>
                {WEEKDAYS.map((w, i) => (
                  <th
                    key={w}
                    scope="col"
                    abbr={`${w}요일`}
                    className={cn(
                      'pb-1 text-xs font-semibold text-ink-600',
                      i === 0 && 'text-danger-700',
                      i === 6 && 'text-info-700',
                    )}
                  >
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(month).map((week) => (
                <tr key={week[0]}>
                  {week.map((d) => {
                    const inMonth = d.startsWith(month);
                    const isSelected = d === valid;
                    const isToday = d === today;
                    const blocked = outOfRange(d);
                    return (
                      <td key={d} className="p-0.5 text-center">
                        <button
                          type="button"
                          data-date={d}
                          tabIndex={d === focusDate ? 0 : -1}
                          aria-label={spoken(d)}
                          aria-pressed={isSelected}
                          aria-current={isToday ? 'date' : undefined}
                          disabled={blocked}
                          onClick={() => commit(d)}
                          className={cn(
                            'mx-auto flex size-10 items-center justify-center rounded-full text-[15px] tabular-nums',
                            'hover:bg-surface-muted focus-visible:outline-offset-0',
                            !inMonth && 'text-ink-600/60',
                            isToday && !isSelected && 'font-bold text-brand-700 underline underline-offset-4',
                            isSelected && 'bg-brand-700 font-bold text-white hover:bg-brand-800',
                            blocked && 'cursor-not-allowed text-ink-600/30 line-through hover:bg-transparent',
                          )}
                        >
                          {Number(d.slice(8))}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <button
              type="button"
              disabled={outOfRange(today)}
              onClick={() => commit(today)}
              className="min-h-11 rounded-md px-3 text-[15px] font-semibold text-brand-700 hover:bg-brand-50 disabled:text-ink-600/50"
            >
              오늘
            </button>
            {clearable && valid && (
              <button
                type="button"
                onClick={() => commit('')}
                className="min-h-11 rounded-md px-3 text-[15px] font-semibold text-ink-700 hover:bg-surface-muted"
              >
                지우기
              </button>
            )}
          </div>
        </div>
      </PopoverPanel>
    </>
  );
}

/** 같은 날짜로 n개월 이동 (말일은 그 달 마지막 날로 맞춘다) */
function shiftDate(date: string, n: number): string {
  const target = shiftMonth(date.slice(0, 7), n);
  const last = monthGrid(target)
    .flat()
    .filter((d) => d.startsWith(target))
    .at(-1)!;
  const candidate = `${target}-${date.slice(8)}`;
  return candidate > last ? last : candidate;
}
