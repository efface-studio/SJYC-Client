'use client';

import { useQueries } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  CornerDownLeft,
  Folder,
  Megaphone,
  MessageSquare,
  Search,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
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
  icon?: LucideIcon;
}
interface Source {
  name: string;
  permission: Permission;
  icon: LucideIcon;
  find: (q: string) => Promise<Match[]>;
}
const page = (q: string) => ({ q, page: 1, pageSize: 6 });
const detail = (area: string, id: string) => '/admin/' + area + '/' + encodeURIComponent(id);

const sources: Source[] = [
  {
    name: '프로그램',
    icon: CalendarDays,
    permission: 'program.write',
    async find(q) {
      const data = await api.admin.programs.list(page(q));
      return data.items.map((p) => ({ href: detail('programs', p.id), label: p.title, detail: p.target }));
    },
  },
  {
    name: '공지사항',
    icon: Megaphone,
    permission: 'notice.write',
    async find(q) {
      const data = await api.admin.notices.list(page(q));
      return data.items.map((n) => ({ href: detail('notices', n.id), label: n.title }));
    },
  },
  {
    name: '프로그램 신청',
    icon: ClipboardList,
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
    icon: CalendarCheck,
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
    icon: MessageSquare,
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
    icon: UserRound,
    permission: 'member.read',
    async find(q) {
      const data = await api.admin.members.list(page(q));
      return data.items.map((m) => ({ href: detail('members', m.id), label: m.name, detail: m.email }));
    },
  },
];

function SearchBody({ user, menus, close }: { user: User; menus: Match[]; close: () => void }) {
  const [input, setInput] = useState('');
  const [term, setTerm] = useState('');
  const field = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const listId = useId();
  const [selection, setSelection] = useState('');
  const currentRow = useRef<HTMLAnchorElement>(null);
  const keyboardMove = useRef(false);
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
  const menuMatches = text
    ? menus.filter((m) => m.label.toLocaleLowerCase().includes(text.toLocaleLowerCase()))
    : menus.slice(0, 5);
  const buckets = [
    { title: text ? '메뉴' : '바로가기', items: menuMatches, icon: Folder },
    ...(ready
      ? visible.map((source, i) => ({ title: source.name, items: groups[i]?.data ?? [], icon: source.icon }))
      : []),
  ].filter((group) => group.items.length);
  const rows = buckets.flatMap((group) =>
    group.items.map((item, i) => ({
      ...item,
      key: group.title + '-' + item.href + '-' + i,
      group: group.title,
      icon: item.icon ?? group.icon,
    })),
  );
  const activeIndex = Math.max(
    0,
    rows.findIndex((row) => row.key === selection),
  );
  const active = rows[activeIndex];
  const waiting = !!text && (!ready || groups.some((g) => g.isLoading));
  const failed = ready && groups.some((g) => g.isError);
  useEffect(() => {
    if (keyboardMove.current) {
      currentRow.current?.scrollIntoView({ block: 'nearest' });
      keyboardMove.current = false;
    }
  }, [active?.key]);
  return (
    <>
      <div className="spotlight-input">
        <Search size={25} aria-hidden />
        <input
          ref={field}
          type="search"
          role="combobox"
          aria-label="관리자 검색어"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={active ? listId + '-' + activeIndex : undefined}
          autoComplete="off"
          maxLength={100}
          placeholder="무엇을 찾으세요?"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setSelection('');
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === 'Escape') {
              e.preventDefault();
              close();
              return;
            }
            if (!rows.length) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              keyboardMove.current = true;
              setSelection(
                rows[(activeIndex + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length]!.key,
              );
            } else if (e.key === 'Enter' && active) {
              e.preventDefault();
              close();
              router.push(active.href);
            }
          }}
        />
        <button className="spotlight-close" type="button" aria-label="닫기" onClick={close}>
          <kbd>esc</kbd>
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="spotlight-scroll">
        <p
          className={text && !rows.length ? 'spotlight-message' : 'sr-only'}
          role="status"
          aria-live="polite"
        >
          {waiting
            ? '검색 중…'
            : text
              ? rows.length
                ? '검색 결과 ' + rows.length + '건'
                : failed
                  ? '일부 검색을 완료하지 못했습니다.'
                  : '검색 결과가 없습니다.'
              : '관리자 메뉴 바로가기'}
        </p>
        <div id={listId} role="listbox" aria-label="검색 결과">
          {buckets.map((group) => (
            <div key={group.title} role="group" aria-label={group.title} className="spotlight-group">
              <h3 aria-hidden>{group.title}</h3>
              {rows.map(
                (row, i) =>
                  row.group === group.title && (
                    <Link
                      key={row.key}
                      id={listId + '-' + i}
                      ref={i === activeIndex ? currentRow : undefined}
                      href={row.href}
                      role="option"
                      aria-selected={i === activeIndex}
                      tabIndex={-1}
                      onPointerMove={(e) => {
                        if (e.pointerType === 'mouse') setSelection(row.key);
                      }}
                      onClick={close}
                      className="spotlight-row"
                    >
                      <row.icon size={17} aria-hidden />
                      <span>
                        <strong>{row.label}</strong>
                        {row.detail && <small>{row.detail}</small>}
                      </span>
                      <CornerDownLeft size={15} className="spotlight-return" aria-hidden />
                    </Link>
                  ),
              )}
            </div>
          ))}
        </div>
        {ready &&
          visible.map(
            (source, i) =>
              groups[i]?.isError && (
                <p className="spotlight-error" key={source.name}>
                  {source.name} 조회 실패{' '}
                  <button type="button" onClick={() => void groups[i]?.refetch()}>
                    다시 시도
                  </button>
                </p>
              ),
          )}
      </div>
      <footer className="spotlight-hints">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> 선택
        </span>
        <span>
          <kbd>↵</kbd> 열기
        </span>
      </footer>
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
        variant="command"
        className="spotlight-dialog"
        bodyClassName="spotlight-body"
      >
        <SearchBody user={user} menus={menus} close={() => setOpen(false)} />
      </Modal>
    </>
  );
}
