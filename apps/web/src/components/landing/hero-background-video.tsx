'use client';

import { useEffect, useRef } from 'react';

/**
 * Chrome often won't decode QuickTime .mov in <video>; we ship H.264 MP4 as primary.
 * Programmatic play() helps with some autoplay edge cases after load.
 */
export function HeroBackgroundVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const tryPlay = () => {
      void el.play().catch(() => {
        /* autoplay blocked — muted video usually still plays; ignore */
      });
    };
    el.addEventListener('loadeddata', tryPlay);
    tryPlay();
    return () => el.removeEventListener('loadeddata', tryPlay);
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 z-0 h-full min-h-full w-full object-cover object-center"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden
    >
      {/* MP4 (H.264) first — broad browser support including Chrome */}
      <source src="/videos/hero.mp4" type="video/mp4" />
      <source src="/videos/hero.mov" type="video/quicktime" />
    </video>
  );
}
