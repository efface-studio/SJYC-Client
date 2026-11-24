'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormError, TextField } from '@/components/ui/field';
import { useToast } from '@/components/ui/toast';
import { useSocialProviders } from '@/features/auth/use-social-providers';
import { OAUTH_PROVIDERS, providerStates } from '@/config/oauth';
import { OAUTH_PROVIDER_LABEL } from '@/domain/labels';
import { parseForm, profileSchema, type FieldErrors } from '@/domain/schemas';
import type { ConsentRecord } from '@/domain/types';
import { SESSION_KEY, useSession } from '@/features/auth/session';
import { formatDate } from '@/lib/format';

const CONSENT_LABEL: Record<ConsentRecord['key'], string> = {
  terms: '이용약관',
  privacy: '개인정보 수집·이용',
  marketing: '프로그램 소식 안내 수신',
};

export default function ProfilePage() {
  const { data: session } = useSession();
  const qc = useQueryClient();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const available = useSocialProviders();
  const connect = useMutation({
    mutationFn: api.auth.startWebLink,
    onSuccess: ({ url }) => window.location.assign(url),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const enabledProviders = new Set(
    providerStates(available)
      .filter((p) => p.enabled)
      .map((p) => p.provider),
  );

  const update = useMutation({
    mutationFn: api.me.updateProfile,
    onSuccess: (user) => {
      qc.setQueryData(SESSION_KEY, (prev: typeof session) => (prev ? { ...prev, user } : prev));
      toast.success('내 정보를 저장했습니다.');
    },
    onError: (e) => {
      if (isApiError(e) && e.fieldErrors) setErrors(e.fieldErrors);
    },
  });

  if (!session) return null;
  const user = session.user;
  const marketing = user.consents.find((c) => c.key === 'marketing');

  return (
    <>
      <title>내 정보 | 중구청소년센터</title>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (update.isPending) return;
          const parsed = parseForm(profileSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          update.mutate(parsed.data);
        }}
        className="space-y-4"
      >
        <div>
          <p className="mb-1.5 text-[15px] font-semibold">이메일</p>
          <p className="flex min-h-12 items-center gap-2 rounded-md bg-surface-muted px-3 text-base break-all">
            {user.email}
            {user.emailVerified && <Badge tone="success">인증됨</Badge>}
          </p>
        </div>
        <TextField
          label="이름"
          name="name"
          defaultValue={user.name}
          autoComplete="name"
          required
          error={errors.name}
        />
        <TextField
          label="휴대전화 (선택)"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={user.phone ?? ''}
          placeholder="010-1234-5678"
          error={errors.phone}
        />
        <CheckboxField
          name="agreeMarketing"
          defaultChecked={marketing?.agreed}
          label="[선택] 프로그램 소식 안내 수신 동의"
        />
        <FormError message={update.isError ? errorMessage(update.error) : null} />
        <Button type="submit" size="lg" loading={update.isPending}>
          저장
        </Button>
      </form>

      <section aria-labelledby="consent-title" className="mt-10">
        <h2 id="consent-title" className="mb-2 text-lg font-bold">
          동의 내역
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {user.consents.map((c) => (
            <li key={c.key} className="flex flex-wrap items-center justify-between gap-2 py-3 text-[15px]">
              <span>
                {c.required ? '[필수]' : '[선택]'} {CONSENT_LABEL[c.key]}
              </span>
              <span className="text-sm text-ink-600">
                {c.agreed ? `동의 · ${c.agreedAt ? formatDate(c.agreedAt) : ''}` : '미동의'}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink-600">
          필수 동의는 철회 시 서비스 이용이 어려워 회원 탈퇴로 처리됩니다.
        </p>
      </section>

      <section aria-labelledby="social-title" className="mt-10">
        <h2 id="social-title" className="mb-2 text-lg font-bold">
          소셜 계정 연결
        </h2>
        <ul className="divide-y divide-line border-y border-line">
          {OAUTH_PROVIDERS.map((p) => (
            <li key={p} className="flex items-center justify-between py-3 text-[15px]">
              <span>{OAUTH_PROVIDER_LABEL[p]}</span>
              {user.providers.includes(p) ? (
                <Badge tone="success">연결됨</Badge>
              ) : enabledProviders.has(p) ? (
                <button
                  type="button"
                  disabled={connect.isPending}
                  onClick={() => connect.mutate(p)}
                  className="min-h-11 font-semibold underline"
                >
                  연결하기
                </button>
              ) : (
                <Badge tone="neutral">{p === 'google' ? '준비 중' : '설정 필요'}</Badge>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-ink-600">연결한 소셜 계정으로 다음부터 로그인할 수 있습니다.</p>
      </section>

      <div className="mt-10 border-t border-line pt-6">
        <Link href="/my/withdraw" className="text-[15px] text-ink-600 underline">
          회원 탈퇴
        </Link>
      </div>
    </>
  );
}
