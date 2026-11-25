'use client';

import Link from 'next/link';
import { useSession } from '@/features/auth/session';
import { can } from '@/domain/permissions';
import { CenterConsole } from '@/features/developer/center-console';
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
import { Activity, Braces, Database, HardDrive, Layers, ShieldCheck, Terminal } from 'lucide-react';
import '@/features/developer/operations.css';

const TABS = [
  { key: 'env', label: '환경', icon: Activity, panel: EnvironmentPanel },
  { key: 'session', label: '세션·권한', icon: ShieldCheck, panel: SessionPanel },
  { key: 'server', label: '서버 로그', icon: Terminal, panel: ServerLogPanel },
  { key: 'requests', label: 'API 요청', icon: Braces, panel: ApiLogPanel },
  { key: 'cache', label: '쿼리 캐시', icon: Layers, panel: QueryCachePanel },
  { key: 'data', label: 'mock 데이터', icon: Database, panel: MockDataPanel },
  { key: 'storage', label: '저장소·오류', icon: HardDrive, panel: StoragePanel },
] as const;

function DeveloperTabs() {
  const diagnostics = can(useSession().data?.user, 'developer.access');
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const active = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0];
  const select = (key: string) => router.replace(`${pathname}?tab=${key}`, { scroll: false });

  // WAI-ARIA tabs: ←→ 로 이동하며 바로 선택
  const onKey = (e: KeyboardEvent, index: number) => {
    const step = ['ArrowRight', 'ArrowDown'].includes(e.key)
      ? 1
      : ['ArrowLeft', 'ArrowUp'].includes(e.key)
        ? -1
        : 0;
    if (!step && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next =
      TABS[
        e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (index + step + TABS.length) % TABS.length
      ]!;
    select(next.key);
    listRef.current?.querySelector<HTMLButtonElement>(`#dev-tab-${next.key}`)?.focus();
  };

  if (!diagnostics || !TABS.some((t) => t.key === params.get('tab'))) return <CenterConsole />;
  const Panel = active.panel;
  return (
    <>
      <div className="developer-workspace">
        <Link href="/admin/developer" className="dev-center-back">
          ← 개발자 도구
        </Link>
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
            >
              <t.icon size={16} aria-hidden />
              {t.label}
            </button>
          ))}
        </div>
        <div
          data-view={active.key}
          id="dev-panel"
          role="tabpanel"
          aria-labelledby={`dev-tab-${active.key}`}
          className="space-y-8"
        >
          <div className="tool-context">
            <active.icon size={18} aria-hidden />
            <strong>{active.label}</strong>
          </div>
          <Panel />
        </div>
      </div>
    </>
  );
}

export default function DeveloperPage() {
  return (
    <AdminPage view="tools" title="개발자 도구" permission="developer.view">
      <DeveloperTabs />
    </AdminPage>
  );
}
