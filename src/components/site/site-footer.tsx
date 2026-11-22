import Image from 'next/image';
import Link from 'next/link';
import { siFacebook, siInstagram, siNaver, siYoutube, type SimpleIcon } from 'simple-icons';
import { CENTER, OFFICIAL_CHANNELS } from '@/config/center';
import { POLICY_NAV } from '@/domain/labels';

/** 공식 채널 브랜드 로고 (simple-icons, CC0 — 각 브랜드 원본 경로) */
const CHANNEL_ICON: Record<(typeof OFFICIAL_CHANNELS)[number]['key'], SimpleIcon> = {
  youtube: siYoutube,
  instagram: siInstagram,
  facebook: siFacebook,
  blog: siNaver,
};

function BrandIcon({ icon }: { icon: SimpleIcon }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 shrink-0" fill={`#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  );
}

interface FooterLink {
  href: string;
  label: string;
  strong?: boolean;
  external?: boolean;
  icon?: SimpleIcon;
}

const GROUPS: { title: string; links: FooterLink[] }[] = [
  {
    title: '서비스',
    links: [
      { href: '/programs', label: '프로그램 신청' },
      { href: '/spaces', label: '공간 예약' },
      { href: '/clubs', label: '동아리' },
      { href: '/notices', label: '공지사항' },
      { href: '/gallery', label: '센터 소식·갤러리' },
    ],
  },
  {
    title: '센터',
    links: [
      { href: '/about', label: '센터 소개' },
      { href: '/kdream', label: '꿈드림' },
      { href: '/about#location', label: '오시는 길' },
      { href: '/qna', label: '질문·문의' },
    ],
  },
  {
    title: '정책·약관',
    links: POLICY_NAV.map((p) => ({
      href: `/policies/${p.key}`,
      label: p.title,
      strong: p.key === 'privacy',
    })),
  },
  {
    title: '공식 채널',
    links: OFFICIAL_CHANNELS.map((c) => ({
      href: c.url,
      label: c.label,
      external: true,
      icon: CHANNEL_ICON[c.key],
    })),
  },
];

/** 기관 정보 한 줄 — 데스크톱은 구분자로 잇고, 모바일은 항목마다 줄을 나눈다 */
function InfoLine({ items }: { items: string[] }) {
  return (
    <p>
      {items.map((item, i) => (
        <span key={item} className="block md:inline">
          {item}
          {i < items.length - 1 && (
            <span aria-hidden className="mx-2 hidden text-line-strong md:inline">
              |
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

function CenterContactDetails() {
  return (
    <div className="space-y-1">
      <InfoLine items={[`(${CENTER.postalCode}) ${CENTER.address}`, `관장 ${CENTER.director}`]} />
      <InfoLine
        items={[`사업자등록번호 ${CENTER.businessNumber}`, `통신판매업신고 ${CENTER.mailOrderNumber}`]}
      />
      <InfoLine items={[`Tel ${CENTER.telDisplay}`, `Fax ${CENTER.fax}`]} />
    </div>
  );
}

/**
 * 푸터 — 링크 묶음 + 작은 회색 기관 정보. 표·라벨 격자 없이 여백으로만 구분한다.
 * 기관 정보는 공식 홈페이지 기준이며 src/config/center.ts 한 곳에서 관리한다.
 */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  if (compact)
    return (
      <footer className="border-t border-line bg-white px-4 py-4 text-xs text-ink-600 md:px-8">
        <div className="mx-auto flex max-w-[1700px] flex-wrap items-start justify-between gap-3">
          <details>
            <summary className="cursor-pointer py-1 font-semibold">{CENTER.formalName} 기관 정보</summary>
            <address className="mt-2 space-y-1 not-italic">
              <CenterContactDetails />
              <p>
                Copyright © {CENTER.copyrightSince} {CENTER.englishName}. All rights reserved.
              </p>
            </address>
          </details>
          <a
            href="https://v2.efface.dev/en"
            target="_blank"
            rel="noopener noreferrer"
            className="py-1 hover:underline"
          >
            Made by efface<span className="sr-only">(새 창)</span>
          </a>
        </div>
      </footer>
    );
  return (
    <footer className="public-footer bg-surface-muted text-[13px] leading-relaxed text-ink-600">
      <div className="container-page py-10 md:py-14">
        <div className="mb-8">
          <p className="text-[13px] font-semibold text-ink-700">대표전화</p>
          <a
            href={`tel:${CENTER.tel}`}
            className="mt-0.5 inline-block text-[22px] font-bold tracking-tight text-ink-900 tabular-nums"
          >
            {CENTER.telDisplay}
          </a>
          <p className="mt-1">
            평일 06:00–22:00 · 토 06:00–21:00 · 일 06:00–18:00 (매월 둘째 주 일요일 휴관)
          </p>
        </div>

        <nav aria-label="푸터 메뉴" className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h2 className="mb-4 text-sm font-bold text-ink-900">{g.title}</h2>
              <ul className="space-y-2">
                {g.links.map((l) => (
                  <li key={l.href}>
                    {l.external ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 hover:text-ink-900"
                      >
                        {l.icon && <BrandIcon icon={l.icon} />}
                        {l.label}
                        <span className="sr-only">(새 창)</span>
                      </a>
                    ) : (
                      <Link
                        href={l.href}
                        className={
                          l.strong ? 'font-semibold text-ink-900 hover:underline' : 'hover:text-ink-900'
                        }
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <address className="mt-10 border-t border-line pt-8 not-italic">
          <Image
            src="/brand/logo-on-dark.png"
            unoptimized
            alt={CENTER.formalName}
            width={300}
            height={50}
            className="footer-logo mb-4"
          />
          <CenterContactDetails />
        </address>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Copyright © {CENTER.copyrightSince} {CENTER.englishName}. All rights reserved.
          </p>
          <a
            href="https://v2.efface.dev/en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-600 hover:text-ink-900"
          >
            Made by <span className="font-semibold">efface</span>
            <span className="sr-only">(새 창)</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
