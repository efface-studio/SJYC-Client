'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage, isApiError } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { serverFieldErrors } from '@/components/admin/form-utils';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPickerDate } from '@/components/ui/date-picker';
import { DateField, FormError, TextField } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { attendanceTargetKey, sessionCounts } from '@/domain/attendance';
import { canManageAttendance } from '@/domain/permissions';
import { ATTENDANCE_STATUS, ATTENDANCE_TARGET_LABEL } from '@/domain/labels';
import { attendanceSessionSchema, parseForm, type FieldErrors } from '@/domain/schemas';
import type { AttendanceSession, AttendanceTarget, AttendanceTargetSummary } from '@/domain/types';
import { todayKst } from '@/lib/format';

const STATUSES = ['present', 'late', 'absent', 'excused'] as const;

function CreateSessionForm({ target, count }: { target: AttendanceTargetSummary; count: number }) {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: (input: { date: string; title: string }) => api.attendance.create(target, input),
    onSuccess: (s) => {
      void qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('출석부를 만들었습니다.');
      router.push(`/admin/attendance/${s.id}`);
    },
    onError: (e) => {
      setErrors(serverFieldErrors(e));
      setFormError(isApiError(e, 'VALIDATION') ? null : errorMessage(e));
    },
  });

  return (
    <form
      noValidate
      className="grid gap-4 border border-line bg-surface p-4 sm:grid-cols-[220px_1fr_auto] sm:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        if (create.isPending) return;
        const parsed = parseForm(attendanceSessionSchema, new FormData(e.currentTarget));
        if (!parsed.ok) {
          setErrors(parsed.errors);
          return;
        }
        setErrors({});
        setFormError(null);
        create.mutate(parsed.data);
      }}
    >
      <DateField label="날짜" name="date" required defaultValue={todayKst()} error={errors.date} />
      <TextField
        label="회차 이름"
        name="title"
        required
        maxLength={50}
        defaultValue={target.type === 'program' ? `${count + 1}회차` : '정기 모임'}
        error={errors.title}
      />
      <Button type="submit" loading={create.isPending} className="sm:mt-[30px]">
        출석부 만들기
      </Button>
      {formError && (
        <div className="sm:col-span-3">
          <FormError message={formError} />
        </div>
      )}
    </form>
  );
}

function SessionRow({ s }: { s: AttendanceSession }) {
  const c = sessionCounts(s);
  return (
    <li>
      <Link
        href={`/admin/attendance/${s.id}`}
        className="flex flex-col gap-2 px-4 py-3 hover:bg-surface-admin/60 sm:flex-row sm:items-center"
      >
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {s.title}
            {s.checkInCode && <Badge tone="brand">출석 코드 진행 중</Badge>}
          </p>
          <p className="text-sm text-ink-600 tabular-nums">{formatPickerDate(s.date)}</p>
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums">
          {STATUSES.map((k) => (
            <span key={k}>
              {ATTENDANCE_STATUS[k].text} <strong>{c[k]}</strong>
            </span>
          ))}
          <span className={c.unchecked ? 'font-semibold text-warning-800' : 'text-ink-600'}>
            미체크 <strong>{c.unchecked}</strong>
          </span>
        </p>
      </Link>
    </li>
  );
}

function StatsTable({ target }: { target: AttendanceTarget }) {
  const stats = useQuery({
    queryKey: ['attendance', 'stats', attendanceTargetKey(target)],
    queryFn: () => api.attendance.stats(target),
  });
  return (
    <QueryState query={stats}>
      {(rows) =>
        rows.length === 0 ? (
          <EmptyState title="통계가 없습니다" description="출석을 체크하면 회원별로 누적됩니다." />
        ) : (
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full min-w-[480px] text-[15px]">
              <caption className="sr-only">회원별 출석 통계</caption>
              <thead className="bg-surface-admin text-left text-sm">
                <tr>
                  <th scope="col" className="px-4 py-2 font-semibold">
                    이름
                  </th>
                  {STATUSES.map((k) => (
                    <th key={k} scope="col" className="px-3 py-2 text-right font-semibold">
                      {ATTENDANCE_STATUS[k].text}
                    </th>
                  ))}
                  <th scope="col" className="px-4 py-2 text-right font-semibold">
                    출석률
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.userId} className="border-t border-line">
                    <th scope="row" className="px-4 py-2 text-left font-semibold">
                      {r.name}
                    </th>
                    {STATUSES.map((k) => (
                      <td key={k} className="px-3 py-2 text-right tabular-nums">
                        {r[k]}
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {r.rate === null ? '—' : `${r.rate}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </QueryState>
  );
}

function TargetPanel({ target }: { target: AttendanceTargetSummary }) {
  const sessions = useQuery({
    queryKey: ['attendance', 'sessions', attendanceTargetKey(target)],
    queryFn: () => api.attendance.sessions(target),
  });
  return (
    <div className="space-y-8">
      <section aria-labelledby="att-sessions">
        <h2 id="att-sessions" className="mb-3 text-base font-bold">
          출석부 <span className="font-normal text-ink-600">· 명단 {target.rosterCount}명</span>
        </h2>
        <QueryState query={sessions}>
          {(list) => (
            <div className="space-y-4">
              <CreateSessionForm target={target} count={list.length} />
              {list.length === 0 ? (
                <EmptyState
                  title="아직 출석부가 없습니다"
                  description="날짜와 회차 이름으로 첫 출석부를 만드세요."
                />
              ) : (
                <ul className="divide-y divide-line border-y border-line bg-surface">
                  {list.map((s) => (
                    <SessionRow key={s.id} s={s} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </QueryState>
      </section>
      <section aria-labelledby="att-stats">
        <h2 id="att-stats" className="mb-3 text-base font-bold">
          회원별 출석
        </h2>
        <StatsTable target={target} />
      </section>
    </div>
  );
}

function AttendanceIndex() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const targets = useQuery({ queryKey: ['attendance', 'targets'], queryFn: () => api.attendance.targets() });

  return (
    <QueryState query={targets}>
      {(list) => {
        if (list.length === 0) return <EmptyState title="출석을 관리할 동아리·프로그램이 없습니다" />;
        const current =
          list.find((t) => t.type === params.get('type') && t.id === params.get('id')) ??
          list.find((t) => t.sessionCount > 0) ??
          list[0]!;
        return (
          <div className="space-y-6">
            <div className="max-w-md">
              <label htmlFor="att-target" className="mb-1 block text-sm font-semibold text-ink-700">
                출석 대상
              </label>
              <Select
                id="att-target"
                title="출석 대상"
                value={attendanceTargetKey(current)}
                onValueChange={(v) => {
                  const [type, id] = v.split(':');
                  router.replace(`${pathname}?type=${type}&id=${id}`, { scroll: false });
                }}
                options={list.map((t) => ({
                  value: attendanceTargetKey(t),
                  label: `${t.name} · ${t.rosterCount}명`,
                  group: ATTENDANCE_TARGET_LABEL[t.type],
                }))}
              />
            </div>
            <TargetPanel key={attendanceTargetKey(current)} target={current} />
          </div>
        );
      }}
    </QueryState>
  );
}

export default function AdminAttendancePage() {
  return (
    <AdminPage
      title="출석"
      permission={canManageAttendance}
      description="동아리 모임·프로그램 회차별 출석부를 만들고 체크합니다. 출석 코드를 열면 회원이 직접 출석할 수 있습니다."
    >
      <AttendanceIndex />
    </AdminPage>
  );
}
