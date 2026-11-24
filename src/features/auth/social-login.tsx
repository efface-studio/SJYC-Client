'use client';

import { useState } from 'react';
import Image from 'next/image';
import { siNaver, siApple } from 'simple-icons';
import { oauthStartUrl, providerStates } from '@/config/oauth';
import { OAUTH_PROVIDER_LABEL } from '@/domain/labels';
import type { OAuthProvider } from '@/domain/types';

const icons = { naver: siNaver, apple: siApple };
function ProviderMark({ provider }: { provider: OAuthProvider }) {
  if (provider === 'kakao') {
    return (
      <svg width="20" height="20" viewBox="60 15 16 16" fill="#000000" aria-hidden>
        <path d="M68.001 16.5225C64.4222 16.5225 61.5225 19.0037 61.5225 22.0641C61.5225 24.0312 62.7219 25.7596 64.5292 26.7423L63.9181 29.2113C63.8954 29.285 63.9132 29.364 63.9619 29.4184C63.9975 29.457 64.0461 29.478 64.0931 29.478C64.1337 29.478 64.1742 29.464 64.2082 29.4341L66.834 27.5144C67.2117 27.5723 67.6007 27.6039 67.9994 27.6039C71.5767 27.6039 74.478 25.1226 74.478 22.0623C74.478 19.002 71.5783 16.5225 68.001 16.5225Z" />
      </svg>
    );
  }
  if (provider === 'google')
    return <Image src="/brand/google-signin.png" width={20} height={20} alt="" unoptimized />;
  return (
    <svg width="20" height="20" aria-hidden viewBox="0 0 24 24" fill="currentColor">
      <path d={icons[provider].path} />
    </svg>
  );
}

const STYLE: Record<OAuthProvider, { className: string; text: string; name: string }> = {
  kakao: { className: 'bg-[#FEE500] text-black/85', name: '카카오', text: '카카오 로그인' },
  naver: { className: 'bg-[#03C75A] text-white', name: '네이버', text: '네이버 로그인' },
  apple: { className: 'bg-black text-white', name: 'Apple', text: 'Apple로 로그인' },
  google: { className: 'border border-[#747775] bg-white text-[#1F1F1F]', name: 'Google', text: 'Google 계정으로 로그인' },
};

export function SocialLoginButtons({ next }: { next: string | null }) {
  const providers = providerStates();
  const [notice, setNotice] = useState<string | null>(null);
  const anyEnabled = providers.some((p) => p.enabled);

  return (
    <div>
      <ul className="social-auth-grid">
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
              aria-label={STYLE[provider].text}
              className="oauth-button"
            >
              <span className={'oauth-mark ' + STYLE[provider].className}><ProviderMark provider={provider} /></span>
              <span>{STYLE[provider].name}</span>
              {!enabled && <span className="sr-only">설정 필요</span>}
            </button>
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="login-social-note">
        {notice ?? (!anyEnabled ? '현재 이메일 로그인을 이용할 수 있어요.' : '')}
      </p>
    </div>
  );
}
