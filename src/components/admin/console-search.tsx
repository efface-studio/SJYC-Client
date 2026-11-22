'use client';

import { useQueries } from '@tanstack/react-query';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/api';
import { Modal } from '@/components/ui/dialog';
import { APPLICATION_STATUS, INQUIRY_STATUS, RESERVATION_STATUS } from '@/domain/labels';
import type { Permission } from '@/domain/permissions';
import type { User } from '@/domain/types';
import { allows } from '@/features/auth/guards';

interface Match {
  href: string;
  label: string;
  detail?: string;
}
interface Source {
  name: string;
  permission: Permission;
  find: (q: string) => Promise<Match[]>;
}
const page = (q: string) => ({ q, page: 1, pageSize: 6 });
const detail = (area: string, id: string) => '/admin/' + area + '/' + encodeURIComponent(id);

const sources: Source[] = [
  {
    name: '프로그램',
    permission: 'program.write',
    async find(q) {
      const data = await api.admin.programs.list(page(q));
      return data.items.map((p) => ({ href: detail('programs', p.id), label: p.title, detail: p.target }));
    },
  },
  {
    name: '공지사항',
    permission: 'notice.write',
    async find(q) {
      const data = await api.admin.notices.list(page(q));
      return data.items.map((n) => ({ href: detail('notices', n.id), label: n.title }));
    },
  },
  {
    name: '프로그램 신청',
    permission: 'application.decide',
    async find(q) {
      const data = await api.admin.applications.list(page(q));
      return data.items.map((a) => ({
        href: detail('applications', a.id),
        label: a.programTitle,
        detail: [a.applicantName, a.receiptNo, APPLICATION_STATUS[a.status].text].filter(Boolean).join(' · '),
      }));
    },
  },
  {
    name: '공간 예약',
    permission: 'space.manage',
    async find(q) {
      const data = await api.admin.spaces.reservations(page(q));
      return data.items.map((r) => ({
        href:
          '/admin/spaces?' +
          new URLSearchParams({ spaceId: r.spaceId, date: r.date, q: r.applicantName }).toString(),
        label: r.spaceName + ' · ' + r.applicantName,
        detail: r.date + ' ' + r.startTime + '–' + r.endTime + ' · ' + RESERVATION_STATUS[r.status].text,
      }));
    },
  },
  {
    name: '문의',
    permission: 'inquiry.answer',
    async find(q) {
      const data = await api.admin.inquiries.list(page(q));
      return data.items.map((i) => ({
        href: detail('inquiries', i.id),
        label: i.title,
        detail: INQUIRY_STATUS[i.status].text,
      }));
    },
  },
  {
    name: '회원',
    permission: 'member.read',
    async find(q) {
      const data = await api.admin.members.list(page(q));
      return data.items.map((m) => ({ href: detail('members', m.id), label: m.name, detail: m.email }));
    },
  },
];

function Results({ title, items, close }: { title: string; items: Match[]; close: () => void }) {
  if (!items.length) return null;
  return (
    <section className="console-search-group">
      <h3>{title}</h3>
      <ul>
        {items.map((item, i) => (
          <li key={item.href + i}>
            <Link href={item.href} onClick={close}>
              <span>
                <strong>{item.label}</strong>
                {item.detail && <small>{item.detail}</small>}
              </span>
              <ArrowRight size={15} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SearchBody({ user, menus, close }: { user: User; menus: Match[]; close: () => void }) {
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const text = input.trim();
  useEffect(() => {
    const frame = requestAnimationFrame(() => field.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const id = window.setTimeout(() => setTerm(text), 260);
    return () => window.clearTimeout(id);
  }, [text]);
  const visible = sources.filter((s) => allows(user, s.permission));
  const ready = term.length > 0 && term === text;
  const groups = useQueries({
    queries: visible.map((s) => ({
      queryKey: ['admin', 'console-search', user.id, s.name, term],
      queryFn: () => s.find(term),
      enabled: ready,
      staleTime: 15000,
      gcTime: 0,
      retry: false,
    })),
  });
  const menuMatches = menus.filter((m) => m.label.toLocaleLowerCase().includes(text.toLocaleLowerCase()));
  const waiting = text.length > 0 && (!ready || groups.some((g) => g.isLoading));
  const failed = ready && groups.some((g) => g.isError);
  const count = menuMatches.length + (ready ? groups.reduce((n, g) => n + (g.data?.length ?? 0), 0) : 0);
  return (
    <>
      <label className="console-search-field">
        <Search aria-hidden size={21} />
        <span className="sr-only">관리자 검색어</span>
        <input
          ref={field}
          type="search"
          maxLength={100}
          autoComplete="off"
          placeholder="메뉴, 프로그램, 신청자 검색"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </label>
      <p role="status" className="console-search-status">
        {waiting
          ? '검색 중…'
          : text
            ? count
              ? '검색 결과 ' + count + '건 표시'
              : failed
                ? '일부 검색을 완료하지 못했습니다.'
                : '검색 결과가 없습니다.'
            : '관리자 메뉴 바로가기'}
      </p>
      <Results title="메뉴" items={menuMatches} close={close} />
      {ready &&
        visible.map((source, i) => {
          const group = groups[i];
          if (!group) return null;
          return (
            <div key={source.name}>
              <Results title={source.name} items={group.data ?? []} close={close} />
              {group.isError && (
                <p className="console-search-status">
                  {source.name} 조회 실패{' '}
                  <button type="button" onClick={() => void group.refetch()}>
                    다시 시도
                  </button>
                </p>
              )}
            </div>
          );
        })}
    </>
  );
}

export function ConsoleSearch({ user, menus }: { user: User; menus: Match[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'k' &&
        !e.isComposing &&
        !document.querySelector('dialog[open]')
      ) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  return (
    <>
      <button
        type="button"
        className="console-search-trigger"
        aria-label="관리자 통합검색 열기"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <Search size={18} aria-hidden />
        <span>통합검색</span>
      </button>
      <Modal
        title="관리자 통합검색"
        open={open}
        onClose={() => setOpen(false)}
        className="console-search-dialog"
      >
        <SearchBody user={user} menus={menus} close={() => setOpen(false)} />
      </Modal>
    </>
  );
}
