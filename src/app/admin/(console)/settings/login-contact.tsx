'use client';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import {
  audienceLabels,
  contactLabels,
  type LoginAudience,
  type ContactSettings,
  type ContactRule,
} from '@/domain/login-contact';

const key = ['admin', 'login-contact'];
function AudienceSettings({
  audience,
  record,
}: {
  audience: LoginAudience;
  record: ContactSettings[LoginAudience];
}) {
  const [rule, setRule] = useState<ContactRule>(
    record.rule ?? { allowUnverifiedEmail: true, allowUnverifiedPhone: true },
  );
  const cache = useQueryClient(),
    toast = useToast();
  const save = useMutation({
    mutationFn: () => api.admin.setLoginContact({ ...rule, audience, version: record.version }),
    onSuccess: (next) => {
      cache.setQueryData(key, next);
      toast.success(audienceLabels[audience] + ' 로그인 정책을 저장했습니다.');
    },
    onError: (e) => {
      toast.error(errorMessage(e));
      void cache.invalidateQueries({ queryKey: key });
    },
  });
  const unchanged =
    record.rule &&
    record.rule.allowUnverifiedEmail === rule.allowUnverifiedEmail &&
    record.rule.allowUnverifiedPhone === rule.allowUnverifiedPhone;
  return (
    <fieldset disabled={save.isPending} className="min-w-0 space-y-3 border-t border-line py-4">
      <legend className="pr-2 font-semibold">{audienceLabels[audience]}</legend>
      {!record.rule && (
        <p className="text-sm text-ink-600">
          아직 별도 정책이 없습니다. 아래 설정을 저장하면 다음 로그인부터 적용됩니다.
        </p>
      )}
      {(['allowUnverifiedEmail', 'allowUnverifiedPhone'] as const).map((k) => (
        <label key={k} className="flex min-h-11 items-center justify-between gap-3">
          {contactLabels[k]}
          <input
            type="checkbox"
            role="switch"
            checked={rule[k]}
            onChange={(e) => setRule({ ...rule, [k]: e.target.checked })}
            className="relative h-6 w-11 shrink-0 appearance-none rounded-full bg-zinc-400 transition-colors before:absolute before:top-0.5 before:left-0.5 before:size-5 before:rounded-full before:bg-white before:transition-transform checked:bg-violet-700 checked:before:translate-x-5 focus-visible:outline-2 focus-visible:outline-offset-2 forced-colors:appearance-auto"
          />
        </label>
      ))}
      <Button
        variant="secondary"
        size="sm"
        disabled={!!unchanged || save.isPending}
        onClick={() => save.mutate()}
      >
        {audienceLabels[audience]} 정책 저장
      </Button>
    </fieldset>
  );
}
export function LoginContactSettings() {
  const q = useQuery({ queryKey: key, queryFn: api.admin.loginContact });
  return (
    <section aria-labelledby="login-contact-heading" className="console-surface mb-6 p-5">
      <h2 id="login-contact-heading" className="text-xl font-bold">
        로그인 정책
      </h2>
      <p className="mt-1 mb-5 text-sm text-ink-600">허용을 끈 항목은 다음 로그인부터 인증이 필요합니다.</p>
      {q.isPending ? (
        <ListSkeleton rows={2} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      ) : (
        <div className="grid gap-x-8 md:grid-cols-2">
          {(['user', 'admin'] as const).map((a) => (
            <AudienceSettings key={a + q.data[a].version} audience={a} record={q.data[a]} />
          ))}
        </div>
      )}
    </section>
  );
}
