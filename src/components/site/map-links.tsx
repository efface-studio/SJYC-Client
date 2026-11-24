import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

export function MapLinks({ address }: { address: string }) {
  const destination = encodeURIComponent(address.trim());
  return (
    <div className="center-map-links" role="group" aria-label="지도에서 센터 위치 보기">
      {[
        { label: '네이버지도', icon: 'naver-map', href: 'https://map.naver.com/p/search/' + destination },
        { label: '카카오맵', icon: 'kakao-map', href: 'https://map.kakao.com/link/search/' + destination },
      ].map(({ label, icon, href }) => (
        <a key={icon} href={href} target="_blank" rel="noopener noreferrer">
          <Image src={'/brand/' + icon + '.png'} width={24} height={24} alt="" />
          {label}
          <ArrowUpRight size={14} aria-hidden />
          <span className="sr-only">에서 센터 위치 보기 (새 창)</span>
        </a>
      ))}
    </div>
  );
}
