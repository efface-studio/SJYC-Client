'use client';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { mockDev } from '@/api/mock/client';
import { Button } from '@/components/ui/button';
import { FormError, TextField } from '@/components/ui/field';
import { Callout } from '@/components/ui/states';
import { IS_MOCK } from '@/config/env';
import { forgotPasswordSchema, parseForm, type FieldErrors } from '@/domain/schemas';

export default function ForgotPasswordPage() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const request = useMutation({ mutationFn: (email: string) => api.auth.requestPasswordReset(email) });
  const devToken = request.isSuccess && IS_MOCK ? mockDev.lastResetToken() : null;

  return (
    <div className="container-page py-8 md:py-14">
      <title>비밀번호 찾기 | 중구청소년센터</title>
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-bold">비밀번호 찾기</h1>
        <p className="mt-1 mb-6 text-[15px] text-ink-600">
          가입한 이메일로 비밀번호 재설정 링크를 보내 드립니다.
        </p>

        {request.isSuccess ? (
          <>
            {/* 가입 여부를 알 수 없도록 항상 같은 안내를 보여준다 */}
            <Callout tone="info" title="메일을 확인해 주세요">
              입력한 이메일로 가입된 계정이 있다면 재설정 링크를 보냈습니다. 링크는 일정 시간이 지나면
              만료됩니다.
            </Callout>
            {IS_MOCK && (
              <div className="mt-4 rounded-md border border-dashed border-warning-800/40 bg-warning-50 p-3 text-sm text-warning-800">
                <p className="font-bold">개발용 · 실제 메일은 발송되지 않습니다</p>
                {devToken ? (
                  <Link
                    href={`/password/reset?token=${devToken}`}
                    className="mt-1 inline-block min-h-11 font-semibold underline"
                  >
                    재설정 링크 열기
                  </Link>
                ) : (
                  <p className="mt-1">가입되지 않은 이메일이라 링크가 만들어지지 않았습니다.</p>
                )}
              </div>
            )}
            <Link href="/login" className="mt-6 inline-block font-semibold text-brand-700 underline">
              로그인 화면으로
            </Link>
          </>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (request.isPending) return;
              const parsed = parseForm(forgotPasswordSchema, new FormData(e.currentTarget));
              if (!parsed.ok) {
                setErrors(parsed.errors);
                return;
              }
              setErrors({});
              request.mutate(parsed.data.email);
            }}
            className="space-y-4"
          >
            <TextField
              label="이메일"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              required
              error={errors.email}
            />
            <FormError message={request.isError ? errorMessage(request.error) : null} />
            <Button type="submit" size="lg" block loading={request.isPending}>
              재설정 링크 받기
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
