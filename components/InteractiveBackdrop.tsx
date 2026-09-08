'use client';

import { useEffect, useRef } from 'react';
import styles from './InteractiveBackdrop.module.css';

const points = Array.from({ length: 32 }, (_, index) => ({
  x: ((index * 37 + 11) % 100) / 100,
  y: ((index * 61 + 7) % 100) / 100,
}));

export default function InteractiveBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const glow = glowRef.current;
    if (!root || !glow) return;
    const glowStyle = glow.style;

    const enabled = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-particle]'));
    const offsets = points.map(() => ({ x: 0, y: 0 }));
    let width = window.innerWidth;
    let height = window.innerHeight;
    let pointerX = width / 2;
    let pointerY = height / 2;
    let glowX = pointerX;
    let glowY = pointerY;
    let opacity = 0;
    let active = false;
    let frame = 0;
    let previousTime = 0;

    function draw(time: number) {
      frame = 0;
      const delta = previousTime ? Math.min(time - previousTime, 64) : 16.67;
      previousTime = time;
      const ease = 1 - Math.exp(-delta / 95);
      const targetOpacity = active ? 1 : 0;
      opacity += (targetOpacity - opacity) * ease;
      glowX += (pointerX - glowX) * ease;
      glowY += (pointerY - glowY) * ease;
      glowStyle.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
      glowStyle.opacity = opacity.toFixed(3);
      let moving = Math.abs(targetOpacity - opacity) > 0.002
        || Math.abs(pointerX - glowX) + Math.abs(pointerY - glowY) > 0.2;

      points.forEach((point, index) => {
        const dx = point.x * width - pointerX;
        const dy = point.y * height - pointerY;
        const distance = Math.hypot(dx, dy);
        const influence = active ? Math.max(0, 1 - distance / 240) : 0;
        const push = influence * influence * 48;
        const targetX = dx / Math.max(distance, 1) * push;
        const targetY = dy / Math.max(distance, 1) * push;
        const offset = offsets[index];
        offset.x += (targetX - offset.x) * ease;
        offset.y += (targetY - offset.y) * ease;
        nodes[index].style.transform = `translate3d(${offset.x}px, ${offset.y}px, 0)`;
        nodes[index].style.opacity = (0.2 + influence * 0.6).toFixed(3);
        moving ||= Math.abs(targetX - offset.x) + Math.abs(targetY - offset.y) > 0.1;
      });

      // Render at the display refresh rate only while the interaction is settling.
      if (moving) frame = requestAnimationFrame(draw);
      else previousTime = 0;
    }

    function wake() {
      if (enabled.matches && !document.hidden && !frame) frame = requestAnimationFrame(draw);
    }

    function move(event: PointerEvent) {
      if (event.pointerType === 'touch' || !enabled.matches || document.hidden) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      active = true;
      wake();
    }

    function leave() {
      active = false;
      wake();
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      active = false;
      opacity = 0;
      glowStyle.opacity = '0';
      offsets.forEach((offset, index) => {
        offset.x = offset.y = 0;
        nodes[index].style.transform = '';
        nodes[index].style.opacity = '';
      });
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      wake();
    }

    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', reset);
    enabled.addEventListener('change', reset);
    return () => {
      reset();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', reset);
      enabled.removeEventListener('change', reset);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.backdrop} aria-hidden="true">
      <div ref={glowRef} className={styles.glow} />
      {points.map((point, index) => (
        <span key={index} data-particle className={styles.particle}
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} />
      ))}
    </div>
  );
}
