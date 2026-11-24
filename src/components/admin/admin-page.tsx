'use client';

import { Suspense, type ReactNode } from 'react';
import { PageHeader, type Crumb } from '@/components/ui/page-header';
import { ListSkeleton } from '@/components/ui/states';
import { RequirePermission, type Access } from '@/features/auth/guards';

export const ADMIN_TITLE_SUFFIX = '중구청소년센터 관리자';

export function AdminTitle({ children }: { children: string }) {
  return <title>{`${children} | ${ADMIN_TITLE_SUFFIX}`}</title>;
}

interface AdminPageProps {
  view:
    | 'inbox'
    | 'list'
    | 'record'
    | 'editor'
    | 'attendance'
    | 'journal'
    | 'tools'
    | 'directory'
    | 'settings'
    | 'library'
    | 'reference'
    | 'policy';
  title: string;
  permission: Access;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  /** 문서 제목(<title>)이 화면 제목과 다를 때 */
  docTitle?: string;
  children: ReactNode;
}

/** 관리자 섹션 공통 틀 — 권한 확인, 문서 제목, 머리글, useSearchParams 용 Suspense */
export function AdminPage({
  title,
  view,
  permission,
  description,
  breadcrumbs,
  actions,
  docTitle,
  children,
}: AdminPageProps) {
  return (
    <RequirePermission permission={permission}>
      <AdminTitle>{docTitle ?? title}</AdminTitle>
      <div className="workspace-page" data-layout={view}>
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          actions={actions}
          className="mb-5"
        />
        <Suspense fallback={<ListSkeleton rows={4} />}>{children}</Suspense>
      </div>
    </RequirePermission>
  );
}
