'use client';

import { EditorIndex } from './editor-index';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckboxField,
  DateField,
  FormError,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/ui/field';
import { clubFormSchema, parseValues, type ClubFormInput, type FieldErrors } from '@/domain/schemas';
import type { Club, ClubActivity, MediaPhoto } from '@/domain/types';

const URL_HINT = 'https:// 로 시작하는 주소';

/**
 * 추가·삭제 가능한 행 목록. 입력은 비제어(defaultValue)이고 제출 시 FormData 에서 같은 이름의 값을
 * 순서대로 모은다. 행 key 는 고정 id 라 중간 행을 지워도 다른 행의 입력값이 유지된다.
 */
function RowList<T>({
  legend,
  hint,
  initial,
  blank,
  addLabel,
  error,
  children,
}: {
  legend: string;
  hint?: string;
  initial: T[];
  blank: T;
  addLabel: string;
  error?: string;
  children: (row: T, index: number) => ReactNode;
}) {
  const [rows, setRows] = useState(() => initial.map((value, id) => ({ id, value })));
  const [nextId, setNextId] = useState(initial.length);
  return (
    <fieldset id={'edit-' + legend.replaceAll(' ', '-')} className="editor-section">
      <legend className="text-[15px] font-bold">{legend}</legend>
      {hint && <p className="mt-1 text-sm text-ink-600">{hint}</p>}
      {rows.length > 0 && (
        <ol className="mt-3 divide-y divide-line border-y border-line">
          {rows.map((r, i) => (
            <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
              <span className="w-6 shrink-0 pt-1 text-sm font-bold text-ink-600 tabular-nums">{i + 1}</span>
              <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">{children(r.value, i)}</div>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                className="self-end sm:self-start"
                onClick={() => setRows((list) => list.filter((x) => x.id !== r.id))}
              >
                {legend} {i + 1} 삭제
              </Button>
            </li>
          ))}
        </ol>
      )}
      {error && <p className="mt-2 text-sm font-medium text-danger-700">{error}</p>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => {
          setRows((list) => [...list, { id: nextId, value: blank }]);
          setNextId((n) => n + 1);
        }}
      >
        {addLabel}
      </Button>
    </fieldset>
  );
}

/** 행 단위 오류가 있으면 목록 전체 오류는 중복이라 숨긴다 */
function listError(errors: FieldErrors, key: string): string | undefined {
  return Object.keys(errors).some((k) => k.startsWith(`${key}.`)) ? undefined : errors[key];
}

/** FormData → 스키마 입력값. 반복 행은 같은 이름의 값을 순서대로 묶는다. */
function readForm(fd: FormData): Record<string, unknown> {
  const col = (name: string) => fd.getAll(name).map(String);
  const zip = (names: Record<string, string>) => {
    const cols = Object.entries(names).map(([key, name]) => [key, col(name)] as const);
    return (cols[0]?.[1] ?? []).map((_, i) => Object.fromEntries(cols.map(([key, v]) => [key, v[i] ?? ''])));
  };
  return {
    ...Object.fromEntries(fd),
    photos: zip({ url: 'photoUrl', caption: 'photoCaption', sourceUrl: 'photoSourceUrl', date: 'photoDate' }),
    activities: zip({ date: 'activityDate', title: 'activityTitle', url: 'activityUrl' }),
    sourceUrls: col('sourceUrl'),
  };
}

interface ClubFormProps {
  initial?: Club;
  submitLabel: string;
  pending: boolean;
  serverErrors: FieldErrors;
  formError: string | null;
  onSubmit: (input: ClubFormInput) => void;
}

export function ClubForm({
  initial,
  submitLabel,
  pending,
  serverErrors,
  formError,
  onSubmit,
}: ClubFormProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const shown = { ...errors, ...serverErrors };

  return (
    <form
      noValidate
      className="editor-sheet console-form space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const parsed = parseValues(clubFormSchema, readForm(new FormData(e.currentTarget)));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        onSubmit(parsed.data);
      }}
    >
      <EditorIndex sections={['동아리 소개', '활동 안내', '사진', '활동', '정보 출처', '모집 설정']} />
      <fieldset id="edit-동아리-소개" className="editor-section space-y-5">
        <legend>동아리 소개</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="동아리명"
            name="name"
            required
            maxLength={40}
            defaultValue={initial?.name}
            error={shown.name}
          />
          <TextField
            label="활동 분야"
            name="field"
            required
            maxLength={40}
            defaultValue={initial?.field}
            error={shown.field}
          />
        </div>
        <TextField
          label="한 줄 소개"
          name="summary"
          required
          maxLength={120}
          defaultValue={initial?.summary}
          error={shown.summary}
        />
        <TextAreaField
          label="소개"
          name="description"
          required
          rows={8}
          maxLength={5000}
          defaultValue={initial?.description}
          error={shown.description}
        />
      </fieldset>
      <fieldset id="edit-활동-안내" className="editor-section space-y-5">
        <legend>활동 안내</legend>
        <TextField
          label="모임 안내"
          name="meetingInfo"
          required
          maxLength={200}
          defaultValue={initial?.meetingInfo}
          error={shown.meetingInfo}
          hint="예) 매주 토요일 오후 2시, 2층 미디어실"
        />
        <TextField
          label="대상"
          name="target"
          maxLength={100}
          defaultValue={initial?.target ?? ''}
          error={shown.target}
          hint="예) 중구 거주 또는 관내 학교 재학 14~24세 청소년. 확인되지 않았으면 비워 두세요."
        />
      </fieldset>
      <RowList<MediaPhoto>
        legend="사진"
        hint="센터 공식 채널에 올린 사진만 등록하고 출처(게시물 주소)를 함께 적습니다. 청소년 얼굴이 식별되는 사진은 보호자 동의를 확인한 뒤 등록하세요."
        initial={initial?.photos ?? []}
        blank={{ url: '', caption: '', sourceUrl: '', date: null }}
        addLabel="사진 추가"
        error={listError(shown, 'photos')}
      >
        {(p, i) => (
          <>
            <TextField
              label="이미지 주소"
              name="photoUrl"
              type="url"
              required
              defaultValue={p.url}
              placeholder={URL_HINT}
              error={shown[`photos.${i}.url`]}
            />
            <TextField
              label="사진 설명 (대체 텍스트)"
              name="photoCaption"
              required
              maxLength={100}
              defaultValue={p.caption}
              error={shown[`photos.${i}.caption`]}
            />
            <TextField
              label="출처 주소"
              name="photoSourceUrl"
              type="url"
              required
              defaultValue={p.sourceUrl}
              placeholder={URL_HINT}
              error={shown[`photos.${i}.sourceUrl`]}
            />
            <DateField
              label="게시일"
              name="photoDate"
              clearable
              defaultValue={p.date ?? ''}
              error={shown[`photos.${i}.date`]}
            />
          </>
        )}
      </RowList>

      <RowList<ClubActivity>
        legend="활동"
        hint="최근 활동을 최신순으로 적습니다. 날짜를 월까지만 알면 YYYY-MM 으로 적습니다."
        initial={initial?.activities ?? []}
        blank={{ date: '', title: '', url: null }}
        addLabel="활동 추가"
        error={listError(shown, 'activities')}
      >
        {(a, i) => (
          <>
            <TextField
              label="날짜"
              name="activityDate"
              required
              inputMode="numeric"
              placeholder="2026-10-01"
              defaultValue={a.date}
              error={shown[`activities.${i}.date`]}
            />
            <TextField
              label="활동명"
              name="activityTitle"
              required
              maxLength={100}
              defaultValue={a.title}
              error={shown[`activities.${i}.title`]}
            />
            <TextField
              label="관련 게시물 주소"
              name="activityUrl"
              type="url"
              className="sm:col-span-2"
              defaultValue={a.url ?? ''}
              placeholder={URL_HINT}
              error={shown[`activities.${i}.url`]}
            />
          </>
        )}
      </RowList>

      <RowList<string>
        legend="정보 출처"
        hint="소개 내용을 확인한 공식 홈페이지·SNS 게시물 주소"
        initial={initial?.sourceUrls ?? []}
        blank=""
        addLabel="출처 추가"
        error={listError(shown, 'sourceUrls')}
      >
        {(u, i) => (
          <TextField
            label="주소"
            name="sourceUrl"
            type="url"
            required
            className="sm:col-span-2"
            defaultValue={u}
            placeholder={URL_HINT}
            error={shown[`sourceUrls.${i}`]}
          />
        )}
      </RowList>

      <fieldset className="editor-section" id="edit-모집-설정">
        <legend>모집 설정</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="운영 상태"
            name="status"
            required
            defaultValue={initial?.status ?? 'active'}
            error={shown.status}
            options={[
              { value: 'active', label: '운영 중' },
              { value: 'inactive', label: '운영 중지' },
            ]}
          />
          <div className="sm:pt-8">
            <CheckboxField
              label="신규 회원 모집 중"
              name="recruiting"
              defaultChecked={initial?.recruiting ?? true}
              error={shown.recruiting}
            />
          </div>
        </div>
      </fieldset>
      <FormError message={formError} />
      <div className="editor-actions flex justify-end">
        <Button type="submit" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
