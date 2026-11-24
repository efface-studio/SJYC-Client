import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import type { ReactNode } from 'react';
import './directories.css';

const directories = {
  programs: {
    title: '프로그램',
    lead: '관심 있는 활동을 골라 신청해 보세요.',
    photo: '/media/program-studio.webp',
    alt: '센터에서 프로그램에 참여하는 청소년',
    action: '프로그램 찾기',
  },
  spaces: {
    title: '공간 예약',
    lead: '연습하는 날도, 함께 모이는 날도. 활동에 맞는 센터 공간을 찾아보세요.',
    photo: '/media/spaces/gym.webp',
    alt: '중구청소년센터 실내 체육관',
    action: '층별 공간 보기',
  },
  clubs: {
    title: '동아리',
    lead: '나와 관심사가 비슷한 친구들과 함께 활동해요.',
    photo: '/media/clubs-studio.webp',
    alt: '센터에서 함께 이야기하는 동아리 참가자들',
    action: '동아리 둘러보기',
  },
  notices: {
    title: '공지사항',
    lead: '센터 이용 전 확인할 운영 소식과 프로그램 안내입니다.',
    photo: '/media/center-exterior.webp',
    alt: '중구청소년센터 정문',
    action: '공지 찾아보기',
  },
} as const;
export type Directory = keyof typeof directories;
export function DirectoryIntro({ kind, children }: { kind: Directory; children?: ReactNode }) {
  const d = directories[kind];
  return (
    <header className={'directory-intro directory-' + kind}>
      <div className="directory-intro-inner">
        <div>
          <h1>{d.title}</h1>
          <p>{d.lead}</p>
          <a href="#directory-content" className="directory-action">
            {d.action}
            <ArrowDown aria-hidden size={17} />
          </a>
        </div>
        <Image
          priority
          src={d.photo}
          alt={d.alt}
          width={820}
          height={480}
          sizes="(min-width: 800px) 46vw, 92vw"
        />
      </div>
      {children}
    </header>
  );
}
