'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api, errorMessage } from '@/api';
import { AdminPage } from '@/components/admin/admin-page';
import { QueryState } from '@/components/admin/query-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { SelectField } from '@/components/ui/field';
import { Callout } from '@/components/ui/states';
import { useToast } from '@/components/ui/toast';
import { OAUTH_PROVIDER_LABEL, USER_STATUS } from '@/domain/labels';
import { assignableRoles, can, canManageUser, primaryRole, ROLE_LABEL } from '@/domain/permissions';
import type { Role, User, UserStatus } from '@/domain/types';
import { useSession } from '@/features/auth/session';
import { formatDate } from '@/lib/format';

const EDITABLE_STATUS: UserStatus[] = ['active', 'suspended'];

interface Patch {
  roles: Role[];
  status: UserStatus;
}

function describe(u: User, p: Patch): string[] {
  const changes: string[] = [];
  if (p.roles[0] !== primaryRole(u))
    changes.push(`역할: ${ROLE_LABEL[primaryRole(u)]} → ${ROLE_LABEL[p.roles[0] ?? 'member']}`);
  if (p.status !== u.status)
    changes.push(`상태: ${USER_STATUS[u.status].text} → ${USER_STATUS[p.status].text}`);
  return changes;
}

/** 역할·상태 변경 — 최고 관리자(member.manage)만, 자기 자신은 불가. 개발자 역할·계정은 개발자만 (서버도 거부) */
function ManageForm({ user, roles }: { user: User; roles: Role[] }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [pending, setPending] = useState<Patch | null>(null);
  const update = useMutation({
    mutationFn: (p: Patch) => api.admin.members.update(user.id, p),
    onSuccess: (u) => {
      qc.setQueryData(['admin', 'member', user.id], u);
      void qc.invalidateQueries({ queryKey: ['admin', 'members'] });
      setPending(null);
      toast.success('회원 정보를 변경했습니다.');
    },
    onError: (e) => {
      setPending(null);
      toast.error(errorMessage(e));
    },
  });
  const changes = pending ? describe(user, pending) : [];

  return (
    <form
      noValidate
      className="mt-8 max-w-2xl border-t border-line pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const role = roles.find((r) => r === fd.get('role')) ?? primaryRole(user);
        const status = EDITABLE_STATUS.find((s) => s === fd.get('status')) ?? user.status;
        const next = { roles: [role], status };
        if (describe(user, next).length === 0) {
          toast.error('변경된 내용이 없습니다.');
          return;
        }
        setPending(next);
      }}
    >
      <h2 className="mb-4 text-base font-bold">권한·상태 변경</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="역할"
          name="role"
          defaultValue={primaryRole(user)}
          options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
        />
        <SelectField
          label="상태"
          name="status"
          defaultValue={user.status}
          disabled={user.status === 'withdrawn'}
          options={(user.status === 'withdrawn' ? (['withdrawn'] as UserStatus[]) : EDITABLE_STATUS).map(
            (s) => ({ value: s, label: USER_STATUS[s].text }),
          )}
        />
      </div>
      <Button type="submit" className="mt-5" disabled={update.isPending}>
        변경 내용 확인
      </Button>
      <ConfirmDialog
        open={pending !== null}
        title="회원 정보를 변경할까요?"
        description={
          <>
            <p>
              <strong>{user.name}</strong>({user.email}) 회원의 정보를 아래와 같이 변경합니다. 변경 내역은
              감사 로그에 남습니다.
            </p>
            <ul className="mt-2 list-disc pl-5">
              {changes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        }
        confirmLabel="변경"
        destructive={pending?.status === 'suspended'}
        loading={update.isPending}
        onConfirm={() => pending && update.mutate(pending)}
        onClose={() => setPending(null)}
      />
    </form>
  );
}

function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const member = useQuery({ queryKey: ['admin', 'member', id], queryFn: () => api.admin.members.get(id) });
  const me = session?.user;

  return (
    <QueryState query={member} notFound="회원을 찾을 수 없습니다">
      {(u) => (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold">{u.name}</h2>
            <Badge tone={USER_STATUS[u.status].tone}>{USER_STATUS[u.status].text}</Badge>
          </div>
          <dl className="console-surface mt-4 grid max-w-2xl grid-cols-[96px_1fr] gap-y-2 px-4 py-4 text-[15px]">
            <dt className="text-ink-600">이메일</dt>
            <dd className="break-all">
              {u.email} {!u.emailVerified && <span className="text-sm text-warning-800">(미인증)</span>}
            </dd>
            <dt className="text-ink-600">역할</dt>
            <dd>{u.roles.map((r) => ROLE_LABEL[r]).join(', ')}</dd>
            <dt className="text-ink-600">소셜 연결</dt>
            <dd>
              {u.providers.length ? u.providers.map((p) => OAUTH_PROVIDER_LABEL[p]).join(', ') : '없음'}
            </dd>
            <dt className="text-ink-600">가입일</dt>
            <dd className="tabular-nums">{formatDate(u.createdAt)}</dd>
          </dl>
          <p className="mt-2 text-sm text-ink-600">
            연락처 등 그 밖의 개인정보는 업무상 필요한 화면(신청 상세 등)에서만 확인할 수 있습니다.
          </p>

          {can(me, 'member.manage') &&
            (me?.id === u.id ? (
              <Callout tone="info" className="mt-8 max-w-2xl">
                자기 자신의 역할·상태는 변경할 수 없습니다. 다른 최고 관리자에게 요청해 주세요.
              </Callout>
            ) : !canManageUser(me, u) ? (
              <Callout tone="info" className="mt-8 max-w-2xl">
                개발자 계정의 역할·상태는 개발자만 변경할 수 있습니다.
              </Callout>
            ) : (
              <ManageForm key={`${u.status}-${u.roles.join()}`} user={u} roles={assignableRoles(me)} />
            ))}
        </>
      )}
    </QueryState>
  );
}

export default function AdminMemberDetailPage() {
  return (
    <AdminPage
      title="회원 상세"
      permission="member.read"
      breadcrumbs={[{ label: '회원', href: '/admin/members' }, { label: '상세' }]}
    >
      <MemberDetail />
    </AdminPage>
  );
}
