'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api';
import { ROLE_LABEL, ROLE_ORDER, PERMISSIONS, PERMISSION_LABEL } from '@/domain/permissions';
import {
  scheduledTime,
  waveStateLabels,
  type AppUpdate,
  type Audience,
  type WaveAction,
} from '@/domain/app-update';
import { formatDateTime } from '@/lib/format';
import { Button } from '@/components/ui/button';

export function PublicationOptions() {
  const cache = useQueryClient(),
    key = ['admin', 'publication-settings'];
  const q = useQuery({ queryKey: key, queryFn: api.admin.publicationSettings });
  const m = useMutation({
    mutationFn: api.admin.configurePublication,
    onSuccess: (data) => cache.setQueryData(key, data),
    onError: () => void q.refetch(),
  });
  const s = q.data;
  if (!s) return <p role="status">{q.error ? errorMessage(q.error) : '발행 설정을 불러오는 중…'}</p>;
  return (
    <fieldset className="my-5 space-y-3 border-y border-line py-4" disabled={m.isPending}>
      <legend className="font-bold">발행 설정</legend>
      <label className="block">
        <input
          type="checkbox"
          checked={s.automatic}
          onChange={(e) => m.mutate({ automatic: e.target.checked, version: s.version })}
        />{' '}
        새 릴리스 자동 발행
      </label>
      <p>
        {s.automatic
          ? '검증된 새 릴리스는 전체에 발행됩니다.'
          : '새 릴리스는 대기하며 대상과 시각을 선택한 후 발행합니다.'}
      </p>
      <p className="font-medium">업데이트 스플래시 표시</p>
      <div className="flex flex-wrap gap-4">
        {(
          [
            ['percent', '퍼센트'],
            ['bar', '진행 막대'],
            ['notes', '업데이트 내용'],
          ] as const
        ).map(([k, label]) => (
          <label key={k}>
            <input
              type="checkbox"
              checked={s.splash[k]}
              onChange={(e) =>
                m.mutate({ splash: { ...s.splash, [k]: e.target.checked }, version: s.version })
              }
            />{' '}
            {label}
          </label>
        ))}
      </div>
      {m.error && <p role="alert">{errorMessage(m.error)}</p>}
    </fieldset>
  );
}
export function ReleasePanel({ r, refresh }: { r: AppUpdate; refresh: () => Promise<unknown> }) {
  const [kind, setKind] = useState<Audience['kind']>('everyone'),
    [emails, setEmails] = useState(''),
    [percent, setPercent] = useState(100),
    [at, setAt] = useState('');
  const [role, setRole] = useState<(typeof ROLE_ORDER)[number]>('staff'),
    [perm, setPerm] = useState<(typeof PERMISSIONS)[number]>('admin.access'),
    [error, setError] = useState('');
  const wave = useMutation({
    mutationFn: (input: WaveAction) => api.admin.changeWave(r.id, input),
    onSettled: refresh,
  });
  const legacy = useMutation({
    mutationFn: (v: Parameters<typeof api.admin.changeAppUpdate>[1]) => api.admin.changeAppUpdate(r.id, v),
    onSettled: refresh,
  });
  const version = r.planVersion ?? 0,
    waves = r.waves ?? [],
    busy = wave.isPending || legacy.isPending;
  if (!r.live && !waves.length) return null;
  const label = (s: string) =>
    ROLE_LABEL[s as keyof typeof ROLE_LABEL] ?? PERMISSION_LABEL[s as keyof typeof PERMISSION_LABEL] ?? s;
  function publish() {
    setError('');
    try {
      const scope: Audience =
        kind === 'users'
          ? {
              kind,
              emails: emails
                .trim()
                .split(/[\s,;]+/)
                .filter(Boolean),
            }
          : kind === 'role'
            ? { kind, role }
            : kind === 'permission'
              ? { kind, permission: perm }
              : { kind };
      if (scope.kind === 'users' && !scope.emails.length) throw new Error('회원 이메일을 입력해 주세요.');
      const start = scheduledTime(at);
      if (window.confirm('선택한 미배정 대상 중 ' + percent + '%에 ' + (start ? '예약' : '배포') + '할까요?'))
        wave.mutate({ action: 'publish', scope, percent, at: start, version });
    } catch (e) {
      setError(e instanceof Error ? e.message : '입력을 확인해 주세요.');
    }
  }
  return (
    <details className="mt-3 rounded border border-line p-3">
      <summary className="cursor-pointer font-semibold">
        {r.manual ? '대상 및 배포 차수' : '배포 제어'}
      </summary>
      <fieldset className="mt-3 space-y-3" disabled={busy}>
        {r.manual ? (
          <>
            <ol className="space-y-2">
              {waves.map((w, i) => (
                <li key={w.id}>
                  {i + 1}차 · {waveStateLabels[w.state]} · {label(w.label)} · {w.percent}% · {w.count}명
                  {w.everyone ? ' 및 신규 설치' : ''} · {formatDateTime(w.at)}{' '}
                  {r.live && (w.state === 'active' || w.state === 'scheduled') && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const cancel = w.state === 'scheduled';
                        if (
                          window.confirm(
                            cancel
                              ? '이 예약을 취소할까요?'
                              : '이 차수만 직전 전체 배포본 또는 내장 버전으로 되돌릴까요?',
                          )
                        )
                          wave.mutate({ action: cancel ? 'cancel' : 'undo', waveId: w.id, version });
                      }}
                    >
                      {w.state === 'active' ? '이 차수만 롤백' : '예약 취소'}
                    </Button>
                  )}
                </li>
              ))}
            </ol>
            {r.live && !waves.some((w) => w.everyone && w.state !== 'cancelled') && (
              <>
                <div className="flex flex-wrap items-end gap-4">
                  <label>
                    배포 대상{' '}
                    <select value={kind} onChange={(e) => setKind(e.target.value as Audience['kind'])}>
                      <option value="everyone">{waves.length ? '남은 대상 전체' : '전체'}</option>
                      <option value="users">특정 회원</option>
                      <option value="role">역할</option>
                      <option value="permission">기능 권한</option>
                    </select>
                  </label>
                  {kind === 'users' && (
                    <label>
                      회원 이메일{' '}
                      <input
                        value={emails}
                        onChange={(e) => setEmails(e.target.value)}
                        placeholder="여러 명은 쉼표로 구분"
                      />
                    </label>
                  )}
                  {kind === 'role' && (
                    <label>
                      역할{' '}
                      <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                        {ROLE_ORDER.map((k) => (
                          <option key={k} value={k}>
                            {ROLE_LABEL[k]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {kind === 'permission' && (
                    <label>
                      기능 권한{' '}
                      <select value={perm} onChange={(e) => setPerm(e.target.value as typeof perm)}>
                        {PERMISSIONS.map((k) => (
                          <option key={k} value={k}>
                            {PERMISSION_LABEL[k]}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label>
                    미배정 대상 중{' '}
                    <select value={percent} onChange={(e) => setPercent(Number(e.target.value))}>
                      {[10, 25, 50, 75, 100].map((p) => (
                        <option key={p} value={p}>
                          {p}%
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    예약 일시 (한국시간, 선택){' '}
                    <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
                  </label>
                </div>
                <Button size="sm" onClick={publish}>
                  {at ? '배포 예약' : '지금 배포'}
                </Button>
              </>
            )}
          </>
        ) : (
          r.kind === 'UPDATE' && (
            <div className="flex flex-wrap gap-2">
              {[10, 25, 50, 100].map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant="secondary"
                  disabled={p === r.rolloutPercent}
                  onClick={() => {
                    if (window.confirm(p + '% 기기에 적용할까요?'))
                      legacy.mutate({ action: 'rollout', percent: p });
                  }}
                >
                  {p}%
                </Button>
              ))}
              {(['previous', 'embedded'] as const).map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (window.confirm('전체 배포를 되돌릴까요?'))
                      legacy.mutate({ action: 'rollback', target: t });
                  }}
                >
                  {t === 'previous' ? '직전 배포본' : '스토어 버전'}으로 롤백
                </Button>
              ))}
            </div>
          )
        )}
        {(error || wave.error || legacy.error) && (
          <p role="alert">{error || errorMessage(wave.error ?? legacy.error)}</p>
        )}
      </fieldset>
    </details>
  );
}
