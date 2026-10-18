'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { AttendanceStatusPicker } from '@/components/admin/attendance-status-picker';
import { QueryState } from '@/components/admin/query-state';
import { Button } from '@/components/ui/button';
import { formatPickerDate } from '@/components/ui/date-picker';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { sessionCounts } from '@/domain/attendance';
import { ATTENDANCE_STATUS, ATTENDANCE_TARGET_LABEL } from '@/domain/labels';
import type { AttendanceMark, AttendanceSession } from '@/domain/types';
import { formatDateTime } from '@/lib/format';

const listHref = (s: AttendanceSession) => `/admin/attendance?type=${s.targetType}&id=${s.targetId}`;

function useRemaining(until: string | null): string | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  if (!until) return null;
  const left = Math.max(0, Math.floor((Date.parse(until) - now) / 1000));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}

function CheckInPanel({
  session,
  onChange,
}: {
  session: AttendanceSession;
  onChange: (s: AttendanceSession) => void;
}) {
  const toast = useToast();
  const remaining = useRemaining(session.checkInClosesAt);
  const toggle = useMutation({
    mutationFn: (open: boolean) => api.attendance.setCheckIn(session.id, open),
    onSuccess: (s) => {
      onChange(s);
      toast.success(s.checkInCode ? '출석 코드를 열었습니다.' : '출석 코드를 닫았습니다.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const open = !!session.checkInCode && remaining !== '0:00';

  return (
    <section aria-labelledby="checkin-title" className="border border-line bg-surface p-4 sm:p-5">
      <h2 id="checkin-title" className="text-base font-bold">
        출석 코드
      </h2>
      {open ? (
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              aria-label={`출석 코드 ${session.checkInCode!.split('').join(' ')}`}
              className="text-5xl font-bold tracking-[0.3em] text-brand-700 tabular-nums"
            >
              {session.checkInCode}
            </p>
            <p className="mt-2 text-sm text-ink-600">
              회원이 마이페이지 → 출석에서 입력합니다. 남은 시간{' '}
              <strong className="tabular-nums">{remaining}</strong>
            </p>
          </div>
          <Button variant="secondary" loading={toggle.isPending} onClick={() => toggle.mutate(false)}>
            코드 닫기
          </Button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-ink-700">
            코드를 열면 명단의 회원이 10분 동안 직접 출석할 수 있습니다. 담당자가 이미 체크한 회원은 바뀌지
            않습니다.
          </p>
          <Button loading={toggle.isPending} onClick={() => toggle.mutate(true)} className="shrink-0">
            출석 코드 열기
          </Button>
        </div>
      )}
    </section>
  );
}

function Roster({
  session,
  onChange,
}: {
  session: AttendanceSession;
  onChange: (s: AttendanceSession) => void;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const key = ['attendance', 'session', session.id];
  const mark = useMutation({
    mutationFn: (marks: AttendanceMark[]) => api.attendance.mark(session.id, marks),
    // 누르는 즉시 반영하고, 실패하면 되돌린다
    onMutate: async (marks) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<AttendanceSession>(key);
      if (prev) {
        qc.setQueryData<AttendanceSession>(key, {
          ...prev,
          records: prev.records.map((r) => {
            const m = marks.find((x) => x.userId === r.userId);
            return m ? { ...r, status: m.status, method: m.status ? 'manager' : null } : r;
          }),
        });
      }
      return { prev };
    },
    onError: (e, _marks, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error(errorMessage(e));
    },
    onSuccess: (s) => {
      onChange(s);
      void qc.invalidateQueries({ queryKey: ['attendance', 'stats'] });
      void qc.invalidateQueries({ queryKey: ['attendance', 'sessions'] });
    },
  });
  const unchecked = session.records.filter((r) => r.status === null);

  return (
    <section aria-labelledby="roster-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 id="roster-title" className="text-base font-bold">
          명단 <span className="font-normal text-ink-600">{session.records.length}명</span>
        </h2>
        <Button
          variant="secondary"
          size="sm"
          disabled={unchecked.length === 0 || mark.isPending}
          onClick={() => mark.mutate(unchecked.map((r) => ({ userId: r.userId, status: 'present' })))}
        >
          미체크 {unchecked.length}명 모두 출석
        </Button>
      </div>
      {session.records.length === 0 ? (
        <p className="border border-line bg-surface p-4 text-ink-600">
          명단이 비어 있습니다. 출석부를 만든 시점의 동아리원·승인된 신청자가 명단이 됩니다.
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line bg-surface">
          {session.records.map((r) => (
            <li key={r.userId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-ink-600">
                  {r.status && r.checkedAt
                    ? `${r.method === 'self' ? '본인 출석 코드' : '담당자 체크'} · ${formatDateTime(r.checkedAt)}`
                    : '미체크'}
                  {r.note && ` · ${r.note}`}
                </p>
              </div>
              <AttendanceStatusPicker
                label={`${r.name} 출석 상태`}
                value={r.status}
                onChange={(status) => mark.mutate([{ userId: r.userId, status }])}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SessionDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const session = useQuery({
    queryKey: ['attendance', 'session', id],
    queryFn: () => api.attendance.get(id),
  });
  const update = (s: AttendanceSession) => qc.setQueryData(['attendance', 'session', id], s);
  const remove = useMutation({
    mutationFn: () => api.attendance.remove(id),
    onSuccess: () => {
      const s = session.data;
      void qc.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('출석부를 삭제했습니다.');
      router.push(s ? listHref(s) : '/admin/attendance');
    },
    onError: (e) => {
      setConfirm(false);
      toast.error(errorMessage(e));
    },
  });

  return (
    <QueryState query={session} notFound="출석부를 찾을 수 없습니다">
      {(s) => {
        const c = sessionCounts(s);
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-ink-600">
                  {ATTENDANCE_TARGET_LABEL[s.targetType]} · {s.targetName}
                </p>
                <p className="text-xl font-bold">
                  {formatPickerDate(s.date)} {s.title}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 text-sm tabular-nums">
                  {(['present', 'late', 'absent', 'excused'] as const).map((k) => (
                    <span key={k}>
                      {ATTENDANCE_STATUS[k].text} <strong>{c[k]}</strong>
                    </span>
                  ))}
                  <span>
                    미체크 <strong>{c.unchecked}</strong>
                  </span>
                </p>
              </div>
              <Button
                variant="tertiary"
                onClick={() => setConfirm(true)}
                className="self-start text-danger-700"
              >
                출석부 삭제
              </Button>
            </div>
            <CheckInPanel session={s} onChange={update} />
            <Roster session={s} onChange={update} />
            <ConfirmDialog
              open={confirm}
              title="출석부를 삭제할까요?"
              description="이 회차의 출석 기록이 모두 지워지고 통계에서도 빠집니다."
              confirmLabel="삭제"
              destructive
              loading={remove.isPending}
              onClose={() => setConfirm(false)}
              onConfirm={() => remove.mutate()}
            />
          </div>
        );
      }}
    </QueryState>
  );
}

export default function AdminAttendanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AdminPage
      title="출석부"
      permission="attendance.manage"
      breadcrumbs={[{ label: '출석', href: '/admin/attendance' }, { label: '출석부' }]}
    >
      <SessionDetail id={id} />
    </AdminPage>
  );
}
