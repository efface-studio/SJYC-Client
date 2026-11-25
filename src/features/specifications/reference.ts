import inventory from './routes.json';

export interface ApiRoute {
  method: string;
  path: string;
  access: string;
  status: number;
  result: string;
  call: string;
  args: string[];
  params: { name: string; kind: string; type: string; required: boolean }[];
}
export const routes: ApiRoute[] = inventory;
export const keyOf = (r: ApiRoute) => r.method + ' ' + r.path;
export const canReadLive = (r: ApiRoute) => r.method === 'GET' && r.status !== 302;
export const groupOf = (r: ApiRoute) => r.path.split('/')[1] || 'health';
export interface RequestValues {
  param: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, unknown>;
}
export function requestPath(route: ApiRoute, values: RequestValues) {
  const path = route.path.replace(/:(\w+)/g, (_, key: string) => {
    const value = values.param[key]?.trim();
    if (!value || !/^[\p{L}\p{N}_-]+$/u.test(value)) throw Error(key + ' 경로 값을 확인해 주세요.');
    return encodeURIComponent(value);
  });
  const qs = new URLSearchParams();
  for (const field of route.params.filter((f) => f.kind === 'query')) {
    const val = values.query[field.name]?.trim();
    if (val) qs.set(field.name, val);
    else if (field.required) throw Error(field.name + ' 쿼리 값을 입력해 주세요.');
  }
  return path + (qs.size ? '?' + qs.toString() : '');
}
const examples: Record<string, unknown> = {
  name: '테스트 회원',
  email: 'sample@example.test',
  birthYear: 2008,
  phone: '010-0000-0000',
  agreePrivacy: true,
  agreeTerms: true,
  agreeMarketing: false,
  title: '주말 활동 안내',
  category: 'center',
  body: '센터 주말 활동 안내입니다.',
  status: 'draft',
  date: '2026-12-01',
  targetType: 'club',
  targetId: 'club-1',
  headcount: 2,
  startTime: '10:00',
  endTime: '11:00',
  open: true,
  version: 0,
  values: {},
  reason: '신청 내용을 확인했습니다.',
  decision: 'approved',
  note: '',
  pinned: false,
};
export function bodyExample(route: ApiRoute) {
  return Object.fromEntries(
    route.params
      .filter((p) => p.kind === 'body')
      .map((p) => {
        const alt = p.type.match(/"([^"]+)"/)?.[1];
        const fallback = p.type.endsWith('[]')
          ? []
          : p.type === 'number'
            ? 1
            : p.type === 'boolean'
              ? false
              : (alt ?? '');
        const suggested = examples[p.name];
        return [
          p.name,
          alt && typeof suggested === 'string' && !p.type.includes('"' + suggested + '"')
            ? alt
            : (suggested ?? fallback),
        ];
      }),
  );
}
export function responseText(value: unknown) {
  if (value === undefined) return '응답 본문 없음';
  const text = JSON.stringify(
    value,
    (key, v) => (/^(password|passwordConfirm|passwordHash|token|checkInCode)$/i.test(key) ? '••••' : v),
    2,
  );
  return text.length > 32000 ? text.slice(0, 32000) + '\n… 응답 일부만 표시합니다.' : text;
}
