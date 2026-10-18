'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type AdminSort = 'newest' | 'oldest' | 'title';
type Patch = Record<string, string | number | undefined>;

export const ADMIN_PAGE_SIZE = 20;

/** URL 값이 허용 목록(레이블 맵의 키)에 있을 때만 쓴다 — 임의 값은 '' 로 취급 */
export function oneOf<K extends string>(value: string, allowed: Record<K, unknown>): K | '' {
  return Object.hasOwn(allowed, value) ? (value as K) : '';
}

/** 목록 화면 상태(검색·필터·정렬·페이지)는 URL 검색 파라미터로 관리한다 — 새로고침·공유·뒤로가기 유지 */
export function useListParams() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const get = (key: string): string => params.get(key) ?? '';
  const rawSort = params.get('sort');
  const sort: AdminSort = rawSort === 'oldest' || rawSort === 'title' ? rawSort : 'newest';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const hrefWith = (patch: Patch): string => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    }
    if (!('page' in patch)) next.delete('page');
    const s = next.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  const set = (patch: Patch) => router.push(hrefWith(patch), { scroll: false });
  const hasFilters = [...params.keys()].some((k) => k !== 'page' && k !== 'sort');

  return { get, q: get('q'), sort, page, hrefWith, set, pathname, hasFilters };
}
