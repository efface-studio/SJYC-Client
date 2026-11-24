'use client';

import { EditorIndex } from './editor-index';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckboxField, FormError, SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { NOTICE_CATEGORY_LABEL, PUBLISH_STATUS } from '@/domain/labels';
import { noticeFormSchema, parseForm, type FieldErrors, type NoticeFormInput } from '@/domain/schemas';
import type { Notice, NoticeCategory } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

interface NoticeFormProps {
  initial?: Notice;
  submitLabel: string;
  pending: boolean;
  serverErrors: FieldErrors;
  formError: string | null;
  onSubmit: (input: NoticeFormInput) => void;
  /** 삭제 등 추가 버튼 */
  extraActions?: React.ReactNode;
}

interface PreviewValues {
  title: string;
  category: NoticeCategory;
  body: string;
}

/** 사용자 공지 상세 화면과 같은 방식(일반 텍스트, 줄바꿈 유지)으로 보여준다 */
function NoticePreview({ v, publishedAt }: { v: PreviewValues; publishedAt: string | null }) {
  return (
    <section
      aria-label="사용자 화면 미리보기"
      className="border border-dashed border-line-strong bg-surface p-4 md:p-6"
    >
      <p className="mb-3 text-xs font-semibold text-ink-600">미리보기 · 저장 전 내용</p>
      <p className="text-sm text-ink-600">공지사항 › {NOTICE_CATEGORY_LABEL[v.category]}</p>
      <h2 className="mt-1 text-xl leading-snug font-bold md:text-2xl">{v.title || '(제목 없음)'}</h2>
      {publishedAt && (
        <p className="mt-1 text-[15px] text-ink-600 tabular-nums">{formatDateTime(publishedAt)}</p>
      )}
      <div className="mt-4 border-t border-ink-900 pt-4 text-base leading-relaxed whitespace-pre-line">
        {v.body || '(본문 없음)'}
      </div>
    </section>
  );
}

export function NoticeForm({
  initial,
  submitLabel,
  pending,
  serverErrors,
  formError,
  onSubmit,
  extraActions,
}: NoticeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [preview, setPreview] = useState<PreviewValues | null>(null);
  const shown = { ...errors, ...serverErrors };

  const togglePreview = () => {
    if (preview || !formRef.current) {
      setPreview(null);
      return;
    }
    const fd = new FormData(formRef.current);
    const category = String(fd.get('category') ?? 'center');
    setPreview({
      title: String(fd.get('title') ?? ''),
      category: category in NOTICE_CATEGORY_LABEL ? (category as NoticeCategory) : 'center',
      body: String(fd.get('body') ?? ''),
    });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="secondary" aria-pressed={preview !== null} onClick={togglePreview}>
          {preview ? '편집으로 돌아가기' : '미리보기'}
        </Button>
      </div>
      {preview && <NoticePreview v={preview} publishedAt={initial?.publishedAt ?? null} />}
      <form
        ref={formRef}
        noValidate
        hidden={preview !== null}
        className="editor-sheet console-form space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const parsed = parseForm(noticeFormSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          onSubmit(parsed.data);
        }}
      >
        <EditorIndex sections={['공지 작성', '게시 설정']} />
        <fieldset id="edit-공지-작성" className="editor-section space-y-5">
          <legend>공지 작성</legend>{' '}
          <TextField
            label="제목"
            name="title"
            required
            maxLength={100}
            defaultValue={initial?.title}
            error={shown.title}
          />
          <TextAreaField
            label="본문"
            name="body"
            required
            rows={14}
            maxLength={10000}
            defaultValue={initial?.body}
            error={shown.body}
            hint="일반 텍스트로 게시됩니다. 줄바꿈은 그대로 표시됩니다."
          />
        </fieldset>
        <fieldset id="edit-게시-설정" className="editor-section space-y-5">
          <legend>게시 설정</legend>{' '}
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="분류"
              name="category"
              required
              defaultValue={initial?.category ?? 'center'}
              error={shown.category}
              options={Object.entries(NOTICE_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
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
          <CheckboxField
            label="목록 상단에 고정"
            name="pinned"
            defaultChecked={initial?.pinned}
            error={shown.pinned}
          />
        </fieldset>
        <FormError message={formError} />
        <div className="editor-actions flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <div>{extraActions}</div>
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </>
  );
}
