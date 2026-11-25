'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  ScrollText,
  Server,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { api, errorMessage } from '@/api';
import {
  developerSections,
  type DevLocation,
  type DevForm,
  type DevSection,
} from '@/domain/developer-console';
import { useLogout, useSession } from '@/features/auth/session';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { QueryState } from '@/components/admin/query-state';

const icons = {
  permissions: KeyRound,
  logs: ScrollText,
  security: ShieldCheck,
  operations: SlidersHorizontal,
  system: Server,
};
const sections = Object.keys(developerSections) as DevSection[];
function url(location: DevLocation) {
  const params = new URLSearchParams({ section: location.section });
  if (location.item) params.set('item', location.item);
  if (location.search) params.set('q', location.search);
  if (location.page) params.set('page', String(location.page));
  return '/admin/developer?' + params;
}

function ActionForm({ form, done }: { form: DevForm; done: () => void }) {
  const toast = useToast(),
    [confirm, setConfirm] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((form.fields ?? []).map((f) => [f.key, f.value])),
  );
  const set = (k: string, v: string) => setValues((prev) => ({ ...prev, [k]: v }));
  const action = useMutation({
    mutationFn: () =>
      api.admin.developerAction({ command: form.command, id: form.id, version: form.version, values }),
    onSuccess: () => {
      setConfirm(false);
      done();
    },
    onError: (e) => {
      setConfirm(false);
      toast.error(errorMessage(e));
    },
  });
  return (
    <form
      className="dev-center-form"
      onSubmit={(e) => {
        e.preventDefault();
        setConfirm(true);
      }}
    >
      {form.fields?.map((f) => {
        const value = values[f.key] ?? '';
        if (f.options && f.multiple)
          return (
            <fieldset key={f.key}>
              <legend>{f.label}</legend>
              {f.options.map((o) => (
                <label className="dev-center-check" key={o.value}>
                  <input
                    type="checkbox"
                    checked={value.split(',').includes(o.value)}
                    onChange={(e) =>
                      set(
                        f.key,
                        [
                          ...value.split(',').filter((s) => s && s !== o.value),
                          ...(e.target.checked ? [o.value] : []),
                        ].join(','),
                      )
                    }
                  />
                  {o.label}
                </label>
              ))}
            </fieldset>
          );
        return (
          <label className="dev-center-field" key={f.key}>
            {f.label}
            {f.options ? (
              <select value={value} onChange={(e) => set(f.key, e.target.value)}>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input value={value} onChange={(e) => set(f.key, e.target.value)} maxLength={512} />
            )}
          </label>
        );
      })}
      <Button
        type="submit"
        variant={form.destructive ? 'destructive' : 'primary'}
        disabled={action.isPending}
      >
        {form.label}
      </Button>
      <ConfirmDialog
        open={confirm}
        title={form.label}
        description={form.message}
        confirmLabel="확인"
        destructive={form.destructive}
        loading={action.isPending}
        onClose={() => setConfirm(false)}
        onConfirm={() => action.mutate()}
      />
    </form>
  );
}

export function CenterConsole() {
  const params = useSearchParams(),
    router = useRouter(),
    cache = useQueryClient(),
    toast = useToast(),
    session = useSession(),
    logout = useLogout();
  const section = sections.find((s) => s === params.get('section')) ?? 'permissions';
  const item = params.get('item') ?? '',
    search = params.get('q') ?? '';
  const page = Math.min(10000, Math.max(0, Number.parseInt(params.get('page') ?? '0') || 0));
  const query = useQuery({
    queryKey: ['admin', 'dev-console', section, item, search, page],
    queryFn: () => api.admin.developerView({ section, item, search, page }),
    refetchInterval: (q) => q.state.data?.interval ?? false,
  });
  return (
    <section className="dev-center">
      <nav aria-label="개발자 도구 영역" className="dev-center-nav">
        {sections.map((s) => {
          const Icon = icons[s];
          return (
            <Link key={s} href={url({ section: s })} aria-current={s === section ? 'page' : undefined}>
              <Icon size={17} />
              {developerSections[s]}
            </Link>
          );
        })}
        <Link className="dev-center-device" href="/admin/developer?tab=env">
          이 브라우저 진단 <ArrowRight size={14} />
        </Link>
      </nav>
      <section className="dev-center-content">
        <QueryState query={query}>
          {(view) => (
            <>
              {item && (
                <Link className="dev-center-back" href={url({ section })}>
                  <ArrowLeft size={14} /> {developerSections[section]}
                </Link>
              )}
              <h2>{view.title}</h2>
              {view.searchLabel && (
                <form
                  key={section + item + search}
                  className="dev-center-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    router.push(
                      url({
                        section,
                        item,
                        search: String(new FormData(e.currentTarget).get('query') ?? '').trim(),
                      }),
                    );
                  }}
                >
                  <input
                    aria-label={view.searchLabel}
                    placeholder={view.searchLabel}
                    name="query"
                    defaultValue={search}
                    maxLength={120}
                  />
                  <Button size="sm" type="submit" variant="secondary">
                    검색
                  </Button>
                </form>
              )}
              {view.groups.map((g) => (
                <section className="dev-center-group" key={g.title}>
                  <h3>{g.title}</h3>
                  <ul>
                    {g.rows.length ? (
                      g.rows.map((row, i) => {
                        const inner = (
                          <>
                            <span>
                              <strong>{row.title}</strong>
                              {row.detail && <small>{row.detail}</small>}
                            </span>
                            {row.value && <span className="dev-center-value">{row.value}</span>}
                            {row.next && <ArrowRight size={15} />}
                          </>
                        );
                        return (
                          <li key={i}>
                            {row.next ? <Link href={url(row.next)}>{inner}</Link> : <div>{inner}</div>}
                          </li>
                        );
                      })
                    ) : (
                      <li>
                        <div>표시할 내역이 없습니다.</div>
                      </li>
                    )}
                  </ul>
                </section>
              ))}
              {view.forms?.map((f) => (
                <ActionForm
                  key={[section, item, f.command, f.version].join('/')}
                  form={f}
                  done={() => {
                    if (f.command === 'revoke' && session.data?.user.id === f.id) {
                      logout.mutate();
                      return;
                    }
                    if (
                      f.command === 'delete-role' ||
                      f.command === 'revoke' ||
                      (f.command === 'save-role' && !f.id)
                    )
                      router.replace(url({ section }));
                    void cache.invalidateQueries({ queryKey: ['admin', 'dev-console'] });
                    toast.success('적용했습니다.');
                  }}
                />
              ))}
              {(page > 0 || view.hasMore) && (
                <nav aria-label="목록 페이지" className="dev-center-pager">
                  {page > 0 && <Link href={url({ section, item, search, page: page - 1 })}>이전</Link>}
                  <span>{page + 1}</span>
                  {view.hasMore && <Link href={url({ section, item, search, page: page + 1 })}>다음</Link>}
                </nav>
              )}
            </>
          )}
        </QueryState>
      </section>
    </section>
  );
}
