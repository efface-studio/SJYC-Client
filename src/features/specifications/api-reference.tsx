'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { API_BASE_URL } from '@/config/env';
import { PERMISSION_LABEL, type Permission } from '@/domain/permissions';
import {
  bodyExample,
  canReadLive,
  groupOf,
  keyOf,
  requestPath,
  responseText,
  routes,
  type ApiRoute,
  type RequestValues,
} from './reference';
import './specifications.css';

type Result = { status: number; value?: unknown };
function RequestPanel({
  route,
  runMock,
}: {
  route: ApiRoute;
  runMock: (route: ApiRoute, values: RequestValues) => Promise<Result>;
}) {
  const [mode, setMode] = useState<'sandbox' | 'live'>(route.call ? 'sandbox' : 'live');
  const [param, setParam] = useState<Record<string, string>>({});
  const [query, setQuery] = useState<Record<string, string>>({});
  const [body, setBody] = useState(() => JSON.stringify(bodyExample(route), null, 2));
  const [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const [result, setResult] = useState<{ status: number; elapsed: number; text: string } | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const live = canReadLive(route) && Boolean(API_BASE_URL);
  const runnable = mode === 'sandbox' ? !!route.call : live;
  async function run(e: FormEvent) {
    e.preventDefault();
    if (pending || !runnable) return;
    setError('');
    setResult(null);
    setPending(true);
    const started = performance.now();
    const controller = new AbortController();
    abort.current = controller;
    const limit = setTimeout(() => controller.abort(), 15000);
    try {
      let payload: unknown;
      try {
        payload = JSON.parse(body);
      } catch {
        throw Error('요청 본문에 올바른 JSON을 입력해 주세요.');
      }
      if (!payload || typeof payload !== 'object' || Array.isArray(payload))
        throw Error('요청 본문은 JSON 객체여야 합니다.');
      const values: RequestValues = { param, query, body: payload as Record<string, unknown> };
      const path = requestPath(route, values);
      for (const f of route.params.filter((f) => f.kind === 'body' && f.required)) {
        if (values.body[f.name] === undefined) throw Error(f.name + ' 필드가 필요합니다.');
      }
      let reply: Result;
      if (mode === 'live') {
        const response = await fetch(API_BASE_URL + path, {
          credentials: 'include',
          cache: 'no-store',
          redirect: 'error',
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const value = await response.text();
        let decoded: unknown = value;
        if (value) {
          try {
            decoded = JSON.parse(value);
          } catch {
            /* 프록시의 비 JSON 응답도 텍스트로 표시한다. */
          }
        }
        reply = { status: response.status, value: value ? decoded : undefined };
      } else reply = await runMock(route, values);
      if (!controller.signal.aborted)
        setResult({
          status: reply.status,
          elapsed: Math.round(performance.now() - started),
          text: responseText(reply.value),
        });
    } catch (err) {
      setError(
        controller.signal.aborted
          ? '요청 시간이 초과되었습니다.'
          : err instanceof Error
            ? err.message
            : '요청에 실패했습니다.',
      );
    } finally {
      clearTimeout(limit);
      setPending(false);
    }
  }
  const access = route.path.startsWith('/manage/')
    ? '담당 동아리 범위 검사'
    : route.path.startsWith('/attendance/')
      ? '직원 또는 해당 동아리 담당자'
      : route.access === 'public'
        ? '공개'
        : route.access === 'session'
          ? '로그인 세션'
          : (PERMISSION_LABEL[route.access as Permission] ?? route.access);
  return (
    <article className="spec-detail">
      <small>{groupOf(route)} / API v1</small>
      <h2 className="spec-url">
        <b>{route.method}</b> {route.path}
      </h2>
      <dl className="spec-facts">
        <div>
          <dt>접근 권한</dt>
          <dd>{access}</dd>
        </div>
        <div>
          <dt>성공 응답</dt>
          <dd>
            <code>
              {route.status} · {route.result}
            </code>
          </dd>
        </div>
      </dl>
      <h3>요청 명세</h3>
      {route.params.length ? (
        <div className="spec-table-wrap">
          <table>
            <thead>
              <tr>
                <th>필드</th>
                <th>위치</th>
                <th>자료형</th>
                <th>입력</th>
              </tr>
            </thead>
            <tbody>
              {route.params.map((p) => (
                <tr key={p.kind + p.name}>
                  <th scope="row">
                    <code>{p.name}</code>
                  </th>
                  <td>{p.kind}</td>
                  <td>
                    <code>{p.type}</code>
                  </td>
                  <td>{p.required ? '필수' : '선택'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>별도 요청 필드가 없습니다.</p>
      )}
      <h3>요청 테스트</h3>
      {route.status === 302 ? (
        <p>
          브라우저 이동 경로입니다. 성공 시 Location 헤더로 이동합니다. 인증 링크는 일회용이므로 실제 메일
          또는 로그인 화면에서 열어 주세요.
        </p>
      ) : (
        <form onSubmit={run} className="spec-form">
          <label>
            실행 환경
            <select
              value={mode}
              disabled={pending}
              onChange={(e) => {
                setMode(e.target.value === 'live' ? 'live' : 'sandbox');
                setResult(null);
                setError('');
              }}
            >
              {route.call && <option value="sandbox">모의 데이터</option>}
              {canReadLive(route) && (
                <option value="live" disabled={!live}>
                  연결된 API · 조회 전용
                </option>
              )}
            </select>
          </label>
          <p>
            {mode === 'sandbox'
              ? '이 페이지의 임시 데이터에서 실행합니다. 새로고침하면 초기화됩니다.'
              : '현재 로그인 세션으로 연결된 API에 조회를 요청합니다.'}
          </p>
          {route.params
            .filter((p) => p.kind !== 'body')
            .map((p) => (
              <label key={p.kind + p.name}>
                {p.name}
                {p.required ? ' *' : ''}
                <input
                  value={(p.kind === 'query' ? query : param)[p.name] ?? ''}
                  required={p.required}
                  onChange={(e) => {
                    const v = e.target.value;
                    (p.kind === 'query' ? setQuery : setParam)((prev) => ({ ...prev, [p.name]: v }));
                  }}
                />
              </label>
            ))}
          {route.params.some((p) => p.kind === 'body') && (
            <label>
              요청 본문 · JSON
              <textarea spellCheck={false} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
          )}
          <button disabled={pending || !runnable} type="submit">
            {pending ? '요청 중…' : '요청 실행'}
          </button>
          {!runnable && <p>이 환경에는 실제 조회용 API 주소가 설정되어 있지 않습니다.</p>}
          {error && <p role="alert">{error}</p>}
          {result && (
            <section className="spec-response" aria-label="실행 결과" aria-live="polite">
              <strong>
                {mode === 'sandbox' ? '모의 응답' : 'HTTP'} {result.status}
              </strong>{' '}
              · {result.elapsed} ms<pre>{result.text}</pre>
            </section>
          )}
        </form>
      )}
    </article>
  );
}

export function ApiReference() {
  const [indexOpen, setIndexOpen] = useState(false);
  const url = useSearchParams(),
    requested = url.get('endpoint');
  const [key, setKey] = useState<string | null>(null),
    [query, setQuery] = useState('');
  const [verb, setVerb] = useState('');
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const list = routes.filter(
    (r) => (!verb || r.method === verb) && keyOf(r).toLowerCase().includes(query.trim().toLowerCase()),
  );
  const chosen = list.find((r) => keyOf(r) === (key ?? requested ?? 'GET /programs')) ?? list[0];
  function runMock(route: ApiRoute, values: RequestValues) {
    const w = (worker.current ??= new Worker(new URL('./sandbox.worker.ts', import.meta.url)));
    return new Promise<Result>((resolve, reject) => {
      const channel = new MessageChannel();
      const stop = () => {
        channel.port1.close();
        w.removeEventListener('error', onError);
        clearTimeout(timer);
      };
      const onError = () => {
        stop();
        w.terminate();
        worker.current = null;
        reject(Error('모의 실행 환경을 시작하지 못했습니다. 다시 시도해 주세요.'));
      };
      const timer = setTimeout(onError, 12000);
      w.addEventListener('error', onError);
      channel.port1.onmessage = (e) => {
        stop();
        resolve(e.data as Result);
      };
      w.postMessage({ routeKey: keyOf(route), values }, [channel.port2]);
    });
  }
  return (
    <div className="spec-workspace" data-index-open={indexOpen}>
      <button
        type="button"
        className="spec-index-toggle"
        aria-controls="reference-index"
        aria-expanded={indexOpen}
        onClick={() => setIndexOpen(!indexOpen)}
      >
        API 목록 {indexOpen ? '닫기' : '열기'}
      </button>
      <aside id="reference-index" className="spec-index" aria-label="API 목록">
        <label>
          경로 검색
          <input
            type="search"
            placeholder="/programs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          메서드
          <select value={verb} onChange={(e) => setVerb(e.target.value)}>
            <option value="">모든 메서드</option>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <div className="spec-results">{list.length}개 경로</div>
        <nav aria-label="API 선택">
          {list.map((r) => (
            <button
              key={keyOf(r)}
              aria-current={r === chosen ? 'true' : undefined}
              onClick={() => {
                setKey(keyOf(r));
                setIndexOpen(false);
              }}
            >
              <small>{r.method}</small>
              <code>{r.path}</code>
            </button>
          ))}
        </nav>
      </aside>
      {chosen ? (
        <RequestPanel key={keyOf(chosen)} route={chosen} runMock={runMock} />
      ) : (
        <p role="status" className="spec-empty">
          일치하는 경로가 없습니다.
        </p>
      )}
    </div>
  );
}
