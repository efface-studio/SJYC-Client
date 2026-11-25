'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  /** dialog: 화면 중앙 / drawer: 좌측에서 열리는 메뉴 */
  variant?: 'dialog' | 'drawer' | 'command';
  className?: string;
  bodyClassName?: string;
}

/**
 * 네이티브 <dialog>.showModal() — 포커스 가두기, Esc 닫기, 배경 비활성화(inert),
 * 닫힐 때 이전 포커스 복원을 브라우저가 처리한다.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  variant = 'dialog',
  className,
  bodyClassName,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // 배경(backdrop) 클릭 시 닫기
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'bg-surface p-0 text-ink-900 shadow-overlay backdrop:bg-black/45',
        variant === 'dialog' &&
          'm-auto max-h-[85dvh] w-[calc(100%-32px)] max-w-lg overflow-hidden rounded-lg',
        variant === 'drawer' && 'm-0 h-dvh max-h-dvh w-[min(320px,86vw)] max-w-none overflow-hidden',
        className,
      )}
    >
      {open && (
        <div className={cn('flex max-h-[inherit] flex-col', variant === 'drawer' && 'h-full')}>
          {variant === 'command' ? (
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
          ) : (
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="닫기"
                className="-mr-2 flex size-11 items-center justify-center rounded-md text-ink-600 hover:bg-surface-muted"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          )}
          <div className={cn('overflow-y-auto overscroll-contain px-4 py-4', bodyClassName)}>{children}</div>
        </div>
      )}
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** 삭제·게시·승인 등 중요 작업 재확인 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = '취소',
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={loading ? () => undefined : onClose} title={title}>
      {description && <div className="text-[15px] leading-relaxed text-ink-700">{description}</div>}
      {children && <div className="mt-4">{children}</div>}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={destructive ? 'destructive' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
