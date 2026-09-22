'use client';

// Adapted from David Haz's React Bits Carousel (3a1c7f2f9f94ed833934ab5c2635760b9e644583).
// MIT + Commons Clause: vendor/REACT-BITS-LICENSE.md. Image-only, responsive, non-looping variant.
import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useTransform, type MotionValue, type PanInfo } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './ScreenshotCarousel.css';

type Screenshot = { src: string; alt: string; width?: number; height?: number };
const GAP = 16;
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 30 };

function Slide({ item, index, width, x, selected, reduced, dragged, onOpen }: {
  item: Screenshot; index: number; width: number; x: MotionValue<number>; selected: boolean;
  reduced: boolean; dragged: React.RefObject<boolean>; onOpen: (item: Screenshot) => void;
}) {
  const offset = width + GAP;
  const rotateY = useTransform(x, [-(index + 1) * offset, -index * offset, -(index - 1) * offset], [8, 0, -8]);
  return <motion.div className="rb-screenshot-slide" style={{ width: width || '100%', rotateY: reduced ? 0 : rotateY }} aria-hidden={!selected}>
    <a href={item.src} target="_blank" rel="noopener noreferrer" tabIndex={selected ? 0 : -1} draggable={false}
      aria-label={`${item.alt}, open full-size screenshot`}
      onClick={event => { if (dragged.current && event.detail !== 0) {event.preventDefault();return;} if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {event.preventDefault();onOpen(item);} }}>
      <Image src={item.src} alt={item.alt} width={item.width || 1136} height={item.height || 560} sizes="(max-width:1024px) 100vw, 960px" draggable={false}/>
    </a>
  </motion.div>;
}

export default function ScreenshotCarousel({ items }: { items: Screenshot[] }) {
  const container = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [enlarged, setEnlarged] = useState<Screenshot | null>(null);
  useEffect(() => {
    if (!enlarged || !dialog.current) return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    dialog.current.showModal();
    return () => {dialog.current?.close();document.body.style.overflow=previous;};
  },[enlarged]);
  const dragged = useRef(false);
  const [width, setWidth] = useState(0);
  const [position, setPosition] = useState(0);
  const x = useMotionValue(0);
  const reduced = !!useReducedMotion();
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const offset = width + GAP;
  const select = (next: number) => setPosition(Math.max(0, Math.min(next, items.length - 1)));
  const onDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) < 35 && Math.abs(info.velocity.x) < 500) return;
    select(position + (info.offset.x < -35 || info.velocity.x < -500 ? 1 : -1));
  };
  return <section className="premium-gallery rb-screenshot-carousel" data-ready={width > 0} aria-label="Premium screenshots" aria-roledescription="carousel">
    <div className="rb-screenshot-window" ref={container} style={{aspectRatio:Math.min(...items.map(item => (item.width || 1136)/(item.height || 560)))}}>
      <motion.div className="rb-screenshot-track" drag={width ? 'x' : false} dragConstraints={{left:-(items.length - 1) * offset,right:0}}
        dragElastic={0.08} dragMomentum={false} style={{x,gap:GAP}} animate={{x:-position * offset}}
        transition={reduced ? {duration:0} : SPRING} onDragEnd={onDragEnd}
        onPointerDownCapture={() => { dragged.current = false; }} onDragStart={() => { dragged.current = true; }}>
        {items.map((item,index) => <Slide key={item.src} item={item} index={index} width={width} x={x} selected={index === position} reduced={reduced} dragged={dragged} onOpen={setEnlarged}/>)}
      </motion.div>
    </div>
    <div className="rb-screenshot-controls">
      <button type="button" onClick={() => select(position-1)} disabled={!width || position===0} aria-label="Previous screenshot"><ChevronLeft size={20}/></button>
      <div className="rb-screenshot-dots">{items.map((item,index) => <button key={item.src} type="button" disabled={!width} onClick={() => select(index)} aria-label={`Show screenshot ${index+1} of ${items.length}`} aria-current={position===index ? 'true' : undefined}><span/></button>)}</div>
      <button type="button" onClick={() => select(position+1)} disabled={!width || position===items.length-1} aria-label="Next screenshot"><ChevronRight size={20}/></button>
    </div>
    <dialog ref={dialog} className="premium-lightbox" aria-label="Full-size Premium screenshot" onCancel={() => setEnlarged(null)} onClick={event => {if(event.target===event.currentTarget)setEnlarged(null);}}>
      <button type="button" className="premium-lightbox-close" aria-label="Close screenshot" onClick={() => setEnlarged(null)}><X size={22}/></button>
      {enlarged && <Image src={enlarged.src} alt={enlarged.alt} width={enlarged.width || 1136} height={enlarged.height || 560} sizes="100vw"/>}
    </dialog>
    <span className="sr-only" aria-live="polite">Screenshot {position+1} of {items.length}</span>
  </section>;
}
