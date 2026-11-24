'use client';

import { useQueryClient, type Query } from '@tanstack/react-query';
import { Check, Copy, Download, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { apiLog, errorMessage } from '@/api';
import { mockDev } from '@/api/mock/client';
import type { Scenario } from '@/api/mock/store';
import { SCENARIOS } from '@/components/dev-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Callout, EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { API_BASE_URL, API_MODE, IS_MOCK } from '@/config/env';
import { useSocialProviders } from '@/features/auth/use-social-providers';
import { providerStates } from '@/config/oauth';
import { USER_STATUS } from '@/domain/labels';
import { can, PERMISSION_LABEL, PERMISSIONS, ROLE_LABEL, ROLE_ORDER } from '@/domain/permissions';
import { useSession } from '@/features/auth/session';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

/* ---------- 공통 ---------- */

function Section({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-line pt-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function InfoList({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 text-[15px] sm:grid-cols-[160px_1fr]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-600">{k}</dt>
          <dd className="min-w-0 break-all">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});
/** HH:MM:SS.mmm (서울) */
const time = (iso: string) =>
  `${clock.format(new Date(iso))}.${String(new Date(iso).getMilliseconds()).padStart(3, '0')}`;

/* ---------- 환경 ---------- */

function useEnvironment(): [string, string][] | null {
  const available = useSocialProviders();
  const [rows, setRows] = useState<[string, string][] | null>(null);
  // 브라우저 값은 마운트 후에 읽는다 (서버 렌더링과 불일치 방지)
  useEffect(() => {
    setRows([
      ['API 모드', API_MODE === 'mock' ? 'mock (개발용 데모 데이터)' : 'http (실서버)'],
      ['API 주소', API_BASE_URL || '없음 (mock)'],
      [
        '소셜 로그인',
        providerStates(available)
          .map((p) => `${p.label} ${p.enabled ? '사용' : '설정 필요'}`)
          .join(' · '),
      ],
      ['접속 주소', window.location.origin],
      ['브라우저', navigator.userAgent],
      ['화면', `${window.innerWidth}×${window.innerHeight} · 배율 ${window.devicePixelRatio}`],
      ['시간대 · 언어', `${Intl.DateTimeFormat().resolvedOptions().timeZone} · ${navigator.language}`],
      ['네트워크', navigator.onLine ? '온라인' : '오프라인'],
      ['확인 시각', formatDateTime(new Date().toISOString())],
    ]);
  }, [available]);
  return rows;
}

export function EnvironmentPanel() {
  const rows = useEnvironment();
  const toast = useToast();
  const copy = async () => {
    if (!rows) return;
    try {
      await navigator.clipboard.writeText(rows.map(([k, v]) => `${k}: ${v}`).join('\n'));
      toast.success('진단 정보를 복사했습니다.');
    } catch {
      toast.error('복사하지 못했습니다. 브라우저 권한을 확인해 주세요.');
    }
  };
  return (
    <Section
      title="환경 정보"
      description="문제 보고 시 진단 정보를 복사해 함께 전달하세요. 비밀 값은 포함되지 않습니다."
      actions={
        <Button variant="secondary" size="sm" onClick={() => void copy()} disabled={!rows}>
          <Copy aria-hidden className="size-4" />
          진단 정보 복사
        </Button>
      }
    >
      {rows ? <InfoList rows={rows} /> : <p className="text-ink-600">확인하는 중…</p>}
    </Section>
  );
}

/* ---------- 세션·권한 ---------- */

export function SessionPanel() {
  const session = useSession();
  const s = session.data;
  return (
    <>
      <Section title="내 세션" description="서버가 내려준 세션 응답 기준입니다.">
        {s ? (
          <InfoList
            rows={[
              ['회원 ID', <code key="id">{s.user.id}</code>],
              ['이름 · 이메일', `${s.user.name} · ${s.user.email}`],
              ['역할', s.user.roles.map((r) => ROLE_LABEL[r]).join(', ')],
              ['상태', USER_STATUS[s.user.status].text],
              ['연결된 소셜 계정', s.user.providers.join(', ') || '없음'],
              ['세션 만료', formatDateTime(s.expiresAt)],
            ]}
          />
        ) : (
          <p className="text-ink-600">세션 정보가 없습니다.</p>
        )}
      </Section>
      <Section
        title="역할 × 권한"
        description="화면 표시용 권한표입니다. 실제 허용 여부는 서버가 요청마다 다시 검사합니다."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[14px]">
            <caption className="sr-only">역할별 권한</caption>
            <thead>
              <tr className="border-b-2 border-ink-900 text-left">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  권한
                </th>
                {ROLE_ORDER.map((r) => (
                  <th key={r} scope="col" className="w-24 py-2 text-center font-semibold">
                    {ROLE_LABEL[r]}
                  </th>
                ))}
                <th scope="col" className="w-20 py-2 text-center font-semibold">
                  나
                </th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map((p) => (
                <tr key={p} className="border-b border-line">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    {PERMISSION_LABEL[p]}
                    <code className="block text-xs text-ink-600">{p}</code>
                  </th>
                  {[...ROLE_ORDER.map((r) => can({ roles: [r], status: 'active' }, p)), can(s?.user, p)].map(
                    (ok, i) => (
                      <td key={i} className="py-2 text-center">
                        {ok ? (
                          <Check aria-label="허용" className="mx-auto size-4 text-success-700" />
                        ) : (
                          <span aria-label="불가" className="text-ink-600/50">
                            —
                          </span>
                        )}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}

/* ---------- API 요청 로그 ---------- */

export function ApiLogPanel() {
  const entries = useSyncExternalStore(apiLog.subscribe, apiLog.entries, apiLog.entries);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const rows = errorsOnly ? entries.filter((e) => !e.ok) : entries;
  const avg = entries.length ? Math.round(entries.reduce((n, e) => n + e.durationMs, 0) / entries.length) : 0;
  return (
    <Section
      title="API 요청 로그"
      description={`이 탭이 열린 뒤 최근 200건 · 평균 ${avg}ms · 실패 ${entries.filter((e) => !e.ok).length}건. 요청 본문은 기록하지 않습니다.`}
      actions={
        <>
          <label className="inline-flex min-h-9 items-center gap-2 text-[15px]">
            <Checkbox checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />
            실패만
          </label>
          <Button variant="secondary" size="sm" onClick={() => apiLog.clear()} disabled={!entries.length}>
            <Trash2 aria-hidden className="size-4" />
            비우기
          </Button>
        </>
      }
    >
      {rows.length === 0 ? (
        <EmptyState title="기록된 요청이 없습니다" description="다른 화면을 열거나 새로고침하면 쌓입니다." />
      ) : (
        <div className="max-h-[480px] overflow-auto border border-line">
          <table className="w-full min-w-[520px] text-[14px]">
            <caption className="sr-only">API 요청 로그</caption>
            <thead className="sticky top-0 bg-surface-admin">
              <tr className="text-left">
                <th scope="col" className="px-3 py-2 font-semibold">
                  시각
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  메서드
                </th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">
                  소요
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  결과
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="px-3 py-1.5 text-ink-600 tabular-nums">{time(e.at)}</td>
                  <td className="px-3 py-1.5">
                    <code>{e.method}</code>
                  </td>
                  <td
                    className={cn(
                      'px-3 py-1.5 text-right tabular-nums',
                      e.durationMs >= 1000 && 'font-semibold text-warning-800',
                    )}
                  >
                    {e.durationMs}ms
                  </td>
                  <td className="px-3 py-1.5">
                    {e.ok ? (
                      <Badge tone="success">성공</Badge>
                    ) : (
                      <Badge tone="danger">{e.error ?? '실패'}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* ---------- 쿼리 캐시 ---------- */

function useCachedQueries(): Query[] {
  const qc = useQueryClient();
  const cache = qc.getQueryCache();
  const [, setTick] = useState(0);
  useEffect(() => cache.subscribe(() => setTick((t) => t + 1)), [cache]);
  return [...cache.getAll()].sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);
}

const QUERY_STATUS: Record<string, { text: string; tone: 'success' | 'danger' | 'neutral' }> = {
  success: { text: '성공', tone: 'success' },
  error: { text: '오류', tone: 'danger' },
  pending: { text: '대기', tone: 'neutral' },
};

export function QueryCachePanel() {
  const qc = useQueryClient();
  const toast = useToast();
  const queries = useCachedQueries();
  return (
    <Section
      title="쿼리 캐시"
      description={`화면이 불러온 데이터 ${queries.length}건. 무효화하면 보고 있는 화면이 다시 불러옵니다.`}
      actions={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              void qc.invalidateQueries();
              toast.success('모든 쿼리를 무효화했습니다.');
            }}
          >
            <RefreshCw aria-hidden className="size-4" />
            전체 무효화
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' });
              toast.success('세션을 제외한 캐시를 비웠습니다.');
            }}
          >
            <Trash2 aria-hidden className="size-4" />
            캐시 비우기
          </Button>
        </>
      }
    >
      <ul className="divide-y divide-line border-y border-line">
        {queries.map((q) => {
          const status = QUERY_STATUS[q.state.status] ?? QUERY_STATUS.pending!;
          return (
            <li key={q.queryHash} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <code className="block truncate text-[14px]">{JSON.stringify(q.queryKey)}</code>
                <p className="mt-0.5 text-xs text-ink-600 tabular-nums">
                  {q.state.dataUpdatedAt
                    ? `갱신 ${time(new Date(q.state.dataUpdatedAt).toISOString())}`
                    : '데이터 없음'}
                  {' · '}보는 화면 {q.getObserversCount()}
                  {q.state.fetchStatus === 'fetching' && ' · 불러오는 중'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge tone={status.tone}>{status.text}</Badge>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => void qc.refetchQueries({ queryKey: q.queryKey, exact: true })}
                >
                  다시 불러오기
                </Button>
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => qc.removeQueries({ queryKey: q.queryKey, exact: true })}
                >
                  삭제
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ---------- mock 데이터 ---------- */

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

export function MockDataPanel() {
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => setScenario(mockDev.readScenario()), []);

  if (!IS_MOCK) {
    return (
      <Section title="mock 데이터">
        <Callout tone="info">실서버(http) 모드에서는 개발용 데이터 도구를 쓰지 않습니다.</Callout>
      </Section>
    );
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([mockDev.exportDb()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `sjyc-mock-db-${stamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    try {
      mockDev.importDb(await file.text());
      await qc.invalidateQueries();
      toast.success(`${file.name} 을(를) 불러왔습니다.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '불러오지 못했습니다.');
    }
  };

  return (
    <>
      <Section title="응답 시나리오" description="모든 API 응답을 바꿔 로딩·빈 목록·오류 화면을 확인합니다.">
        <div className="max-w-sm">
          <label htmlFor="dev-scenario" className="mb-1 block text-sm font-semibold text-ink-700">
            시나리오
          </label>
          <Select
            id="dev-scenario"
            title="응답 시나리오"
            value={scenario}
            onValueChange={(v) => {
              const next = SCENARIOS.find((s) => s.value === v)?.value ?? 'normal';
              mockDev.setScenario(next);
              setScenario(next);
              void qc.invalidateQueries();
            }}
            options={SCENARIOS.map((s) => ({ value: s.value, label: `${s.label} — ${s.hint}` }))}
          />
        </div>
      </Section>
      <Section
        title="데이터 관리"
        description="mock 데이터는 이 브라우저 탭(sessionStorage)에만 저장됩니다. 내보낸 파일로 같은 상태를 재현할 수 있습니다."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={download}>
            <Download aria-hidden className="size-4" />
            데이터 내보내기
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden className="size-4" />
            데이터 가져오기
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (f) void upload(f);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              mockDev.expireSession();
              void qc.invalidateQueries();
              toast.success('세션을 만료시켰습니다. 다음 요청부터 로그인이 필요합니다.');
            }}
          >
            세션 만료 재현
          </Button>
          <Button variant="destructive" onClick={() => setConfirmReset(true)}>
            데이터 초기화
          </Button>
        </div>
      </Section>
      <ConfirmDialog
        open={confirmReset}
        title="mock 데이터를 초기화할까요?"
        description="변경한 데이터와 로그인 세션이 모두 시드 상태로 돌아가고 로그인 화면으로 이동합니다."
        confirmLabel="초기화"
        destructive
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          mockDev.reset();
          qc.clear();
          window.location.assign('/admin/login');
        }}
      />
    </>
  );
}

/* ---------- 브라우저 저장소·오류 재현 ---------- */

interface StoredKey {
  area: 'session' | 'local';
  key: string;
  bytes: number;
}

function readStorage(): StoredKey[] {
  const out: StoredKey[] = [];
  for (const [area, store] of [
    ['session', window.sessionStorage],
    ['local', window.localStorage],
  ] as const) {
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key !== null) out.push({ area, key, bytes: new Blob([store.getItem(key) ?? '']).size });
    }
  }
  return out.sort((a, b) => a.key.localeCompare(b.key));
}

function Crash(): never {
  throw new Error('개발자 도구에서 재현한 렌더링 오류');
}

export function StoragePanel() {
  const toast = useToast();
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [crash, setCrash] = useState(false);
  const refresh = () => setKeys(readStorage());
  useEffect(refresh, []);

  return (
    <>
      <Section
        title="브라우저 저장소"
        description="값은 개인정보·세션이 담길 수 있어 보여주지 않고 키와 크기만 표시합니다."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh}>
            <RefreshCw aria-hidden className="size-4" />
            새로고침
          </Button>
        }
      >
        {keys.length === 0 ? (
          <EmptyState title="저장된 값이 없습니다" />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {keys.map((k) => (
              <li key={`${k.area}:${k.key}`} className="flex items-center gap-3 py-2">
                <Badge tone="neutral">{k.area === 'session' ? '세션' : '로컬'}</Badge>
                <code className="min-w-0 flex-1 truncate text-[14px]">{k.key}</code>
                <span className="text-sm text-ink-600 tabular-nums">{k.bytes.toLocaleString('ko-KR')}B</span>
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-label={`${k.key} 삭제`}
                  onClick={() => {
                    (k.area === 'session' ? window.sessionStorage : window.localStorage).removeItem(k.key);
                    refresh();
                  }}
                >
                  삭제
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="오류·알림 재현" description="오류 화면과 알림이 제대로 보이는지 확인합니다.">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast.success('성공 알림 예시입니다.')}>
            성공 알림
          </Button>
          <Button variant="secondary" onClick={() => toast.error(errorMessage(new Error('예시 오류')))}>
            오류 알림
          </Button>
          <Button variant="destructive" onClick={() => setCrash(true)}>
            렌더링 오류 발생
          </Button>
        </div>
        {crash && <Crash />}
      </Section>
    </>
  );
}
