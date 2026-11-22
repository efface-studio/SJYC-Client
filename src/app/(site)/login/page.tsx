'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/api/mock/seed';
import { Button, buttonClass } from '@/components/ui/button';
import { FormError, PasswordField, TextField } from '@/components/ui/field';
import { Callout, ListSkeleton } from '@/components/ui/states';
import { DEMO_DATA } from '@/config/env';
import { OAUTH_ERROR_MESSAGE } from '@/config/oauth';
import { loginSchema, parseForm, type FieldErrors } from '@/domain/schemas';
import { PENDING_VERIFY_KEY, SESSION_KEY, useSession } from '@/features/auth/session';
import { SocialLoginButtons } from '@/features/auth/social-login';
import { memberRedirect } from '@/lib/safe-redirect';

function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const next = params.get('next');
  const errorCode = params.get('error');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (s) => {
      qc.setQueryData(SESSION_KEY, s);
      // 이동 경로는 내부 경로만 허용하고, 회원 로그인으로는 관리자 화면에 보내지 않는다
      router.replace(memberRedirect(next));
    },
    onError: (error, input) => {
      if (isApiError(error, 'FORBIDDEN') && error.message.includes('이메일 인증')) {
        setUnverifiedEmail(input.email);
      }
      setFormError(errorMessage(error));
      passwordRef.current?.focus();
    },
  });

  if (session && !login.isPending && !login.isSuccess) {
    return (
      <Callout tone="info" title="이미 로그인되어 있습니다">
        <Link href="/my" className="font-semibold underline">
          마이페이지로 이동
        </Link>
      </Callout>
    );
  }

  return (
    <>
      {errorCode && OAUTH_ERROR_MESSAGE[errorCode] && (
        <Callout tone="warning" className="mb-5">
          {OAUTH_ERROR_MESSAGE[errorCode]}
        </Callout>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (login.isPending) return;
          setFormError(null);
          setUnverifiedEmail(null);
          const parsed = parseForm(loginSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          login.mutate(parsed.data);
        }}
        className="space-y-4"
      >
        <TextField
          ref={emailRef}
          label="이메일"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          required
          error={errors.email}
        />
        <PasswordField
          ref={passwordRef}
          label="비밀번호"
          name="password"
          autoComplete="current-password"
          required
          error={errors.password}
        />
        <FormError message={formError} />
        {unverifiedEmail && (
          <Link
            href="/signup/verify"
            onClick={() => sessionStorage.setItem(PENDING_VERIFY_KEY, unverifiedEmail)}
            className="block text-[15px] font-semibold text-brand-700 underline"
          >
            인증 메일 다시 받기
          </Link>
        )}
        <Button type="submit" size="lg" block loading={login.isPending}>
          로그인
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-1 text-[15px]">
        <Link
          href="/password/forgot"
          className="flex min-h-11 items-center px-2 text-ink-700 hover:underline"
        >
          비밀번호 찾기
        </Link>
        <span aria-hidden className="text-line-strong">
          |
        </span>
        <Link
          href="/signup"
          className="flex min-h-11 items-center px-2 font-semibold text-brand-700 hover:underline"
        >
          회원가입
        </Link>
      </div>

      {DEMO_DATA && (
        <div className="mt-6 rounded-md border border-dashed border-warning-800/40 bg-warning-50 p-3">
          <p className="text-sm font-bold text-warning-800">개발용 데모 계정으로 입력</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  if (emailRef.current) emailRef.current.value = a.email;
                  if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
                }}
                className="min-h-11 rounded-md border border-line-strong bg-surface px-2 text-sm font-semibold"
              >
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-warning-800">
            직원·관리자 계정도 이 화면에서는 회원 화면으로만 이동합니다. 관리자 화면은 /admin/login 에서
            들어갑니다.
          </p>
        </div>
      )}

      <div className="my-6 flex items-center gap-3 text-sm text-ink-600">
        <span className="h-px flex-1 bg-line" />
        또는 소셜 계정으로 로그인
        <span className="h-px flex-1 bg-line" />
      </div>
      <SocialLoginButtons next={next} />
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="container-page py-8 md:py-14">
      <title>로그인 | 중구청소년센터</title>
      <div className="account-sheet mx-auto">
        <h1 className="mb-6 text-2xl font-bold">로그인</h1>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <LoginForm />
        </Suspense>
        <p className="mt-8 text-center">
          <Link href="/" className={buttonClass({ variant: 'tertiary', size: 'sm' })}>
            로그인 없이 둘러보기
          </Link>
        </p>
      </div>
    </div>
  );
}
