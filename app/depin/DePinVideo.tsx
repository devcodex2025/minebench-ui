'use client';

import { useEffect, useRef, useState } from 'react';

export default function DePinVideo() {
  const [videoError, setVideoError] = useState(false);
  const [posterReady, setPosterReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (typeof IntersectionObserver === 'undefined') {
      setPosterReady(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setPosterReady(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return <figure className="depin-video"><video ref={videoRef} controls preload="none" playsInline width={2000} height={1500} poster={posterReady ? '/video/minebench-depin-poster.webp' : undefined} aria-label="MineBench DePIN promotional video" onError={() => setVideoError(true)}><source src="/video/minebench-depin-promo.mp4" type="video/mp4" />Your browser does not support this video.</video><figcaption>MineBench DePIN · Project vision. The capability labels on this page distinguish current features from planned work.</figcaption>{videoError && <p role="status">The video is currently unavailable. Explore the architecture below.</p>}</figure>;
}
