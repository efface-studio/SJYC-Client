'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { api, errorMessage } from '@/api';
import { Button } from '@/components/ui/button';
import type { ApplicationContentEdit, ApplicationEditInput } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

export function ContentHistory({ edits }: { edits?: ApplicationContentEdit[] }) {
  if (!edits?.length) return null;
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer font-semibold">(수정됨) · 이력 {edits.length}건 보기</summary>
      <ol className="mt-2 space-y-2 border-l border-line pl-3">
        <li>
          최초 작성<p className="whitespace-pre-line">{edits[0]?.previous || '내용 없음'}</p>
        </li>
        {edits.map((edit, i) => (
          <li key={i}>
            <time dateTime={edit.at}>{formatDateTime(edit.at)}</time> 수정
            <p className="whitespace-pre-line">{edit.next || '내용 없음'}</p>
          </li>
        ))}
      </ol>
    </details>
  );
}

export function ApplicationEditor({
  kind,
  id,
  value,
  revision,
}: {
  kind: 'program' | 'club';
  id: string;
  value: string;
  revision: number;
}) {
  const qc = useQueryClient();
  const fieldId = useId();
  const program = kind === 'program';
  const label = program ? '요청 사항' : '가입 동기';
  const [draft, setDraft] = useState<ApplicationEditInput | null>(null);
  const key = program ? ['my-application', id] : ['my-club-applications'];
  const save = useMutation({
    mutationFn: async (input: ApplicationEditInput) => {
      if (program) await api.me.editApplication(id, input);
      else await api.me.editClubApplication(id, input);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: key });
      if (program) void qc.invalidateQueries({ queryKey: ['my-applications'] });
      setDraft(null);
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: key });
    },
  });
  if (!draft)
    return (
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          save.reset();
          setDraft({ value, revision });
        }}
      >
        {label} 수정
      </Button>
    );
  return (
    <form
      className="mt-2 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!save.isPending) save.mutate(draft);
      }}
    >
      <label htmlFor={fieldId} className="block text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={fieldId}
        className="w-full rounded-md border border-line p-3"
        rows={3}
        value={draft.value}
        minLength={program ? 0 : 10}
        required={!program}
        maxLength={program ? 300 : 500}
        onChange={(e) => setDraft({ ...draft, value: e.target.value })}
      />
      {save.isError && <p role="alert">{errorMessage(save.error)}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={save.isPending} onClick={() => setDraft(null)}>
          취소
        </Button>
        <Button
          size="sm"
          type="submit"
          loading={save.isPending}
          disabled={draft.value.trim() === value || (!program && draft.value.trim().length < 10)}
        >
          저장
        </Button>
      </div>
    </form>
  );
}
