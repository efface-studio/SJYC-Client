'use client';
import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/features/settings/use-settings';
import { IS_MOCK } from '@/config/env';
export function SiteSurface({ children }: { children: ReactNode }) {
  const s = useSiteSettings(),
    pathname = usePathname();
  useEffect(() => {
    if (!IS_MOCK) return;
    if (pathname === '/') document.title = s.seoTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', s.seoDescription);
  }, [pathname, s.seoTitle, s.seoDescription]);
  return (
    <div
      className="public-site flex min-h-dvh flex-col"
      style={{ '--color-brand-700': s.accent } as CSSProperties}
    >
      {children}
    </div>
  );
}
