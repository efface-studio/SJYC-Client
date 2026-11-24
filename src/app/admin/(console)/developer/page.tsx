'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, type KeyboardEvent } from 'react';
import { AdminPage } from '@/components/admin/admin-page';
import {
  ApiLogPanel,
  EnvironmentPanel,
  MockDataPanel,
  QueryCachePanel,
  SessionPanel,
  StoragePanel,
} from '@/features/developer/developer-console';
import { ServerLogPanel } from '@/features/developer/server-log-panel';
import { Terminal } from 'lucide-react';
import '@/features/developer/operations.css';
import { cn } from '@/lib/cn';

const TABS = [
  { key: 'env', label: '환경', panel: EnvironmentPanel },
  { key: 'session', label: '세션·권한', panel: SessionPanel },
  { key: 'server', label: '서버 로그', panel: ServerLogPanel },
  { key: 'requests', label: 'API 요청', panel: ApiLogPanel },
  { key: 'cache', label: '쿼리 캐시', panel: QueryCachePanel },
  { key: 'data', label: 'mock 데이터', panel: MockDataPanel },
  { key: 'storage', label: '저장소·오류', panel: StoragePanel },
] as const;

function DeveloperTabs() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const active = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0];
  const select = (key: string) => router.replace(`${pathname}?tab=${key}`, { scroll: false });

  // WAI-ARIA tabs: ←→ 로 이동하며 바로 선택
  const onKey = (e: KeyboardEvent, index: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length]!;
    select(next.key);
    listRef.current?.querySelector<HTMLButtonElement>(`#dev-tab-${next.key}`)?.focus();
  };

  const Panel = active.panel;
  return (
    <>
      <div className="developer-workspace">
        <header className="operations-heading">
          <Terminal size={23} />
          <strong>Developer console</strong>
          <span>시스템 진단</span>
        </header>
        <div
          ref={listRef}
          role="tablist"
          aria-label="개발자 도구"
          className="console-tabs mb-6 scrollbar-none"
        >
          {TABS.map((t, i) => (
            <button
              key={t.key}
              id={`dev-tab-${t.key}`}
              type="button"
              role="tab"
              aria-selected={t.key === active.key}
              aria-controls="dev-panel"
              tabIndex={t.key === active.key ? 0 : -1}
              onClick={() => select(t.key)}
              onKeyDown={(e) => onKey(e, i)}
              className={cn(
                'h-11 shrink-0 border-b-2 px-3 text-[15px] font-semibold whitespace-nowrap',
                t.key === active.key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div id="dev-panel" role="tabpanel" aria-labelledby={`dev-tab-${active.key}`} className="space-y-8">
          <Panel />
        </div>
      </div>
    </>
  );
}

export default function DeveloperPage() {
  return (
    <AdminPage
      title="개발자 도구"
      permission="developer.access"
      description="개발자 전용 — 환경·세션·권한 확인, API 요청 로그, 캐시, 개발용 데이터를 다룹니다."
    >
      <DeveloperTabs />
    </AdminPage>
  );
}
