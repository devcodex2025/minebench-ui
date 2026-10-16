'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Pause, Play } from 'lucide-react';

const Waves = dynamic(() => import('../reactbits/Waves'), { ssr: false });

export default function HeroAtmosphere() {
  const root = useRef<HTMLDivElement>(null);
  const [allowed, setAllowed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const viewport = matchMedia('(min-width: 768px)');
    const update = () => setAllowed(viewport.matches && !preference.matches && !document.hidden);
    update(); viewport.addEventListener('change', update); preference.addEventListener('change', update); document.addEventListener('visibilitychange', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    return () => { observer.disconnect(); viewport.removeEventListener('change', update); preference.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  const animate = allowed && visible && !paused;
  return <>
    <div ref={root} className="mb-hero-atmosphere" aria-hidden="true" data-animated={animate}><div className="mb-hero-wave-field">{animate && <Waves lineColor="rgba(250,204,21,0.24)" waveSpeedX={0.006} waveSpeedY={0.002} waveAmpX={42} waveAmpY={20} xGap={24} yGap={20} maxCursorMove={12}/>}</div></div>
    {allowed && <button type="button" className="mb-hero-motion-toggle" aria-label={paused ? 'Play hero animation' : 'Pause hero animation'} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button>}
  </>;
}
