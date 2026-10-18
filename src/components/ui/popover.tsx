'use client';

import { useCallback, useLayoutEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const DESKTOP = '(min-width: 48rem)';

/**
 * 컨트롤에 붙는 팝오버 — 브라우저 Popover API(top layer)라 다이얼로그 안에서도 잘리지 않고,
 * 바깥 클릭·Esc 닫기와 닫힐 때 포커스 복원을 브라우저가 처리한다.
 * 데스크톱: 컨트롤 아래(공간이 없으면 위)에 붙는 드롭다운 / 모바일: 하단 시트.
 */
export function useAnchoredPopover() {
  const panelId = useId();
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback(() => panelRef.current?.showPopover?.(), []);
  const hide = useCallback(() => panelRef.current?.hidePopover?.(), []);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor || !window.matchMedia(DESKTOP).matches) {
        panel.style.removeProperty('top');
        panel.style.removeProperty('left');
        panel.style.removeProperty('min-width');
        return;
      }
      const r = anchor.getBoundingClientRect();
      const h = panel.offsetHeight;
      const spaceBelow = window.innerHeight - r.bottom;
      const top = spaceBelow < h + 8 && r.top > spaceBelow ? r.top - h - 4 : r.bottom + 4;
      const left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8));
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.minWidth = `${r.width}px`;
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  return {
    open,
    show,
    hide,
    anchorProps: {
      ref: anchorRef,
      popoverTarget: panelId,
      'aria-expanded': open,
      'aria-controls': panelId,
    },
    panelProps: {
      ref: panelRef,
      id: panelId,
      onToggle: (e: React.ToggleEvent<HTMLDivElement>) => setOpen(e.newState === 'open'),
    },
  };
}

interface PopoverPanelProps {
  panelProps: ReturnType<typeof useAnchoredPopover>['panelProps'];
  open: boolean;
  /** 모바일 하단 시트 제목 (데스크톱 드롭다운에서는 숨김) */
  title: ReactNode;
  className?: string;
  children: ReactNode;
}

export function PopoverPanel({ panelProps, open, title, className, children }: PopoverPanelProps) {
  return (
    <div
      {...panelProps}
      popover="auto"
      className={cn(
        'm-0 border-0 bg-surface p-0 text-ink-900 shadow-overlay',
        // 모바일: 하단 시트
        'inset-x-0 top-auto bottom-0 max-h-[70dvh] w-full max-w-none rounded-t-lg pb-[env(safe-area-inset-bottom)] backdrop:bg-black/40',
        // 데스크톱: 드롭다운 (top/left 는 JS 로 지정)
        'md:inset-auto md:max-h-96 md:w-auto md:rounded-md md:border md:border-line md:pb-0 md:backdrop:bg-transparent',
        className,
      )}
    >
      {/* 열릴 때만 내용을 그린다 — 닫힌 목록이 접근성 트리·탭 순서에 남지 않게 */}
      {open && (
        <div className="flex max-h-[inherit] flex-col">
          <p className="border-b border-line px-5 py-3.5 text-[17px] font-bold md:hidden">{title}</p>
          {children}
        </div>
      )}
    </div>
  );
}
