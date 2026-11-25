// 독립 워커의 메모리에서 공식 모의 어댑터를 실행한다. 탭의 실제 로그인·저장소와 공유하지 않는다.
import { mockClient } from '@/api/mock/client';
import { loadDb, writeSession } from '@/api/mock/store';
import { ApiError, type ApiErrorCode } from '@/api/errors';
import { keyOf, routes, type RequestValues } from './reference';

const statuses: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION: 400,
  RATE_LIMITED: 429,
  NETWORK: 503,
  NOT_CONFIGURED: 503,
  SERVER: 500,
};
const developer = loadDb().users.find((u) => u.roles.includes('developer'));
if (developer) writeSession(developer.id);
self.onmessage = async (event: MessageEvent<{ routeKey: string; values: RequestValues }>) => {
  const port = event.ports[0];
  if (!port) return;
  try {
    const route = routes.find((r) => keyOf(r) === event.data.routeKey);
    if (!route?.call) throw new ApiError('NOT_CONFIGURED', '이 경로는 모의 어댑터를 제공하지 않습니다.');
    const { param, body, query } = event.data.values;
    const typedQuery = Object.fromEntries(
      Object.entries(query)
        .filter(([, v]) => v !== '')
        .map(([k, v]) => [
          k,
          route.params.some((p) => p.kind === 'query' && p.name === k && p.type === 'number') ? Number(v) : v,
        ]),
    );
    const source: Record<string, Record<string, unknown>> = { param, body, query: typedQuery };
    const args = route.args.map((arg) => {
      if (arg === 'target') {
        const t = route.method === 'GET' ? typedQuery : body;
        return { type: t.targetType, id: t.targetId };
      }
      const [group, key] = arg.split('.');
      return key ? source[group!]?.[key] : source[group!];
    });
    let method: unknown = mockClient;
    for (const key of route.call.split('.')) {
      if (typeof method !== 'object' || !method || !Object.hasOwn(method, key)) throw Error('어댑터 없음');
      method = Reflect.get(method, key);
    }
    if (typeof method !== 'function') throw Error('어댑터 없음');
    const data: unknown = await method(...args);
    if (route.call === 'auth.me' && data === null)
      throw new ApiError('UNAUTHENTICATED', '로그인이 필요합니다.');
    port.postMessage({
      status: route.status,
      value: route.status === 204 ? undefined : { success: true, data },
    });
  } catch (error) {
    const e =
      error instanceof ApiError ? error : new ApiError('VALIDATION', '요청 필드와 자료형을 확인해 주세요.');
    port.postMessage({
      status: statuses[e.code],
      value: {
        success: false,
        error: { code: e.code, message: e.message, fieldErrors: e.fieldErrors, reason: e.reason },
      },
    });
  } finally {
    port.close();
  }
};
