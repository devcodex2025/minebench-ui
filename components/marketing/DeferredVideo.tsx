'use client';

import { forwardRef, useState } from 'react';
import Image from 'next/image';

export type DeferredVideoProps = {
  src: string;
  type?: string;
  poster: string;
  width: number;
  height: number;
  className?: string;
  label: string;
  priority?: boolean;
  muted?: boolean;
};

const DeferredVideo = forwardRef<HTMLVideoElement, DeferredVideoProps>(function DeferredVideo({ src, type = 'video/mp4', poster, width, height, className, label, priority = false, muted = false }, ref) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return <p role="status" className="flex aspect-video items-center justify-center bg-black/40 p-6 text-center text-sm text-zinc-400">This video is currently unavailable.</p>;
  }

  if (!active) {
    return (
      <button
        type="button"
        className={`relative block overflow-hidden ${className || ''}`}
        style={{ aspectRatio: `${width} / ${height}` }}
        aria-label={`Play ${label}`}
        onClick={() => setActive(true)}
      >
        <Image src={poster} priority={priority} fetchPriority={priority ? 'high' : undefined} alt="" width={width} height={height} sizes="(max-width: 768px) 100vw, 900px" className="absolute inset-0 h-full w-full object-cover" />
        <span aria-hidden="true" className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-400 text-2xl text-black shadow-lg">▶</span>
      </button>
    );
  }

  return (
    <video
      className={className}
      ref={ref}
      width={width}
      height={height}
      poster={poster}
      controls
      autoPlay
      muted={muted}
      preload="none"
      playsInline
      aria-label={label}
      onError={() => setError(true)}
    >
      <source src={src} type={type} />
      Your browser does not support the video tag.
    </video>
  );
});

export default DeferredVideo;
