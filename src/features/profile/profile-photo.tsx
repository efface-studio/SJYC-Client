'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { api, errorMessage } from '@/api';

async function thumbnail(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
    throw new Error('12MB 이하의 JPG, PNG 또는 WebP 사진을 선택해 주세요.');
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('사진을 읽을 수 없습니다.');
    const edge = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(
      img,
      (img.naturalWidth - edge) / 2,
      (img.naturalHeight - edge) / 2,
      edge,
      edge,
      0,
      0,
      256,
      256,
    );
    return canvas.toDataURL('image/jpeg', 0.76);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ProfilePhoto({ userId, editable = false }: { userId: string; editable?: boolean }) {
  const key = ['profile-photo', userId];
  const cache = useQueryClient();
  const photo = useQuery({ queryKey: key, queryFn: api.me.profilePhoto });
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState('');
  const save = useMutation({
    mutationFn: async (file: File | null) => api.me.setProfilePhoto(file ? await thumbnail(file) : null),
    onSuccess: (value) => {
      cache.setQueryData(key, value);
      setStatus(value.image ? '사진을 변경했습니다.' : '기본 사진으로 변경했습니다.');
    },
    onError: (err) => setStatus(err instanceof Error ? err.message : errorMessage(err)),
  });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span
        className={
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-ink-600 ' +
          (editable ? 'size-16' : 'size-11')
        }
      >
        {photo.data?.image ? (
          <img src={photo.data.image} alt="내 프로필 사진" width={64} height={64} />
        ) : (
          <UserRound aria-label="기본 프로필 사진" />
        )}
      </span>
      {editable && (
        <>
          <input
            ref={input}
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) {
                setStatus('');
                save.mutate(file);
              }
            }}
          />
          <button
            type="button"
            className="min-h-11 font-semibold"
            disabled={save.isPending}
            onClick={() => input.current?.click()}
          >
            사진 변경
          </button>
          {photo.data?.image && (
            <button
              type="button"
              className="min-h-11 text-sm text-ink-600"
              disabled={save.isPending}
              onClick={() => save.mutate(null)}
            >
              기본 사진으로
            </button>
          )}
          <span role="status" className="text-sm">
            {save.isPending ? '저장 중…' : status}
          </span>
        </>
      )}
    </div>
  );
}
