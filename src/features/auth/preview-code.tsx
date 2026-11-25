'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { api, errorMessage } from '@/api';
import { TextField } from '@/components/ui/field';
import { Button, buttonClass } from '@/components/ui/button';

export function PreviewCode({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const verify = useMutation({ mutationFn: () => api.auth.confirmPreviewCode(code) });
  return (
    <div className="container-page py-12">
      <div className="account-sheet mx-auto max-w-md">
        <h1 className="text-2xl font-bold">{verify.isSuccess ? '가입이 완료되었습니다' : '이메일 인증'}</h1>
        {verify.isSuccess ? (
          <Link className={buttonClass({ size: 'lg' }) + ' mt-6'} href="/login">
            로그인하기
          </Link>
        ) : (
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!verify.isPending && code.length === 6) verify.mutate();
            }}
          >
            <p className="break-all">{email}</p>
            <TextField
              label="인증 코드"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ''));
                verify.reset();
              }}
              hint="테스트 코드 284600을 입력해 주세요. 실제 메일은 발송되지 않습니다."
              error={
                verify.isError
                  ? verify.error instanceof Error
                    ? verify.error.message
                    : errorMessage(verify.error)
                  : undefined
              }
            />
            <Button block size="lg" type="submit" disabled={code.length !== 6} loading={verify.isPending}>
              확인
            </Button>
            <Link className="text-sm underline" href="/signup">
              회원가입으로 돌아가기
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
