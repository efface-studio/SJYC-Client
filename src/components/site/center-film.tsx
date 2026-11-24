'use client';

import { ArrowDown } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/features/settings/use-settings';

const PLAYBACK_RATE = 1.2;

export function CenterFilm() {
  const settings = useSiteSettings();
  return <Film key={settings.film} movie={settings.film} settings={settings} />;
}

function Film({ movie, settings }: { movie: string; settings: ReturnType<typeof useSiteSettings> }) {
  const film = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const [preference, setPreference] = useState<'auto' | 'play' | 'pause'>('auto');

  useEffect(() => {
    const video = film.current;
    if (!video || failed) return;
    video.defaultPlaybackRate = PLAYBACK_RATE;
    video.playbackRate = PLAYBACK_RATE;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const syncPlayback = () => {
      if (
        !visible ||
        document.hidden ||
        preference === 'pause' ||
        (preference === 'auto' && motion.matches)
      ) {
        video.pause();
        return;
      }
      if (video.getAttribute('src') !== movie) video.src = movie;
      void video.play().catch(() => {});
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      syncPlayback();
    });
    observer.observe(video);
    document.addEventListener('visibilitychange', syncPlayback);
    motion.addEventListener('change', syncPlayback);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', syncPlayback);
      motion.removeEventListener('change', syncPlayback);
      video.pause();
    };
  }, [failed, movie, preference]);

  return (
    <section className="center-film" aria-labelledby="film-title">
      <video
        ref={film}
        muted
        playsInline
        loop
        preload="none"
        poster={settings.poster}
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
        hidden={failed}
      />
      <h1 id="film-title">
        <Image
          src={settings.heroLogo}
          alt={settings.formalName}
          width={474}
          height={75}
          unoptimized
          priority
        />
      </h1>
      <span className="film-scroll-cue" aria-hidden="true">
        <ArrowDown size={24} strokeWidth={1.5} />
      </span>
      {!failed && (
        <button
          type="button"
          className="film-playback sr-only"
          onClick={() => setPreference(film.current?.paused ? 'play' : 'pause')}
        >
          {playing ? '배경 영상 일시정지' : '배경 영상 재생'}
        </button>
      )}
    </section>
  );
}
