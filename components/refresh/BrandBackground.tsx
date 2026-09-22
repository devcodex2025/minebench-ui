'use client';
import { useEffect, useState } from 'react';
import ShapeGrid from './ShapeGrid';
export default function BrandBackground() {
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setMotion(!preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  return <div className="refresh-background" aria-hidden="true">{motion && <ShapeGrid direction="diagonal" speed={0.2} borderColor="rgba(250,204,21,0.18)" squareSize={65} hoverFillColor="rgba(250,204,21,0.08)"/>}</div>;
}
