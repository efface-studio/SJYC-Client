'use client';

import { useState } from 'react';
import { oauthStartUrl, providerStates } from '@/config/oauth';
import { OAUTH_PROVIDER_LABEL } from '@/domain/labels';
import type { OAuthProvider } from '@/domain/types';
import { cn } from '@/lib/cn';

/**
 * 공급자별 버튼 색·문구는 각 사 브랜드 가이드의 기본값을 따른다.
 * TODO: 공식 리소스 키트의 로고 심볼을 받아 적용 (임의로 다시 그린 로고는 쓰지 않는다)
 *  - 카카오: developers.kakao.com 디자인 가이드 / 네이버: developers.naver.com 로그인 버튼 가이드
 *  - Apple: Sign in with Apple HIG / Google: Sign in with Google 브랜딩 가이드
 */
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
      {!anyEnabled && (
        <p className="mb-3 rounded-md bg-surface-muted p-3 text-sm text-ink-700">
          소셜 로그인은 서버 연동 설정이 끝나지 않아 아직 사용할 수 없습니다. 이메일로 로그인해 주세요.
        </p>
      )}
      <ul className="grid gap-2">
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
                !enabled && 'opacity-45',
              )}
            >
              {STYLE[provider].text}
              {!enabled && (
                <span className="absolute right-3 rounded-sm bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-ink-700">
                  설정 필요
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-ink-700">
        {notice}
      </p>
    </div>
  );
}
