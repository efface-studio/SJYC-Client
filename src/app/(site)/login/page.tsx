'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import './login.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/api/mock/seed';
import { Button } from '@/components/ui/button';
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
        <details className="login-demo">
          <summary>데모 계정으로 입력</summary>
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
        </details>
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
    <div className="member-login">
      <title>로그인 | 중구청소년센터</title>
      <div className="login-layout">
        <aside className="login-art" aria-label="중구청소년센터">
          <Image
            src="/media/center-exterior.webp"
            width={910}
            height={514}
            sizes="(min-width:800px) 40vw, 1px"
            alt="중구청소년센터 정문"
            priority
          />
          <div>
            <span>중구청소년센터</span>
            <p>
              프로그램 신청부터
              <br />
              공간 예약까지
            </p>
          </div>
        </aside>
        <section className="login-fields" aria-labelledby="login-heading">
          <h1 id="login-heading">로그인</h1>
          <Suspense fallback={<ListSkeleton rows={2} />}>
            <LoginForm />
          </Suspense>
          <Link href="/" className="login-back">
            <ArrowLeft aria-hidden size={16} />
            로그인 없이 둘러보기
          </Link>
        </section>
      </div>
    </div>
  );
}
