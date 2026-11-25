'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pause, Play, RotateCw, Terminal } from 'lucide-react';
import { api, errorMessage } from '@/api';
const clock = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
export function ServerLogPanel() {
  const [live, setLive] = useState(true),
    [level, setLevel] = useState('all'),
    [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: ['admin', 'server-logs'],
    queryFn: api.admin.serverLogs,
    refetchInterval: live ? 4000 : false,
  });
  const rows =
    q.data?.entries.filter(
      (r) =>
        (level === 'all' || r.level === level) &&
        [r.id, r.method, r.route, String(r.status)].some((s) =>
          s.toLowerCase().includes(search.toLowerCase()),
        ),
    ) ?? [];
  return (
    <section className="server-terminal">
      <header>
        <Terminal size={20} />
        <h2>서버 요청 로그</h2>
        <span className="terminal-connection" data-live={live && q.isSuccess && q.data.source === 'server'}>
          {q.isError
            ? '연결 오류'
            : q.isPending
              ? '연결 중'
              : q.data.source === 'mock'
                ? '모의 환경'
                : live
                  ? '수신 중'
                  : '일시정지'}
        </span>
      </header>
      <div className="terminal-controls">
        <label>
          로그 검색
          <input
            type="search"
            placeholder="경로, 상태 코드, 요청 ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label>
          레벨
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="all">전체</option>
            {['info', 'warn', 'error'].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setLive((v) => !v)}>
          {live ? <Pause size={15} /> : <Play size={15} />} {live ? '일시정지' : '다시 시작'}
        </button>
        <button type="button" onClick={() => void q.refetch()}>
          <RotateCw size={15} />
          새로고침
        </button>
      </div>
      <div className="terminal-columns" aria-hidden>
        <span>시각 · KST</span>
        <span>레벨</span>
        <span>메서드</span>
        <span>요청 경로</span>
        <span>상태 · 소요 시간</span>
      </div>
      <div className="terminal-output" tabIndex={0} aria-label="서버 로그 출력">
        {q.isPending ? (
          <p>서버에 연결하는 중…</p>
        ) : q.isError ? (
          <p role="alert">{errorMessage(q.error)}</p>
        ) : q.data.source === 'mock' ? (
          <p>현재 브라우저는 mock API를 사용합니다. HTTP 서버에 연결하면 실제 요청이 여기에 표시됩니다.</p>
        ) : rows.length === 0 ? (
          <p>조건에 맞는 요청이 없습니다.</p>
        ) : (
          rows.map((r, i) => (
            <details className="terminal-line" key={r.id + '-' + i}>
              <summary>
                <time dateTime={r.at}>{clock.format(new Date(r.at))}</time>
                <b data-level={r.level}>{r.level.toUpperCase()}</b>
                <strong>{r.method}</strong>
                <code>{r.route}</code>
                <span>
                  {r.status} · {r.durationMs}ms
                </span>
              </summary>
              <p>
                요청 ID <code>{r.id}</code>
              </p>
            </details>
          ))
        )}
      </div>
      <footer>
        {q.data?.source === 'server'
          ? `현재 서버의 최근 ${q.data.capacity}건 · 표시 ${rows.length}건 · 4초 간격`
          : '서버 요청 · 읽기 전용'}
      </footer>
    </section>
  );
}
