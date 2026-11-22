'use client';

import { useState } from 'react';
import Image from 'next/image';
import { siKakaotalk, siNaver, siApple } from 'simple-icons';
import { oauthStartUrl, providerStates } from '@/config/oauth';
import { OAUTH_PROVIDER_LABEL } from '@/domain/labels';
import type { OAuthProvider } from '@/domain/types';
import { cn } from '@/lib/cn';

const icons = { kakao: siKakaotalk, naver: siNaver, apple: siApple };
function ProviderMark({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google')
    return <Image src="/brand/google-signin.png" width={20} height={20} alt="" unoptimized />;
  return (
    <svg width="20" height="20" aria-hidden viewBox="0 0 24 24" fill="currentColor">
      <path d={icons[provider].path} />
    </svg>
  );
}

const STYLE: Record<OAuthProvider, { className: string; text: string }> = {
  kakao: { className: 'bg-[#FEE500] text-black/85', text: '카카오 로그인' },
  naver: { className: 'bg-[#03C75A] text-white', text: '네이버 로그인' },
  apple: { className: 'bg-black text-white', text: 'Apple로 로그인' },
  google: { className: 'border border-[#747775] bg-white text-[#1F1F1F]', text: 'Google 계정으로 로그인' },
};

export function SocialLoginButtons({ next }: { next: string | null }) {
  const providers = providerStates();
  const [notice, setNotice] = useState<string | null>(null);
  const anyEnabled = providers.some((p) => p.enabled);

  return (
    <div>
      <ul className="social-auth-grid grid gap-2">
        {providers.map(({ provider, enabled }) => (
          <li key={provider}>
            <button
              type="button"
              aria-disabled={!enabled || undefined}
              onClick={() => {
                if (!enabled) {
                  setNotice(
                    `${OAUTH_PROVIDER_LABEL[provider]} 로그인은 설정이 필요합니다. 관리자에게 문의해 주세요.`,
                  );
                  return;
                }
                window.location.assign(oauthStartUrl(provider, next));
              }}
              className={cn(
                'relative flex min-h-12 w-full items-center justify-center rounded-md px-4 text-[15px] font-semibold',
                STYLE[provider].className,
                'oauth-button',
              )}
            >
              <ProviderMark provider={provider} />
              <span>{STYLE[provider].text}</span>
              {!enabled && <span className="oauth-status">설정 필요</span>}
            </button>
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-ink-700">
        {notice ?? (!anyEnabled ? '현재 이메일 로그인을 이용할 수 있어요.' : '')}
      </p>
    </div>
  );
}
