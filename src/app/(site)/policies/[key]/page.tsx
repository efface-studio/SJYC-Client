'use client';

import { useQueries } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { api } from '@/api';
import Image from 'next/image';
import { BookOpenText, Package } from 'lucide-react';
import './policy-reader.css';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import { OSS_WEB } from '@/config/oss-licenses';
import { POLICY_NAV, POLICY_TITLE } from '@/domain/labels';
import type { PolicyDoc, PolicyKey } from '@/domain/types';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

type SectionKey = PolicyKey | 'opensource';

const FIRST: SectionKey = POLICY_NAV[0]!.key;
const LAST: SectionKey = POLICY_NAV[POLICY_NAV.length - 1]!.key;
const DOC_KEYS = POLICY_NAV.map((p) => p.key).filter((k): k is PolicyKey => k in POLICY_TITLE);
const sectionId = (key: string) => `policy-${key}`;
/** 고정 헤더(+모바일 가로 목차) 아래로 이만큼 지나간 문서를 현재 문서로 본다 */
function spyOffset() {
  const section = document.getElementById(sectionId(FIRST));
  const margin = section ? Number.parseFloat(getComputedStyle(section).scrollMarginTop) : 0;
  const padding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
  return (margin || 0) + (padding || 0) + 1;
}
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function SectionHeading({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <header className="mb-5 border-b-2 border-ink-900 pb-3">
      <h2 id={`${id}-title`} tabIndex={-1} className="text-xl font-bold tracking-tight md:text-2xl">
        {title}
      </h2>
      {sub && <p className="mt-1 text-sm text-ink-600 tabular-nums">{sub}</p>}
    </header>
  );
}

function PolicySection({ doc }: { doc: PolicyDoc }) {
  return (
    <>
      <SectionHeading
        id={sectionId(doc.key)}
        title={doc.title}
        sub={doc.effectiveAt ? `시행일 ${formatDate(doc.effectiveAt)}` : undefined}
      />
      <div className="policy-prose">{doc.confirmed ? doc.body : '게시된 문서가 없습니다.'}</div>
    </>
  );
}

const marks: Record<string, string> = {
  '@tanstack/react-query': 'tanstack.svg',
  'lucide-react': 'lucide.svg',
  next: 'nextdotjs.svg',
  react: 'react.svg',
  'react-dom': 'react.svg',
  'simple-icons': 'simpleicons.svg',
  zod: 'zod.svg',
  'tailwind-merge': 'tailwind-merge.png',
  pretendard: 'pretendard.png',
};

function PackageMark({ name }: { name: string }) {
  const mark = marks[name];
  return mark ? (
    <Image
      aria-hidden
      alt=""
      src={'/oss/' + mark}
      width={24}
      height={24}
      unoptimized
      className="size-6 shrink-0 object-contain"
    />
  ) : (
    <Package aria-hidden size={22} className="shrink-0 text-ink-600" />
  );
}

/** 설치된 패키지에서 생성한 목록 (scripts/gen-oss-licenses.mjs) */
function OpenSourceLicenses() {
  return (
    <>
      <SectionHeading id={sectionId('opensource')} title="오픈소스 라이선스" />
      <p className="mb-4 text-[15px] text-ink-700">
        이 서비스는 아래 오픈소스 소프트웨어를 사용합니다. 각 라이선스 전문은 해당 프로젝트에서 확인할 수
        있습니다.
      </p>
      <table className="w-full text-[15px]">
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
                <div className="flex items-center gap-2">
                  <PackageMark name={p.name} />
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
                </div>
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
    </>
  );
}

/** 목차 — 현재 문서 표시(막대/밑줄)가 항목 사이를 미끄러지듯 이동한다 */
function PolicyToc({
  active,
  onSelect,
  orientation,
}: {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
  orientation: 'vertical' | 'horizontal';
}) {
  const vertical = orientation === 'vertical';
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<{ offset: number; size: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const link = list?.querySelector<HTMLElement>(`[data-key="${active}"]`);
      // 숨겨진(다른 화면 크기용) 목차는 측정하지 않는다
      if (!list || !link || list.offsetParent === null) return;
      setIndicator(
        vertical
          ? { offset: link.offsetTop, size: link.offsetHeight }
          : { offset: link.offsetLeft, size: link.offsetWidth },
      );
      if (!vertical) {
        const target = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
        list.scrollTo({ left: target, behavior: reduceMotion() ? 'auto' : 'smooth' });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, vertical]);

  return (
    <ul
      ref={listRef}
      className={cn(
        'relative',
        vertical ? 'border-l border-line' : 'scrollbar-none flex overflow-x-auto border-b border-line px-1',
      )}
    >
      {indicator && (
        <li
          aria-hidden
          className={cn(
            'pointer-events-none absolute bg-ink-900 transition-[transform,width,height] duration-300 ease-out motion-reduce:transition-none',
            vertical ? 'top-0 -left-px w-0.5' : 'bottom-0 left-0 h-0.5',
          )}
          style={
            vertical
              ? { height: indicator.size, transform: `translateY(${indicator.offset}px)` }
              : { width: indicator.size, transform: `translateX(${indicator.offset}px)` }
          }
        />
      )}
      {POLICY_NAV.map((p) => (
        <li key={p.key} className={cn(!vertical && 'shrink-0')}>
          <a
            href={`/policies/${p.key}`}
            data-key={p.key}
            aria-current={p.key === active ? 'location' : undefined}
            onClick={(e) => {
              e.preventDefault();
              onSelect(p.key);
            }}
            className={cn(
              'flex items-center text-[15px] transition-colors duration-300',
              vertical ? 'min-h-10 py-1.5 pl-4' : 'h-11 px-3 whitespace-nowrap',
              p.key === active ? 'font-bold text-ink-900' : 'font-medium text-ink-600 hover:text-ink-900',
            )}
          >
            {p.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function PolicyPage() {
  const { key } = useParams<{ key: string }>();
  const initial = POLICY_NAV.find((p) => p.key === key)?.key ?? FIRST;
  const [active, setActive] = useState<SectionKey>(initial);
  const docs = useQueries({
    queries: DOC_KEYS.map((k) => ({ queryKey: ['policy', k], queryFn: () => api.policies.get(k) })),
  });
  const loaded = docs.every((d) => !d.isPending);
  const ready = useRef(false);

  // 문서가 모두 그려진 뒤 주소의 문서 위치로 이동하고, 그때부터 스크롤을 따라간다
  useEffect(() => {
    if (!loaded) return;
    if (!ready.current && initial !== FIRST) {
      document.getElementById(sectionId(initial))?.scrollIntoView();
    }
    ready.current = true;

    let frame = 0;
    let offset = spyOffset();
    const spy = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        let current = FIRST;
        for (const p of POLICY_NAV) {
          const el = document.getElementById(sectionId(p.key));
          if (el && el.getBoundingClientRect().top - offset <= 0) current = p.key;
        }
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
        setActive(atBottom ? LAST : current);
      });
    };
    const resize = () => {
      offset = spyOffset();
      spy();
    };
    spy();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', spy, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', spy);
    };
  }, [loaded, initial]);

  // 주소를 현재 문서로 맞춘다 (뒤로 가기 기록은 늘리지 않음)
  useEffect(() => {
    if (ready.current && window.location.pathname !== `/policies/${active}`) {
      window.history.replaceState(window.history.state, '', `/policies/${active}`);
    }
  }, [active]);

  const select = (k: SectionKey) => {
    document
      .getElementById(sectionId(k))
      ?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    document.getElementById(`${sectionId(k)}-title`)?.focus({ preventScroll: true });
  };

  const activeTitle = POLICY_NAV.find((p) => p.key === active)?.title ?? '정책 및 약관';

  return (
    <div className="policy-reader">
      <title>{`${activeTitle} | 중구청소년센터`}</title>
      <header className="policy-intro">
        <div>
          <BookOpenText aria-hidden size={32} />
          <h1>정책 및 약관</h1>
          <p>중구청소년센터 온라인 서비스 이용에 관한 문서입니다.</p>
        </div>
      </header>
      <div className="policy-body">
        <nav aria-label="정책 문서 목차" className="sticky top-[60px] z-20 -mx-4 mb-6 bg-surface md:hidden">
          <PolicyToc active={active} onSelect={select} orientation="horizontal" />
        </nav>

        <div className="md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-12 lg:gap-16">
          <aside className="hidden md:block">
            <nav aria-label="정책 문서 목차" className="sticky top-28">
              <PolicyToc active={active} onSelect={select} orientation="vertical" />
            </nav>
          </aside>

          <div className="policy-articles min-w-0 space-y-16 md:space-y-20">
            {POLICY_NAV.map((p) => {
              const query = p.key === 'opensource' ? undefined : docs[DOC_KEYS.indexOf(p.key)];
              return (
                <section
                  key={p.key}
                  id={sectionId(p.key)}
                  aria-labelledby={`${sectionId(p.key)}-title`}
                  className="scroll-mt-14 md:scroll-mt-4"
                >
                  {p.key === 'opensource' ? (
                    <OpenSourceLicenses />
                  ) : !query || query.isPending ? (
                    <ListSkeleton rows={2} />
                  ) : query.isError ? (
                    <>
                      <SectionHeading id={sectionId(p.key)} title={p.title} />
                      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
                    </>
                  ) : (
                    <PolicySection doc={query.data} />
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
