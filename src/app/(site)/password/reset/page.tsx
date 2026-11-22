'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button, buttonClass } from '@/components/ui/button';
import { FormError, PasswordField } from '@/components/ui/field';
import { Callout, ListSkeleton } from '@/components/ui/states';
import { parseForm, resetPasswordSchema, type FieldErrors } from '@/domain/schemas';

function ResetForm() {
  const token = useSearchParams().get('token');
  const [errors, setErrors] = useState<FieldErrors>({});
  const reset = useMutation({
    mutationFn: (password: string) => api.auth.resetPassword(token ?? '', password),
  });

  if (!token) {
    return (
      <Callout tone="warning" title="재설정 링크가 올바르지 않습니다">
        메일로 받은 링크를 다시 열거나{' '}
        <Link href="/password/forgot" className="font-semibold underline">
          재설정 링크를 다시 요청
        </Link>
        해 주세요.
      </Callout>
    );
  }

  if (reset.isSuccess) {
    return (
      <>
        <Callout tone="info" title="비밀번호를 변경했습니다">
          새 비밀번호로 로그인해 주세요.
        </Callout>
        <Link href="/login" className={`${buttonClass({ size: 'lg', block: true })} mt-6`}>
          로그인
        </Link>
      </>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (reset.isPending) return;
        const parsed = parseForm(resetPasswordSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        reset.mutate(parsed.data.password);
      }}
      className="space-y-4"
    >
      <PasswordField
        label="새 비밀번호"
        name="password"
        autoComplete="new-password"
        required
        hint="8~64자, 영문과 숫자를 포함해 주세요."
        error={errors.password}
      />
      <PasswordField
        label="새 비밀번호 확인"
        name="passwordConfirm"
        autoComplete="new-password"
        required
        error={errors.passwordConfirm}
      />
      <FormError message={reset.isError ? errorMessage(reset.error) : null} />
      <Button type="submit" size="lg" block loading={reset.isPending}>
        비밀번호 변경
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container-page py-8 md:py-14">
      <title>비밀번호 재설정 | 중구청소년센터</title>
      <div className="account-sheet mx-auto">
        <h1 className="mb-6 text-2xl font-bold">비밀번호 재설정</h1>
        <Suspense fallback={<ListSkeleton rows={1} />}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
