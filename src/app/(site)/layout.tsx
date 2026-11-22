import { SiteSurface } from '@/components/site/site-surface';
import '@/components/site/site.css';
import { BottomNav } from '@/components/site/bottom-nav';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteSurface>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      {/* 하단 탭바 높이만큼 여백 (모바일) */}
      <div className="pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
        <SiteFooter />
      </div>
      <BottomNav />
    </SiteSurface>
  );
}
