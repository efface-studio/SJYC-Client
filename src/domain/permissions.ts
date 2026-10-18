import type { Role, User } from './types';

/**
 * RBAC 설계 초안. 프론트엔드 권한 검사는 화면 표시 용도일 뿐이며,
 * 모든 보호 API는 서버에서 같은 규칙으로 다시 검증해야 한다.
 */
export const PERMISSIONS = [
  'admin.access',
  'notice.write',
  'program.write',
  'application.decide',
  'member.read',
  'member.manage',
  'club.manage',
  'space.manage',
  'inquiry.answer',
  'policy.manage',
  'audit.read',
  /** 개발자 도구(환경·요청 로그·캐시·mock 데이터) — 개발자만 */
  'developer.access',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABEL: Record<Permission, string> = {
  'admin.access': '관리자 화면 접근',
  'notice.write': '공지 작성·수정',
  'program.write': '프로그램 등록·수정',
  'application.decide': '프로그램 신청 승인·반려',
  'member.read': '회원 조회',
  'member.manage': '회원 역할·상태 변경',
  'club.manage': '동아리 관리',
  'space.manage': '공간 예약 관리',
  'inquiry.answer': '문의 답변·FAQ',
  'policy.manage': '정책 문서 관리',
  'audit.read': '감사 로그 조회',
  'developer.access': '개발자 도구',
};

const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  member: [],
  staff: [
    'admin.access',
    'notice.write',
    'program.write',
    'application.decide',
    'member.read',
    'club.manage',
    'space.manage',
    'inquiry.answer',
  ],
  admin: PERMISSIONS.filter((p) => p !== 'developer.access'),
  /** 최상위 역할 — 모든 권한 */
  developer: PERMISSIONS,
};

export function can(
  user: Pick<User, 'roles' | 'status'> | null | undefined,
  permission: Permission,
): boolean {
  if (!user || user.status !== 'active') return false;
  return user.roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export const ROLE_LABEL: Record<Role, string> = {
  member: '회원',
  staff: '센터 직원',
  admin: '최고 관리자',
  developer: '개발자',
};

/** 높은 역할부터 */
export const ROLE_ORDER: readonly Role[] = ['developer', 'admin', 'staff', 'member'];

/** 화면에 대표로 보여줄 가장 높은 역할 */
export function primaryRole(user: Pick<User, 'roles'>): Role {
  return ROLE_ORDER.find((r) => user.roles.includes(r)) ?? 'member';
}

type Actor = Pick<User, 'roles' | 'status'> | null | undefined;

/** 이 사용자가 다른 회원에게 부여할 수 있는 역할 — 개발자 역할은 개발자만 부여한다 */
export function assignableRoles(actor: Actor): Role[] {
  if (!can(actor, 'member.manage')) return [];
  return ROLE_ORDER.filter((r) => r !== 'developer' || can(actor, 'developer.access')).reverse();
}

/** 대상 회원의 역할·상태를 바꿀 수 있는지 — 개발자 계정은 개발자만 바꾼다 */
export function canManageUser(actor: Actor, target: Pick<User, 'roles'>): boolean {
  if (!can(actor, 'member.manage')) return false;
  return !target.roles.includes('developer') || can(actor, 'developer.access');
}
