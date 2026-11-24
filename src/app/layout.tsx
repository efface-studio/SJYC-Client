import type { Metadata, Viewport } from 'next';
import { API_BASE_URL, IS_MOCK } from '@/config/env';
import { DEFAULT_SETTINGS } from '@/config/site-settings';
import { settingsSchema } from '@/domain/site-settings';
import { Providers } from '@/components/providers';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  let title = DEFAULT_SETTINGS.seoTitle,
    description = DEFAULT_SETTINGS.seoDescription;
  if (!IS_MOCK) {
    try {
      const res = await fetch(API_BASE_URL + '/site/settings', {
        cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const doc = await res.json();
        const values = settingsSchema.safeParse(doc?.data?.values);
        if (values.success) {
          title = values.data.seoTitle ?? title;
          description = values.data.seoDescription ?? description;
        }
      }
    } catch {
      /* 서버 정지 시 기본 검색 정보를 표시한다. */
    }
  }
  return { title: { default: title, template: '%s | ' + title }, description };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <a
          href="#main"
          className="sr-only z-50 rounded-md bg-ink-900 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          본문 바로가기
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
