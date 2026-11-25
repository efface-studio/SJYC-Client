'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { memberActionLabels, type MemberCommand } from '@/domain/member-actions';
import { useLogout } from '@/features/auth/session';
import type { User } from '@/domain/types';
import { SelectField, TextField } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

type Command =
  | MemberCommand
  | { action: 'leave-club'; clubId: string; title: string }
  | { action: 'cancel-program'; applicationId: string; title: string };

const actionLabels = {
  ...memberActionLabels,
  'leave-club': '동아리 소속 해제',
  'cancel-program': '프로그램 참가 취소',
};

export function MemberCommands({ user, self = false }: { user: User; self?: boolean }) {
  const logout = useLogout();
  const toast = useToast();
  const [pending, run] = useState<Command | null>(null);
  const completed = (label: string) => {
    run(null);
    toast.success(label + ' 완료');
  };
  const failed = (message: string) => {
    run(null);
    toast.error(message);
  };
  const qc = useQueryClient();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [club, setClub] = useState('');
  const [program, setProgram] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const options = useQuery({
    queryKey: ['admin', 'member-options', user.id, self],
    queryFn: async () => {
      const [choices, joined, applications] = await Promise.all([
        api.admin.members.activityOptions(user.id),
        self ? api.me.clubs() : [],
        self ? api.me.applications() : [],
      ]);
      return { ...choices, joined, cancellable: applications.filter((a) => a.cancellable) };
    },
    enabled: user.status === 'active',
  });
  const available = (items: { id: string; title: string }[] = []) =>
    items.map((i) => ({ value: i.id, label: i.title }));
  const act = useMutation({
    mutationFn: async (command: Command): Promise<{ resetUrl?: string }> => {
      if (command.action === 'leave-club') {
        await api.manage.removeMember(command.clubId, user.id);
        return {};
      }
      if (command.action === 'cancel-program') {
        await api.me.cancelApplication(command.applicationId);
        return {};
      }
      return api.admin.members.act(user.id, command);
    },
    onMutate: () => setResetUrl(''),
    onSuccess: (result, command) => {
      if (self && command.action === 'sign-out') {
        logout.mutate();
        return;
      }
      setResetUrl(result.resetUrl ?? '');
      if (command.action === 'join-club') setClub('');
      if (command.action === 'enroll') setProgram('');
      void qc.invalidateQueries({ queryKey: ['admin'] });
      completed(actionLabels[command.action]);
    },
    onError: (error) => failed(errorMessage(error)),
  });
  const busy = act.isPending || logout.isPending;
  const active = user.status === 'active';
  const descriptions = (command: Command) => {
    if (command.action === 'leave-club') return command.title + '에서 내 소속을 해제합니다.';
    if (command.action === 'cancel-program') return command.title + ' 참가를 취소합니다.';
    if (self && command.action === 'sign-out') return '현재 기기를 포함한 모든 기기에서 로그아웃합니다.';
    if (command.action === 'withdraw')
      return (
        user.name + ' 회원은 즉시 로그아웃되며 다시 로그인할 수 없습니다. 신청 및 처리 이력은 보존됩니다.'
      );
    if (command.action === 'reset-password')
      return user.name + ' 회원이 30분 안에 한 번 사용할 수 있는 비밀번호 재설정 링크를 발급합니다.';
    if (command.action === 'join-club')
      return (
        user.name +
        ' 회원을 ' +
        options.data?.clubs.find((x) => x.id === command.clubId)?.title +
        '에 추가합니다.'
      );
    if (command.action === 'enroll')
      return (
        user.name +
        ' 회원의 ' +
        options.data?.programs.find((x) => x.id === command.programId)?.title +
        ' 참가를 확정합니다.'
      );
    return user.name + ' 회원에게 적용합니다.';
  };
  return (
    <section className="mt-8 grid max-w-2xl gap-6 border-t border-line pt-5">
      {!self && (
        <div className="grid gap-3">
          <h2 className="text-base font-bold">회원 정보</h2>
          <TextField label="이름" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField
            label="휴대전화 번호"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={busy || !name.trim() || !phone || (user.name === name && user.phone === phone)}
            onClick={() => run({ action: 'profile', name, phone })}
          >
            정보 저장
          </Button>
        </div>
      )}
      {active && (
        <div className="grid gap-3">
          <h2 className="text-base font-bold">활동 등록</h2>
          {options.isPending ? (
            <p>활동을 불러오는 중입니다.</p>
          ) : options.isError ? (
            <Button variant="secondary" onClick={() => void options.refetch()}>
              활동 다시 불러오기
            </Button>
          ) : (
            <>
              {options.data.clubs.length ? (
                <>
                  <SelectField
                    label="동아리"
                    value={club}
                    onValueChange={setClub}
                    options={available(options.data.clubs)}
                  />
                  <Button
                    variant="secondary"
                    disabled={!club || busy}
                    onClick={() => run({ action: 'join-club', clubId: club })}
                  >
                    동아리 추가
                  </Button>
                </>
              ) : (
                <p>추가할 동아리가 없습니다.</p>
              )}
              {options.data.programs.length ? (
                <>
                  <SelectField
                    label="프로그램"
                    value={program}
                    onValueChange={setProgram}
                    options={available(options.data.programs)}
                  />
                  <Button
                    variant="secondary"
                    disabled={!program || busy}
                    onClick={() => run({ action: 'enroll', programId: program })}
                  >
                    프로그램 참가 등록
                  </Button>
                </>
              ) : (
                <p>등록 가능한 프로그램이 없습니다.</p>
              )}
              {options.data.joined.map(({ club: joined }) => (
                <Button
                  key={joined.id}
                  variant="secondary"
                  disabled={busy}
                  onClick={() => run({ action: 'leave-club', clubId: joined.id, title: joined.name })}
                >
                  {joined.name} · 소속 해제
                </Button>
              ))}
              {options.data.cancellable.map((a) => (
                <Button
                  key={a.id}
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    run({ action: 'cancel-program', applicationId: a.id, title: a.programTitle })
                  }
                >
                  {a.programTitle} · 참가 취소
                </Button>
              ))}
            </>
          )}
        </div>
      )}
      <div className="grid gap-3">
        <h2 className="text-base font-bold">계정 관리</h2>
        {active && !self && (
          <Button variant="secondary" disabled={busy} onClick={() => run({ action: 'reset-password' })}>
            비밀번호 재설정 링크 발급
          </Button>
        )}
        {resetUrl && (
          <TextField
            label="회원에게 전달할 일회용 링크"
            value={resetUrl}
            readOnly
            onFocus={(e) => e.target.select()}
          />
        )}
        <Button variant="secondary" disabled={busy} onClick={() => run({ action: 'sign-out' })}>
          모든 기기 로그아웃
        </Button>
        {!self && (
          <Button variant="destructive" disabled={busy} onClick={() => run({ action: 'withdraw' })}>
            계정 삭제
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={!!pending}
        title={pending ? actionLabels[pending.action] : ''}
        description={pending ? descriptions(pending) : ''}
        confirmLabel="확인"
        destructive={pending?.action === 'withdraw'}
        loading={busy}
        onClose={() => run(null)}
        onConfirm={() => {
          if (pending && !busy) act.mutate(pending);
        }}
      />
    </section>
  );
}
