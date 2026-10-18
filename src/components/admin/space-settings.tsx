'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckboxField, TextAreaField, TextField } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { parseForm, spaceFormSchema, type FieldErrors, type SpaceFormInput } from '@/domain/schemas';
import type { Space } from '@/domain/types';
import { serverFieldErrors } from './form-utils';
import { QueryState } from './query-state';

export function useAdminSpaces() {
  return useQuery({ queryKey: ['admin', 'spaces'], queryFn: () => api.admin.spaces.list() });
}

function SpaceForm({ space }: { space: Space }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const save = useMutation({
    mutationFn: (input: SpaceFormInput) => api.admin.spaces.update(space.id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'spaces'] });
      void qc.invalidateQueries({ queryKey: ['spaces'] });
      toast.success(`${space.name} 설정을 저장했습니다.`);
    },
    onError: (e) => {
      setErrors(serverFieldErrors(e));
      toast.error(errorMessage(e));
    },
  });

  return (
    <form
      noValidate
      aria-labelledby={`space-${space.id}`}
      className="border-b border-line py-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (save.isPending) return;
        const parsed = parseForm(spaceFormSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        save.mutate(parsed.data);
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 id={`space-${space.id}`} className="text-base font-bold">
          {space.name} <span className="font-normal text-ink-600">· {space.floor}</span>
        </h3>
        {space.reservable ? <Badge tone="success">예약 받음</Badge> : <Badge tone="warning">예약 중지</Badge>}
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <TextAreaField
          label="설명"
          name="description"
          required
          rows={3}
          maxLength={500}
          defaultValue={space.description}
          error={errors.description}
        />
        <TextField
          label="수용 인원"
          name="capacity"
          type="number"
          inputMode="numeric"
          min={1}
          max={1000}
          required
          defaultValue={space.capacity}
          error={errors.capacity}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CheckboxField
          label="예약 접수 (휴관·점검 시 해제)"
          name="reservable"
          defaultChecked={space.reservable}
          error={errors.reservable}
        />
        <Button type="submit" variant="secondary" loading={save.isPending}>
          저장
        </Button>
      </div>
    </form>
  );
}

/** 공간별 설명·수용 인원·예약 접수 여부 편집 */
export function SpaceSettings() {
  const spaces = useAdminSpaces();
  return (
    <section aria-labelledby="space-settings-title">
      <h2 id="space-settings-title" className="sr-only">
        공간 설정
      </h2>
      <QueryState
        query={spaces}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="등록된 공간이 없습니다" />}
      >
        {(d) => (
          <div className="max-w-3xl border-t border-line">
            {d.map((s) => (
              <SpaceForm key={JSON.stringify(s)} space={s} />
            ))}
          </div>
        )}
      </QueryState>
    </section>
  );
}
