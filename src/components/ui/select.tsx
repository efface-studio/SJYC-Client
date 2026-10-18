'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { PopoverPanel, useAnchoredPopover } from './popover';

export interface SelectOption {
  value: string;
  label: string;
  /** 같은 group 끼리 묶어 제목과 함께 보여준다 */
  group?: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  /** 폼 전송용 이름 — 숨김 input 으로 값을 보낸다 */
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  /** 모바일 하단 시트 제목 */
  title: ReactNode;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
  size?: 'md' | 'lg';
}

export const controlBase =
  'flex w-full items-center gap-2 rounded-md border border-line-strong bg-surface px-3 text-left text-base text-ink-900 ' +
  'hover:border-ink-600 focus-visible:border-brand-700 aria-expanded:border-brand-700 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-600 aria-invalid:border-danger-700';

/**
 * 자체 셀렉트 (WAI-ARIA listbox 패턴).
 * 키보드: ↑↓ 열기·이동, Home/End, Enter·Space 선택, Esc 닫기, 글자 입력으로 찾기.
 */
export function Select({
  id,
  name,
  value,
  defaultValue = '',
  onValueChange,
  options,
  placeholder = '선택',
  title,
  disabled,
  invalid,
  describedBy,
  className,
  size = 'lg',
}: SelectProps) {
  const autoId = useId();
  const buttonId = id ?? autoId;
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  const { open, show, hide, anchorProps, panelProps } = useAnchoredPopover();
  const listRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(-1);
  const typed = useRef({ text: '', at: 0 });

  // 열리면 선택된 항목(없으면 첫 항목)에 커서를 두고 목록으로 포커스를 옮긴다
  useEffect(() => {
    if (!open) return;
    const start = options.findIndex((o) => o.value === current);
    setActive(start >= 0 ? start : options.findIndex((o) => !o.disabled));
    listRef.current?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 열릴 때 한 번만
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) {
      listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, active]);

  function choose(index: number) {
    const o = options[index];
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onValueChange?.(o.value);
    hide();
  }

  function move(from: number, step: 1 | -1) {
    for (let i = from + step; i >= 0 && i < options.length; i += step) {
      if (!options[i]?.disabled) return i;
    }
    return from;
  }

  function onListKey(e: KeyboardEvent) {
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive((a) => move(a, 1)),
      ArrowUp: () => setActive((a) => move(a, -1)),
      Home: () => setActive(move(-1, 1)),
      End: () => setActive(move(options.length, -1)),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Tab: () => hide(),
    };
    const run = keys[e.key];
    if (run) {
      if (e.key !== 'Tab') e.preventDefault();
      run();
      return;
    }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current.text = (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase();
      typed.current.at = now;
      const hit = options.findIndex(
        (o) => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text),
      );
      if (hit >= 0) setActive(hit);
    }
  }

  const groups = groupOptions(options);

  return (
    <>
      <button
        {...anchorProps}
        id={buttonId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
        className={cn(controlBase, size === 'lg' ? 'h-12' : 'h-11', className)}
      >
        <span className={cn('min-w-0 flex-1 truncate', !selected && 'text-ink-600')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden
          className={cn('size-4 shrink-0 text-ink-600 transition-transform', open && 'rotate-180')}
        />
      </button>
      {name && <input type="hidden" name={name} value={current} />}
      <PopoverPanel panelProps={panelProps} open={open} title={title}>
        <ul
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={buttonId}
          aria-activedescendant={active >= 0 ? `${buttonId}-opt-${active}` : undefined}
          onKeyDown={onListKey}
          className="overflow-y-auto overscroll-contain py-1 outline-none"
        >
          {groups.map(({ group, items }) => (
            <li key={group ?? '_'} role="presentation">
              {group && (
                <p role="presentation" className="px-4 pt-3 pb-1 text-xs font-semibold text-ink-600">
                  {group}
                </p>
              )}
              <ul role="group" aria-label={group}>
                {items.map(({ option, index }) => {
                  const isSelected = option.value === current;
                  return (
                    <li
                      key={`${option.value}-${index}`}
                      id={`${buttonId}-opt-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onPointerMove={() => !option.disabled && setActive(index)}
                      onClick={() => choose(index)}
                      className={cn(
                        'flex min-h-12 cursor-pointer items-center gap-3 px-4 text-base md:min-h-10 md:text-[15px]',
                        index === active && 'bg-surface-muted',
                        isSelected && 'font-semibold text-brand-700',
                        option.disabled && 'cursor-not-allowed text-ink-600/60',
                      )}
                    >
                      <span className="min-w-0 flex-1">{option.label}</span>
                      {isSelected && <Check aria-hidden className="size-4 shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </PopoverPanel>
    </>
  );
}

function groupOptions(options: SelectOption[]) {
  const out: { group?: string; items: { option: SelectOption; index: number }[] }[] = [];
  options.forEach((option, index) => {
    const last = out.at(-1);
    if (last && last.group === option.group) last.items.push({ option, index });
    else out.push({ group: option.group, items: [{ option, index }] });
  });
  return out;
}
