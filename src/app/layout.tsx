import type { Metadata, Viewport } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '중구청소년센터', template: '%s | 중구청소년센터' },
  description: '서울시 중구청소년센터 — 프로그램·공지·동아리·센터 이용 안내',
};

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
