'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import './login.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';

import { FormError, PasswordField, TextField } from '@/components/ui/field';
import { Callout, ListSkeleton } from '@/components/ui/states';
import { OAUTH_ERROR_MESSAGE } from '@/config/oauth';
import { LoginSubmit, useLoginFeedback } from '@/features/auth/login-feedback';
import { loginSchema, parseForm, type FieldErrors } from '@/domain/schemas';
import { PENDING_VERIFY_KEY, SESSION_KEY, useSession } from '@/features/auth/session';
import { SocialLoginButtons } from '@/features/auth/social-login';
import { memberRedirect } from '@/lib/safe-redirect';

function LoginForm() {
  const feedback = useLoginFeedback();
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
      feedback.finish(() => router.replace(memberRedirect(next)));
    },
    onError: (error, input) => {
      if (isApiError(error, 'FORBIDDEN') && error.message.includes('이메일 인증')) {
        setUnverifiedEmail(input.email);
      }
      feedback.fail();
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
        onChange={feedback.edit}
        onSubmit={(e) => {
          e.preventDefault();
          if (login.isPending || feedback.phase === 'success') return;
          setFormError(null);
          setUnverifiedEmail(null);
          const parsed = parseForm(loginSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            feedback.fail();
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          feedback.start();
          login.mutate(parsed.data);
        }}
        className="auth-form space-y-4"
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
        <LoginSubmit phase={feedback.phase} attempt={feedback.attempt} title="로그인" />
      </form>

      <nav className="login-help" aria-label="계정 도움말">
        <Link href="/password/forgot">비밀번호 찾기</Link>
        <Link href="/signup">회원가입</Link>
      </nav>
      <p className="login-alternatives">간편 로그인</p>
      <SocialLoginButtons next={next} />
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="member-login">
      <title>로그인 | 중구청소년센터</title>
      <section className="login-fields" aria-labelledby="login-heading">
        <h1 id="login-heading">로그인</h1>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <LoginForm />
        </Suspense>
        <Link href="/" className="login-back">
          로그인 없이 둘러보기
        </Link>
      </section>
    </div>
  );
}
