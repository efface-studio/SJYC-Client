'use client';
import { PublicationOptions, ReleasePanel } from './distribution';
import { useSession } from '@/features/auth/session';
import { can } from '@/domain/permissions';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { ListSkeleton } from '@/components/ui/states';
import { formatDateTime } from '@/lib/format';

function Releases() {
  const developer = can(useSession().data?.user, 'developer.access');
  const [platform, setPlatform] = useState('ios');
  const q = useQuery({
    queryKey: ['admin', 'app-updates'],
    queryFn: api.admin.appUpdates,
    refetchInterval: 30000,
  });
  const rows = (q.data ?? []).filter((r) => r.platform === platform);
  return (
    <section>
      {developer && <PublicationOptions />}
      <div className="flex flex-wrap items-center gap-3">
        {['ios', 'android'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlatform(p)}
            aria-pressed={platform === p}
            className={platform === p ? 'font-bold underline underline-offset-4' : 'text-ink-600'}
          >
            {p === 'ios' ? 'iOS' : 'Android'}
          </button>
        ))}
        <button className="ml-auto" onClick={() => void q.refetch()} disabled={q.isFetching}>
          새로고침
        </button>
      </div>
      {q.isPending ? (
        <ListSkeleton rows={3} />
      ) : q.isError ? (
        <p role="alert">{errorMessage(q.error)}</p>
      ) : rows.length === 0 ? (
        <p className="my-10">등록된 업데이트가 없습니다.</p>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className="space-y-1 border-b border-line py-5">
              <small>
                {r.flavor === 'admin' ? '관리자앱' : '유저앱'} ·{' '}
                {r.channel === 'production' ? '운영' : '검수'} ·{' '}
                {r.manual
                  ? r.waves?.length
                    ? '차수별 배포'
                    : '발행 대기'
                  : r.live
                    ? '배포 중'
                    : '이전 배포'}
              </small>
              <h2 className="font-bold">{r.message}</h2>
              <p>
                {formatDateTime(r.createdAt)} · 런타임 {r.runtime.slice(0, 10)}
              </p>
              <p>
                확인한 기기 약 {r.seen}대 · 적용 확인 약 {r.running}대
              </p>
              <ReleasePanel r={r} refresh={q.refetch} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
export default function AppUpdates() {
  return (
    <AdminPage
      title="앱 업데이트"
      view="list"
      permission="site.manage"
      description="플랫폼별 배포 내역과 최근 90일간 업데이트를 확인한 기기를 봅니다."
    >
      <Releases />
    </AdminPage>
  );
}
