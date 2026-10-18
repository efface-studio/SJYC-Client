'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DateField,
  FormError,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui/field';
import { PUBLISH_STATUS } from '@/domain/labels';
import { parseForm, programFormSchema, type FieldErrors, type ProgramFormInput } from '@/domain/schemas';
import type { Program } from '@/domain/types';
import { useCategories } from '@/features/programs/program-card';
import { toDateInput } from '@/lib/format';

interface ProgramFormProps {
  initial?: Program;
  submitLabel: string;
  pending: boolean;
  serverErrors: FieldErrors;
  formError: string | null;
  onSubmit: (input: ProgramFormInput) => void;
  extraActions?: React.ReactNode;
}

const DATE_FIELDS = [
  { name: 'recruitStartsAt', label: '모집 시작일' },
  { name: 'recruitEndsAt', label: '모집 마감일' },
  { name: 'startsAt', label: '프로그램 시작일' },
  { name: 'endsAt', label: '프로그램 종료일' },
  { name: 'cancelDeadline', label: '취소 마감일' },
] as const;

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-line pt-5">
      <legend className="float-left mb-4 w-full text-base font-bold">{legend}</legend>
      {children}
    </fieldset>
  );
}

export function ProgramForm({
  initial,
  submitLabel,
  pending,
  serverErrors,
  formError,
  onSubmit,
  extraActions,
}: ProgramFormProps) {
  const categories = useCategories();
  const [errors, setErrors] = useState<FieldErrors>({});
  const shown = { ...errors, ...serverErrors };
  const groups = [...new Set(categories.data?.map((c) => c.group) ?? [])];

  return (
    <form
      noValidate
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const parsed = parseForm(programFormSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        onSubmit(parsed.data);
      }}
    >
      <Fieldset legend="기본 정보">
        <TextField
          label="프로그램명"
          name="title"
          required
          maxLength={100}
          defaultValue={initial?.title}
          error={shown.title}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="분류"
            name="categoryId"
            required
            defaultValue={initial?.categoryId ?? ''}
            key={categories.data ? 'loaded' : 'loading'}
            disabled={!categories.data}
            placeholder={categories.data ? '분류 선택' : '불러오는 중…'}
            options={groups.flatMap((g) =>
              (categories.data ?? [])
                .filter((c) => c.group === g)
                .map((c) => ({ value: c.id, label: c.name, group: g })),
            )}
            error={
              shown.categoryId ??
              (categories.isError ? '분류 목록을 불러오지 못했습니다. 새로고침해 주세요.' : undefined)
            }
          />
          <SelectField
            label="게시 상태"
            name="status"
            required
            defaultValue={initial?.status ?? 'draft'}
            error={shown.status}
            options={Object.entries(PUBLISH_STATUS).map(([value, l]) => ({ value, label: l.text }))}
          />
        </div>
        <TextField
          label="한 줄 요약"
          name="summary"
          required
          maxLength={120}
          defaultValue={initial?.summary}
          error={shown.summary}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="대상"
            name="target"
            required
            maxLength={100}
            defaultValue={initial?.target}
            error={shown.target}
          />
          <TextField
            label="장소"
            name="place"
            required
            maxLength={100}
            defaultValue={initial?.place}
            error={shown.place}
          />
        </div>
        <NumberField
          label="정원"
          name="capacity"
          min={1}
          max={1000}
          required
          defaultValue={initial?.capacity}
          error={shown.capacity}
          hint={initial ? `현재 신청 ${initial.appliedCount}명` : undefined}
          className="sm:w-48"
        />
      </Fieldset>

      <Fieldset legend="일정">
        <div className="grid gap-5 sm:grid-cols-2">
          {DATE_FIELDS.map((f) => (
            <DateField
              key={f.name}
              label={f.label}
              name={f.name}
              required
              defaultValue={initial ? toDateInput(initial[f.name]) : undefined}
              error={shown[f.name]}
            />
          ))}
        </div>
      </Fieldset>

      <Fieldset legend="상세 내용">
        <TextAreaField
          label="상세 내용"
          name="description"
          required
          rows={12}
          maxLength={10000}
          defaultValue={initial?.description}
          error={shown.description}
          hint="일반 텍스트로 게시됩니다."
        />
      </Fieldset>

      <FormError message={formError} />
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-between">
        <div>{extraActions}</div>
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
