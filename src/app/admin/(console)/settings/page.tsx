'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Save } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { Button } from '@/components/ui/button';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { DEFAULT_SETTINGS, SETTING_GROUPS } from '@/config/site-settings';
import {
  HOME_SECTIONS,
  NAV_LINKS,
  settingsSchema,
  type SettingsRecord,
  type SettingKey,
  type SiteSettings,
} from '@/domain/site-settings';
import { SETTINGS_KEY } from '@/features/settings/use-settings';
import './settings.css';
import { readBanners } from '@/domain/mobile-banners';
import { MobileBannersEditor } from './mobile-banners';

function OrderedOptions({
  value,
  labels,
  onChange,
}: {
  value: string;
  labels: Record<string, string>;
  onChange: (v: string) => void;
}) {
  const shown = value ? value.split(',') : [];
  function move(i: number, step: number) {
    const next = shown.slice();
    next.splice(i + step, 0, next.splice(i, 1)[0]!);
    onChange(next.join(','));
  }
  return (
    <ul className="setting-order">
      {[...shown, ...Object.keys(labels).filter((k) => !shown.includes(k))].map((k) => {
        const i = shown.indexOf(k);
        return (
          <li key={k}>
            <label>
              <input
                type="checkbox"
                checked={i >= 0}
                onChange={() => onChange((i < 0 ? [...shown, k] : shown.filter((v) => v !== k)).join(','))}
              />
              {labels[k]}
            </label>
            <button
              type="button"
              aria-label={labels[k] + ' 위로'}
              disabled={i <= 0}
              onClick={() => move(i, -1)}
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              aria-label={labels[k] + ' 아래로'}
              disabled={i < 0 || i === shown.length - 1}
              onClick={() => move(i, 1)}
            >
              <ArrowDown size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
function Editor({ record, reload }: { record: SettingsRecord; reload: () => void }) {
  const qc = useQueryClient(),
    toast = useToast();
  const [tab, setTab] = useState(0),
    [draft, setDraft] = useState<SiteSettings>(record.values),
    [validation, setValidation] = useState('');
  const [banners, setBanners] = useState(() => readBanners(record.values.mobileBanners));
  const mutation = useMutation({
    mutationFn: api.admin.updateSettings,
    onSuccess: (next) => {
      qc.setQueryData(SETTINGS_KEY, next);
      void qc.invalidateQueries({ queryKey: ['admin', 'audit'] });
      toast.success('사이트 설정을 저장했습니다.');
    },
  });
  const change = (key: SettingKey, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setValidation('');
    mutation.reset();
  };
  const changed = JSON.stringify(record.values) !== JSON.stringify(draft);
  const group = SETTING_GROUPS[tab]!;
  return (
    <form
      className="setting-workbench"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = settingsSchema.safeParse(draft);
        if (!parsed.success) {
          const issue = parsed.error.issues[0]!;
          const key = String(issue.path[0]);
          const section = SETTING_GROUPS.findIndex((g) => key in g.fields);
          if (section >= 0) setTab(section);
          setValidation((SETTING_GROUPS[section]?.fields[key as SettingKey] ?? key) + ' · ' + issue.message);
          return;
        }
        mutation.mutate({ version: record.version, values: parsed.data });
      }}
    >
      <nav aria-label="설정 분류">
        {SETTING_GROUPS.map((g, i) => (
          <button type="button" key={g.name} aria-pressed={i === tab} onClick={() => setTab(i)}>
            {g.name}
          </button>
        ))}
      </nav>
      <fieldset disabled={mutation.isPending}>
        <legend>{group.name}</legend>
        {(Object.entries(group.fields) as [SettingKey, string][]).map(([key, label]) => {
          const value = draft[key] ?? DEFAULT_SETTINGS[key];
          const id = 'setting-' + key;
          if (key === 'mobileBanners')
            return (
              <MobileBannersEditor
                key={key}
                config={banners}
                onChange={(next) => {
                  setBanners(next);
                  change(key, JSON.stringify(next));
                }}
              />
            );
          if (key === 'navOrder' || key === 'homeOrder')
            return (
              <fieldset key={key} className="setting-collection">
                <legend>{label}</legend>
                <OrderedOptions
                  value={value}
                  labels={key === 'navOrder' ? NAV_LINKS : HOME_SECTIONS}
                  onChange={(v) => change(key, v)}
                />
              </fieldset>
            );
          return (
            <div className="setting-field" key={key}>
              <label htmlFor={id}>{label}</label>
              {key === 'closedSunday' ? (
                <select id={id} value={value} onChange={(e) => change(key, e.target.value)}>
                  <option value="second">둘째 주 일요일 휴관</option>
                  <option value="none">정기 휴관 없음</option>
                </select>
              ) : ['directions', 'floors', 'services', 'seoDescription', 'deskNote'].includes(key) ? (
                <textarea
                  id={id}
                  rows={['directions', 'floors', 'services'].includes(key) ? 5 : 2}
                  value={value}
                  onChange={(e) => change(key, e.target.value)}
                />
              ) : (
                <input
                  id={id}
                  type={key === 'accent' ? 'color' : 'text'}
                  value={value}
                  onChange={(e) => change(key, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </fieldset>
      <footer>
        <span aria-live="polite">
          {changed ? '저장할 변경사항이 있습니다' : '저장된 버전 ' + record.version}
        </span>
        <Button type="submit" disabled={!changed || mutation.isPending}>
          <Save size={16} />
          설정 저장
        </Button>
      </footer>
      {(validation || mutation.isError) && (
        <p role="alert">
          {validation || errorMessage(mutation.error)}{' '}
          {isApiError(mutation.error, 'CONFLICT') && (
            <button type="button" onClick={reload}>
              최신 설정 불러오기
            </button>
          )}
        </p>
      )}
    </form>
  );
}
function Settings() {
  const query = useQuery({ queryKey: SETTINGS_KEY, queryFn: api.site.settings });
  if (query.isPending) return <ListSkeleton rows={4} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  return <Editor key={query.data.version} record={query.data} reload={() => void query.refetch()} />;
}
export default function Page() {
  return (
    <AdminPage
      title="사이트 설정"
      permission="site.manage"
      description="공개 웹사이트의 기관 정보, 메뉴와 콘텐츠를 관리합니다."
    >
      <Settings />
    </AdminPage>
  );
}
