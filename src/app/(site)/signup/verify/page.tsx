'use client';

import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { api, errorMessage } from '@/api';
import { PreviewCode } from '@/features/auth/preview-code';
import { Button, buttonClass } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { IS_MOCK } from '@/config/env';
import { PENDING_VERIFY_KEY } from '@/features/auth/session';

const RESEND_COOLDOWN_SEC = 60;
const noop = () => () => undefined;

export default function VerifyEmailPage() {
  const toast = useToast();
  const email = useSyncExternalStore(
    noop,
    () => sessionStorage.getItem(PENDING_VERIFY_KEY),
    () => null,
  );
  const [cooldown, setCooldown] = useState(0);
  const mode = useSyncExternalStore(
    noop,
    () => sessionStorage.getItem(PENDING_VERIFY_KEY + '.mode'),
    () => null,
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = useMutation({
    mutationFn: () => api.auth.resendVerification(email ?? ''),
    onSuccess: () => {
      toast.success('인증 메일을 다시 보냈습니다.');
      setCooldown(RESEND_COOLDOWN_SEC);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (email && (mode === 'preview' || IS_MOCK)) return <PreviewCode email={email} />;
  return (
    <div className="container-page py-10 md:py-16">
      <title>이메일 인증 | 중구청소년센터</title>
      <div className="mx-auto max-w-md text-center">
        <MailCheck aria-hidden className="mx-auto size-12 text-brand-700" />
        <h1 className="mt-4 text-2xl font-bold">이메일 인증이 필요합니다</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
          {email ? (
            <>
              <strong className="break-all">{email}</strong>(으)로 보낸 인증 메일의 링크를 눌러 가입을 완료해
              주세요.
            </>
          ) : (
            '가입할 때 입력한 이메일로 보낸 인증 메일의 링크를 눌러 가입을 완료해 주세요.'
          )}
        </p>
        <p className="mt-2 text-sm text-ink-600">메일이 보이지 않으면 스팸함을 확인해 주세요.</p>

        <div className="mt-8 grid gap-2">
          <Button
            variant="secondary"
            size="lg"
            disabled={!email || cooldown > 0}
            loading={resend.isPending}
            onClick={() => resend.mutate()}
          >
            {cooldown > 0 ? `인증 메일 다시 보내기 (${cooldown}초 후)` : '인증 메일 다시 보내기'}
          </Button>
          <Link href="/login" className={buttonClass({ size: 'lg' })}>
            로그인 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}
