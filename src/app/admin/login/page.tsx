'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useRef, useState } from 'react';
import { api, errorMessage } from '@/api';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/api/mock/seed';
import { AdminTitle } from '@/components/admin/admin-page';
import { Logo } from '@/components/site/site-header';
import { Button, buttonClass } from '@/components/ui/button';
import { FormError, PasswordField, TextField } from '@/components/ui/field';
import { Callout, ListSkeleton } from '@/components/ui/states';
import { IS_MOCK } from '@/config/env';
import { OAUTH_ERROR_MESSAGE } from '@/config/oauth';
import { can } from '@/domain/permissions';
import { loginSchema, parseForm, type FieldErrors } from '@/domain/schemas';
import { SESSION_KEY, useLogout, useSession } from '@/features/auth/session';
import { safeRedirect } from '@/lib/safe-redirect';

const ADMIN_DEMO = DEMO_ACCOUNTS.filter(
  (a) => a.email === 'staff@demo.test' || a.email === 'admin@demo.test',
);

/** next 는 /admin 하위 경로만 허용한다 (/admin/login 자체 제외) */
function adminRedirect(target: string | null): string {
  const path = safeRedirect(target, '/admin');
  const pathname = path.split(/[?#]/)[0] ?? '';
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
  return isAdmin && !pathname.startsWith('/admin/login') ? path : '/admin';
}

function AdminLoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: session } = useSession();
  const logout = useLogout();
  const next = params.get('next');
  const errorCode = params.get('error');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const login = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (s) => {
      // 역할 판단은 서버가 돌려준 세션만 근거로 한다 (URL 값은 신뢰하지 않음)
      if (!can(s.user, 'admin.access')) {
        setFormError('관리자 권한이 없는 계정입니다.');
        logout.mutate();
        return;
      }
      qc.setQueryData(SESSION_KEY, s);
      router.replace(adminRedirect(next));
    },
    onError: (error) => {
      setFormError(errorMessage(error));
      passwordRef.current?.focus();
    },
  });

  if (session && can(session.user, 'admin.access') && !login.isPending && !login.isSuccess) {
    return (
      <Callout tone="info" title="이미 로그인되어 있습니다">
        <Link href={adminRedirect(next)} className="font-semibold underline">
          관리자 화면으로 이동
        </Link>
      </Callout>
    );
  }

  const busy = login.isPending || logout.isPending;

  return (
    <>
      {errorCode && OAUTH_ERROR_MESSAGE[errorCode] && (
        <Callout tone="warning" className="mb-5">
          {OAUTH_ERROR_MESSAGE[errorCode]}
        </Callout>
      )}
      {session && !can(session.user, 'admin.access') && (
        <Callout tone="info" className="mb-5">
          현재 관리자 권한이 없는 계정으로 로그인되어 있습니다. 관리자 계정으로 다시 로그인해 주세요.
        </Callout>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (busy) return;
          setFormError(null);
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
        <Button type="submit" size="lg" block loading={busy}>
          관리자 로그인
        </Button>
      </form>

      {IS_MOCK && (
        <div className="mt-6 border-t border-dashed border-line-strong pt-4">
          <p className="text-sm font-semibold text-ink-700">개발용 데모 계정으로 입력</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {ADMIN_DEMO.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => {
                  if (emailRef.current) emailRef.current.value = a.email;
                  if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
                }}
                className="min-h-11 rounded-md border border-line-strong bg-surface px-2 text-sm font-semibold hover:bg-surface-muted"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-admin">
      <AdminTitle>로그인</AdminTitle>
      <main
        id="main"
        tabIndex={-1}
        className="flex flex-1 items-start justify-center px-4 py-10 focus:outline-none md:items-center"
      >
        <div className="w-full max-w-sm border border-line bg-surface p-6">
          <div className="flex items-center gap-2">
            <Logo className="[&_img]:h-6 md:[&_img]:h-6" />
          </div>
          <h1 className="mt-5 text-xl font-bold">관리자 로그인</h1>
          <p className="mt-1 mb-5 text-sm text-ink-600">센터 직원·관리자 계정만 이용할 수 있습니다.</p>
          <Suspense fallback={<ListSkeleton rows={2} />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </main>
      <p className="pb-6 text-center">
        <Link href="/" className={buttonClass({ variant: 'tertiary', size: 'sm' })}>
          사용자 화면으로
        </Link>
      </p>
    </div>
  );
}
