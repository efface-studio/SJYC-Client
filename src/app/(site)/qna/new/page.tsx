'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Button, buttonClass } from '@/components/ui/button';
import { CheckboxField, FormError, SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { INQUIRY_CATEGORY_LABEL } from '@/domain/labels';
import { inquirySchema, parseForm, type FieldErrors } from '@/domain/schemas';
import { RequireAuth } from '@/features/auth/guards';

function InquiryForm() {
  const router = useRouter();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<FieldErrors>({});
  const create = useMutation({
    mutationFn: api.inquiries.create,
    onSuccess: (q) => {
      void qc.invalidateQueries({ queryKey: ['my-inquiries'] });
      router.replace(`/qna/${q.id}`);
    },
    onError: (e) => {
      if (isApiError(e) && e.fieldErrors) setErrors(e.fieldErrors);
    },
  });

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (create.isPending) return;
        const parsed = parseForm(inquirySchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        create.mutate(parsed.data);
      }}
      className="space-y-4"
    >
      <SelectField
        label="분류"
        name="category"
        required
        placeholder="선택해 주세요"
        error={errors.category}
        options={Object.entries(INQUIRY_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
      />
      <TextField label="제목" name="title" maxLength={100} required error={errors.title} />
      <TextAreaField
        label="내용"
        name="body"
        rows={7}
        maxLength={3000}
        required
        hint="주민등록번호 등 민감한 개인정보는 적지 마세요."
        error={errors.body}
      />
      <CheckboxField
        name="agreePrivacy"
        label="[필수] 문의 답변을 위해 작성자 이름과 문의 내용을 센터 담당자가 확인하는 데 동의합니다."
        error={errors.agreePrivacy}
      />
      <FormError message={create.isError ? errorMessage(create.error) : null} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Link href="/qna" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
          취소
        </Link>
        <Button type="submit" size="lg" loading={create.isPending}>
          문의 등록
        </Button>
      </div>
    </form>
  );
}

export default function NewInquiryPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <title>문의하기 | 중구청소년센터</title>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="문의하기"
          breadcrumbs={[{ label: '질문·문의', href: '/qna' }, { label: '문의하기' }]}
        />
        <RequireAuth>
          <InquiryForm />
        </RequireAuth>
      </div>
    </div>
  );
}
