'use client';

import { ContentHistory } from '@/features/applications/content';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { api, errorMessage, isApiError, type ApiClient } from '@/api';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { QueryState } from '@/components/admin/query-state';
import { RejectDialog } from '@/components/admin/reject-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonClass } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { CheckboxField, FormError, SelectField, TextAreaField, TextField } from '@/components/ui/field';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { CLUB_APPLICATION_STATUS, CLUB_POST_KIND_LABEL, CLUB_ROLE_LABEL } from '@/domain/labels';
import { clubIntroSchema, clubPostSchema, parseForm, type FieldErrors } from '@/domain/schemas';
import type { Club, ClubApplication, ClubRosterEntry } from '@/domain/types';
import { formatDate, formatDateTime } from '@/lib/format';

type Manage = ApiClient['manage'];
type Decision = Parameters<Manage['decideApplication']>[2];

const keys = {
  roster: (id: string) => ['manage', 'roster', id],
  applications: (id: string) => ['manage', 'applications', id],
  posts: (id: string) => ['club', id, 'posts'],
};

export function useManagedClubs() {
  return useQuery({ queryKey: ['manage', 'clubs'], queryFn: () => api.manage.clubs() });
}

/* ---------- 회원 ---------- */

export function MembersTab({ clubId }: { clubId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const roster = useQuery({ queryKey: keys.roster(clubId), queryFn: () => api.manage.roster(clubId) });
  const [removing, setRemoving] = useState<ClubRosterEntry | null>(null);
  const done = (message: string) => {
    void qc.invalidateQueries({ queryKey: keys.roster(clubId) });
    void qc.invalidateQueries({ queryKey: ['manage', 'clubs'] });
    toast.success(message);
  };
  const setRole = useMutation({
    mutationFn: (m: ClubRosterEntry) =>
      api.manage.setMemberRole(clubId, m.userId, m.role === 'leader' ? 'member' : 'leader'),
    onSuccess: (m) => done(`${m.name}님을 ${CLUB_ROLE_LABEL[m.role]}(으)로 바꿨습니다.`),
    onError: (e) => toast.error(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: (m: ClubRosterEntry) => api.manage.removeMember(clubId, m.userId),
    onSuccess: () => {
      done('동아리에서 제외했습니다.');
      setRemoving(null);
    },
    onError: (e) => {
      setRemoving(null);
      toast.error(errorMessage(e));
    },
  });

  return (
    <QueryState query={roster}>
      {(list) =>
        list.length === 0 ? (
          <EmptyState title="동아리 회원이 없습니다" description="가입 신청을 승인하면 회원이 됩니다." />
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-600">
              연락처는 동아리 운영(일정 안내·출석 확인) 목적으로만 사용하세요. 회원 {list.length}명
            </p>
            <ul className="divide-y divide-line border-y border-line bg-surface">
              {list.map((m) => (
                <li key={m.userId} className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {m.name}
                      {m.role === 'leader' && <Badge tone="brand">{CLUB_ROLE_LABEL.leader}</Badge>}
                    </p>
                    <p className="text-sm break-all text-ink-600">
                      {m.email}
                      {m.phone && ` · ${m.phone}`}
                    </p>
                    <p className="text-sm text-ink-600 tabular-nums">
                      가입 {formatDate(m.joinedAt)} · 출석률{' '}
                      {m.attendanceRate === null ? '기록 없음' : `${m.attendanceRate}%`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={setRole.isPending}
                      onClick={() => setRole.mutate(m)}
                    >
                      {m.role === 'leader' ? '동아리원으로' : '대표로 지정'}
                    </Button>
                    <Button
                      variant="tertiary"
                      size="sm"
                      className="text-danger-700"
                      onClick={() => setRemoving(m)}
                    >
                      제외
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <ConfirmDialog
              open={removing !== null}
              title="동아리에서 제외할까요?"
              description={
                removing && (
                  <>
                    <strong>{removing.name}</strong>님이 동아리 회원에서 빠집니다. 지난 출석 기록은 남습니다.
                  </>
                )
              }
              confirmLabel="제외"
              destructive
              loading={remove.isPending}
              onClose={() => setRemoving(null)}
              onConfirm={() => removing && remove.mutate(removing)}
            />
          </>
        )
      }
    </QueryState>
  );
}

/* ---------- 가입 신청 ---------- */

export function ApplicationsTab({ clubId }: { clubId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const apps = useQuery({
    queryKey: keys.applications(clubId),
    queryFn: () => api.manage.applications(clubId),
  });
  const [rejecting, setRejecting] = useState<ClubApplication | null>(null);
  const decide = useMutation({
    mutationFn: (v: { app: ClubApplication; decision: Decision; reason: string | null }) =>
      api.manage.decideApplication(clubId, v.app.id, v.decision, v.reason),
    onSuccess: (a) => {
      void qc.invalidateQueries({ queryKey: keys.applications(clubId) });
      void qc.invalidateQueries({ queryKey: keys.roster(clubId) });
      setRejecting(null);
      toast.success(`${a.applicantName}님의 신청을 ${a.status === 'approved' ? '승인' : '반려'}했습니다.`);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <QueryState query={apps}>
      {(list) =>
        list.length === 0 ? (
          <EmptyState title="가입 신청이 없습니다" />
        ) : (
          <>
            <ul className="divide-y divide-line border-y border-line bg-surface">
              {list.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{a.applicantName}</p>
                    <Badge tone={CLUB_APPLICATION_STATUS[a.status].tone}>
                      {CLUB_APPLICATION_STATUS[a.status].text}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[15px] whitespace-pre-line text-ink-700">{a.motivation}</p>
                  <ContentHistory edits={a.contentEdits} />
                  <p className="mt-1 text-sm text-ink-600 tabular-nums">
                    신청 {formatDateTime(a.createdAt)}
                    {a.reason && ` · 사유: ${a.reason}`}
                  </p>
                  {a.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        loading={decide.isPending && decide.variables?.app.id === a.id}
                        onClick={() => decide.mutate({ app: a, decision: 'approved', reason: null })}
                      >
                        승인
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setRejecting(a)}>
                        반려
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <RejectDialog
              open={rejecting !== null}
              title="가입 신청을 반려할까요?"
              description={
                rejecting && (
                  <>
                    <strong>{rejecting.applicantName}</strong>님에게 반려 사유가 알림으로 전달됩니다.
                  </>
                )
              }
              loading={decide.isPending}
              onClose={() => setRejecting(null)}
              onConfirm={(reason) =>
                rejecting && decide.mutate({ app: rejecting, decision: 'rejected', reason })
              }
            />
          </>
        )
      }
    </QueryState>
  );
}

/* ---------- 소식 ---------- */

export function PostsTab({ clubId }: { clubId: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const posts = useQuery({ queryKey: keys.posts(clubId), queryFn: () => api.clubs.posts(clubId) });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formKey, setFormKey] = useState(0);
  const create = useMutation({
    mutationFn: (input: Parameters<Manage['createPost']>[1]) => api.manage.createPost(clubId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.posts(clubId) });
      setFormKey((k) => k + 1);
      toast.success('소식을 올렸습니다. 동아리 회원에게 보입니다.');
    },
    onError: (e) => {
      setErrors(serverFieldErrors(e));
      if (!isApiError(e, 'VALIDATION')) toast.error(errorMessage(e));
    },
  });
  const remove = useMutation({
    mutationFn: (postId: string) => api.manage.removePost(clubId, postId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.posts(clubId) });
      toast.success('소식을 삭제했습니다.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="space-y-6">
      <form
        key={formKey}
        noValidate
        className="space-y-4 border border-line bg-surface p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (create.isPending) return;
          const parsed = parseForm(clubPostSchema, new FormData(e.currentTarget));
          if (!parsed.ok) {
            setErrors(parsed.errors);
            return;
          }
          setErrors({});
          create.mutate(parsed.data);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <SelectField
            label="분류"
            name="kind"
            required
            defaultValue="notice"
            error={errors.kind}
            options={Object.entries(CLUB_POST_KIND_LABEL).map(([value, label]) => ({ value, label }))}
          />
          <TextField label="제목" name="title" required maxLength={100} error={errors.title} />
        </div>
        <TextAreaField label="내용" name="body" required rows={4} maxLength={2000} error={errors.body} />
        <Button type="submit" loading={create.isPending}>
          소식 올리기
        </Button>
      </form>
      <QueryState query={posts}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="올린 소식이 없습니다" />
          ) : (
            <ul className="divide-y divide-line border-y border-line bg-surface">
              {list.map((p) => (
                <li key={p.id} className="flex gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      <span className="mr-2 text-sm text-brand-700">{CLUB_POST_KIND_LABEL[p.kind]}</span>
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-[15px] whitespace-pre-line text-ink-700">{p.body}</p>
                    <p className="mt-0.5 text-sm text-ink-600 tabular-nums">{formatDateTime(p.at)}</p>
                  </div>
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="text-danger-700"
                    aria-label={`${p.title} 삭제`}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate(p.id)}
                  >
                    삭제
                  </Button>
                </li>
              ))}
            </ul>
          )
        }
      </QueryState>
    </div>
  );
}

/* ---------- 소개 ---------- */

export function IntroTab({ club }: { club: Club }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const update = useMutation({
    mutationFn: (input: Parameters<Manage['updateIntro']>[1]) => api.manage.updateIntro(club.id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['manage', 'clubs'] });
      void qc.invalidateQueries({ queryKey: ['club', club.id] });
      toast.success('동아리 소개를 저장했습니다.');
    },
    onError: (e) => {
      setErrors(serverFieldErrors(e));
      setFormError(isApiError(e, 'VALIDATION') ? null : errorMessage(e));
    },
  });

  return (
    <form
      noValidate
      className="max-w-2xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (update.isPending) return;
        const parsed = parseForm(clubIntroSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        setFormError(null);
        update.mutate(parsed.data);
      }}
    >
      <TextField
        label="한 줄 소개"
        name="summary"
        required
        maxLength={120}
        defaultValue={club.summary}
        error={errors.summary}
      />
      <TextAreaField
        label="소개"
        name="description"
        required
        rows={8}
        maxLength={5000}
        defaultValue={club.description}
        error={errors.description}
      />
      <TextField
        label="모임 일정"
        name="meetingInfo"
        required
        maxLength={100}
        defaultValue={club.meetingInfo}
        error={errors.meetingInfo}
        hint="예) 매주 토요일 오후 2시, 3층 미디어실"
      />
      <CheckboxField label="신규 회원 모집 중" name="recruiting" defaultChecked={club.recruiting} />
      <p className="text-sm text-ink-600">사진·활동 기록·정보 출처는 센터 직원이 관리합니다.</p>
      <FormError message={formError} />
      <Button type="submit" loading={update.isPending}>
        저장
      </Button>
    </form>
  );
}

/* ---------- 출석 ---------- */

export function AttendanceTab({ club }: { club: Club }) {
  return (
    <div className="border border-line bg-surface p-5">
      <p className="text-[15px] text-ink-700">
        모임마다 출석부를 만들고 체크하거나, 출석 코드를 열어 회원이 직접 출석하게 할 수 있습니다.
      </p>
      <Link href={`/admin/attendance?type=club&id=${club.id}`} className={`${buttonClass({})} mt-4`}>
        {club.name} 출석부 열기
      </Link>
    </div>
  );
}
