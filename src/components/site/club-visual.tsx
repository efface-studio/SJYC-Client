'use client';

import { Clapperboard, Megaphone, UsersRound } from 'lucide-react';
import { useState } from 'react';
import type { MediaPhoto } from '@/domain/types';

export function ClubVisual({
  photo,
  field,
  decorative = false,
}: {
  photo?: MediaPhoto;
  field: string;
  decorative?: boolean;
}) {
  const Icon = field.includes('미디어') ? Clapperboard : field.includes('자치') ? Megaphone : UsersRound;
  const [failedUrl, setFailedUrl] = useState<string>();
  return (
    <div className="club-visual">
      {photo && photo.url !== failedUrl ? (
        <img
          src={photo.url}
          alt={decorative ? '' : photo.caption}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(photo.url)}
        />
      ) : (
        <Icon aria-hidden className="club-visual-mark" strokeWidth={1.35} />
      )}
    </div>
  );
}
