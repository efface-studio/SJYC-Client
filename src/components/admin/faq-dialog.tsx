'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import {
  CheckboxField,
  FormError,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { INQUIRY_CATEGORY_LABEL } from '@/domain/labels';
import { faqFormSchema, parseForm, type FaqFormInput, type FieldErrors } from '@/domain/schemas';
import type { Faq } from '@/domain/types';
import { serverFieldErrors } from './form-utils';

interface FaqDialogProps {
  open: boolean;
  /** null 이면 새 FAQ 등록 */
  faq: Faq | null;
  nextOrder: number;
  onClose: () => void;
}

/** FAQ 등록·수정 모달. 열 때마다 새로 마운트되도록 부모가 key 를 바꾼다 */
export function FaqDialog({ open, faq, nextOrder, onClose }: FaqDialogProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useMutation({
    mutationFn: (input: FaqFormInput) =>
      faq ? api.admin.faqs.update(faq.id, input) : api.admin.faqs.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'faqs'] });
      void qc.invalidateQueries({ queryKey: ['faqs'] });
      toast.success(faq ? 'FAQ를 저장했습니다.' : 'FAQ를 등록했습니다.');
      onClose();
    },
    onError: (e) => setErrors(serverFieldErrors(e)),
  });

  return (
    <Modal
      open={open}
      onClose={save.isPending ? () => undefined : onClose}
      title={faq ? 'FAQ 수정' : 'FAQ 등록'}
      className="max-w-2xl"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (save.isPending) return;
          const parsed = parseForm(faqFormSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          save.mutate(parsed.data);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <SelectField
            label="분류"
            name="category"
            required
            defaultValue={faq?.category ?? 'program'}
            error={errors.category}
            options={Object.entries(INQUIRY_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <NumberField
            label="표시 순서"
            name="order"
            min={0}
            max={999}
            required
            defaultValue={faq?.order ?? nextOrder}
            error={errors.order}
          />
        </div>
        <TextField
          label="질문"
          name="question"
          required
          maxLength={200}
          defaultValue={faq?.question}
          error={errors.question}
        />
        <TextAreaField
          label="답변"
          name="answer"
          required
          rows={8}
          maxLength={5000}
          defaultValue={faq?.answer}
          error={errors.answer}
        />
        <CheckboxField
          label="사용자 화면에 게시"
          name="published"
          defaultChecked={faq?.published ?? true}
          error={errors.published}
        />
        <FormError message={save.isError ? errorMessage(save.error) : null} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            취소
          </Button>
          <Button type="submit" loading={save.isPending}>
            {faq ? '저장' : '등록'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
