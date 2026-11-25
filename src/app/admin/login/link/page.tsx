'use client';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AdminTitle } from '@/components/admin/admin-page';
import { Logo } from '@/components/site/site-header';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import { TextField, PasswordField, FormError } from '@/components/ui/field';
import { OAUTH_PROVIDER_LABEL } from '@/domain/labels';
import { adminRedirect } from '@/lib/safe-redirect';

export default function AdminLinkPage() {
  const pending = useQuery({
    queryKey: ['admin-social-link'],
    queryFn: api.auth.adminSocialLink,
    retry: false,
    gcTime: 0,
  });
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState('');
  const link = useMutation({
    mutationFn: api.auth.linkAdminSocial,
    onSuccess: () =>
      window.location.replace(adminRedirect(new URLSearchParams(window.location.search).get('next'))),
  });
  return (
    <main className="grid min-h-dvh items-center bg-surface px-6 py-12">
      <AdminTitle>관리자 계정 연결</AdminTitle>
      <div className="mx-auto w-full max-w-md">
        <Logo className="mb-8 [&_img]:h-7" />
        <h1 className="mb-3 text-2xl font-bold">관리자 계정 연결</h1>
        {pending.isPending ? (
          <p role="status">연결 요청을 확인하고 있습니다.</p>
        ) : pending.isError ? (
          <p role="alert">{errorMessage(pending.error)}</p>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!link.isPending) link.mutate({ email, password });
            }}
          >
            <p>
              {OAUTH_PROVIDER_LABEL[pending.data.provider]}로 로그인하려면 기존 관리자 계정의 이메일과
              비밀번호를 입력해 주세요.
            </p>
            <TextField
              label="관리자 이메일"
              autoComplete="username"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordField
              label="비밀번호"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormError message={link.isError ? errorMessage(link.error) : null} />
            <Button size="lg" type="submit" loading={link.isPending}>
              계정 연결하고 로그인
            </Button>
          </form>
        )}
        <Link
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
          href="/admin/login"
        >
          관리자 로그인으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
