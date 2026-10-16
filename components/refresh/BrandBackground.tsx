'use client';
import { useEffect, useState } from 'react';
import ShapeGrid from './ShapeGrid';
export default function BrandBackground() {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = window.matchMedia('(min-width: 768px)');
    const update = () => setMotion(viewport.matches && !preference.matches && !document.hidden);
    update();
    preference.addEventListener('change', update);
    viewport.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      preference.removeEventListener('change', update);
      viewport.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return <div className="refresh-background" aria-hidden="true">{motion && <ShapeGrid direction="diagonal" speed={0.2} borderColor="rgba(250,204,21,0.18)" squareSize={65} hoverFillColor="rgba(250,204,21,0.08)"/>}</div>;
}
