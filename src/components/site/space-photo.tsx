import Image from 'next/image';
import { getSpacePhoto } from '@/config/space-photos';
import type { Space } from '@/domain/types';

export function SpacePhoto({ space, thumbnail = false }: { space: Space; thumbnail?: boolean }) {
  const photo = getSpacePhoto(space);
  if (!photo) return null;

  return (
    <figure className={thumbnail ? 'space-thumbnail' : 'space-detail-photo'}>
      <Image
        src={`/media/spaces/${photo.key}.webp`}
        alt={thumbnail ? '' : photo.alt}
        fill
        sizes={
          thumbnail
            ? '(max-width: 639px) 92vw, (max-width: 900px) 44vw, 360px'
            : '(max-width: 719px) 94vw, 672px'
        }
      />
      {photo.key === 'media' && <figcaption>공간 예시 이미지</figcaption>}
    </figure>
  );
}
