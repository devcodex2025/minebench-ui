'use client';

import { useState } from 'react';

export default function DePinVideo() {
  const [videoError, setVideoError] = useState(false);
  return <figure className="depin-video"><video controls preload="none" playsInline width={2000} height={1500} poster="/video/minebench-depin-poster.jpg" aria-label="MineBench DePIN promotional video" onError={() => setVideoError(true)}><source src="/video/minebench-depin-promo.mp4" type="video/mp4" />Your browser does not support this video.</video><figcaption>MineBench DePIN · Project vision. The capability labels on this page distinguish current features from planned work.</figcaption>{videoError && <p role="status">The video is currently unavailable. Explore the architecture below.</p>}</figure>;
}
