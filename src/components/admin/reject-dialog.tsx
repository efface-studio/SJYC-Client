'use client';

import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ui/dialog';
import { TextAreaField } from '@/components/ui/field';
import { rejectReasonSchema } from '@/domain/schemas';

interface RejectDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

/** 반려 확인 + 사유 입력. 사유는 신청자에게 그대로 안내되므로 필수 */
export function RejectDialog({ open, title, description, loading, onConfirm, onClose }: RejectDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const [wasOpen, setWasOpen] = useState(open);
  // 다시 열릴 때 이전 입력을 비운다 (렌더 중 상태 조정 패턴)
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setReason('');
      setError(undefined);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel="반려"
      destructive
      loading={loading}
      onClose={onClose}
      onConfirm={() => {
        const parsed = rejectReasonSchema.safeParse({ reason });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message);
          return;
        }
        onConfirm(parsed.data.reason);
      }}
    >
      <TextAreaField
        label="반려 사유"
        name="reason"
        required
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        hint="신청자 화면에 그대로 표시됩니다."
      />
    </ConfirmDialog>
  );
}
