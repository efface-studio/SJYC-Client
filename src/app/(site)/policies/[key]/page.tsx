'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/api';
import { PageHeader } from '@/components/ui/page-header';
import { Callout, EmptyState, ErrorState, ListSkeleton } from '@/components/ui/states';
import { OSS_WEB } from '@/config/oss-licenses';
import { POLICY_NAV, POLICY_TITLE } from '@/domain/labels';
import type { PolicyKey } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

const isPolicyKey = (v: string): v is PolicyKey => v in POLICY_TITLE;

function PolicyDocument({ policyKey }: { policyKey: PolicyKey }) {
  const doc = useQuery({ queryKey: ['policy', policyKey], queryFn: () => api.policies.get(policyKey) });
  if (doc.isPending) return <ListSkeleton rows={2} />;
  if (doc.isError) return <ErrorState error={doc.error} onRetry={() => void doc.refetch()} />;
  return (
    <article>
      <title>{`${doc.data.title} | 중구청소년센터`}</title>
      <PageHeader
        title={doc.data.title}
        description={doc.data.effectiveAt ? `시행일 ${formatDate(doc.data.effectiveAt)}` : undefined}
      />
      {!doc.data.confirmed && (
        <Callout tone="warning" title="센터 확정본 미등록" className="mb-6">
          아래 내용은 초안입니다. 센터가 확정한 문서가 등록되면 이 화면에 표시됩니다.
        </Callout>
      )}
      <div className="text-base leading-[1.8] whitespace-pre-line text-ink-900">{doc.data.body}</div>
    </article>
  );
}

/** 설치된 패키지에서 생성한 목록 (scripts/gen-oss-licenses.mjs) */
function OpenSourceLicenses() {
  return (
    <article>
      <title>오픈소스 라이선스 | 중구청소년센터</title>
      <PageHeader
        title="오픈소스 라이선스"
        description="이 서비스는 아래 오픈소스 소프트웨어를 사용합니다. 각 라이선스 전문은 해당 프로젝트에서 확인할 수 있습니다."
      />
      <table className="w-full border-t-2 border-ink-900 text-[15px]">
        <caption className="sr-only">사용한 오픈소스 패키지와 라이선스</caption>
        <thead>
          <tr className="border-b border-line text-left text-sm text-ink-600">
            <th scope="col" className="py-2 font-semibold">
              패키지
            </th>
            <th scope="col" className="py-2 font-semibold">
              버전
            </th>
            <th scope="col" className="py-2 font-semibold">
              라이선스
            </th>
          </tr>
        </thead>
        <tbody>
          {OSS_WEB.map((p) => (
            <tr key={p.name} className="border-b border-line">
              <td className="py-2.5 pr-3">
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:underline"
                  >
                    {p.name}
                    <span className="sr-only">(새 창)</span>
                  </a>
                ) : (
                  <span className="font-semibold">{p.name}</span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-ink-600 tabular-nums">{p.version}</td>
              <td className="py-2.5">{p.license}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-sm text-ink-600">
        직접 의존하는 패키지 기준입니다. 하위 의존성의 라이선스는 각 패키지의 고지를 따릅니다.
      </p>
    </article>
  );
}

export default function PolicyPage() {
  const { key } = useParams<{ key: string }>();

  return (
    <div className="container-page py-6 md:py-10">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="정책 문서" className="-mx-4 mb-6 scrollbar-none overflow-x-auto px-4">
          <ul className="flex border-b border-line md:flex-wrap">
            {POLICY_NAV.map((p) => (
              <li key={p.key} className="shrink-0">
                <Link
                  href={`/policies/${p.key}`}
                  aria-current={p.key === key ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center border-b-2 px-3 text-[15px] font-semibold whitespace-nowrap',
                    p.key === key ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-600',
                  )}
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {key === 'opensource' ? (
          <OpenSourceLicenses />
        ) : isPolicyKey(key) ? (
          <PolicyDocument policyKey={key} />
        ) : (
          <EmptyState title="문서를 찾을 수 없습니다" />
        )}
      </div>
    </div>
  );
}
