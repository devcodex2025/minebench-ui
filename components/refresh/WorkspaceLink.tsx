'use client';

import Link from 'next/link';
import { siteHref, useIQHost } from '@/components/iq/SiteLinks';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps } from 'react';
import { CornerDownRight, Home, Volume2, VolumeX } from 'lucide-react';
import { beginHoldSound, SOUND_KEY, soundEnabled } from './workspaceAudio';
import './WorkspaceMotion.css';

export const isWorkspace = (path: string) => /^\/(dashboard|leaderboard|pool-rewards|transactions|conversions|benchmark)(\/|$|\?)/.test(path);
const HOLD_MS = 900;
const HOLD_EVENT = 'minebench:workspace-hold';
let currentHoldOwner: symbol | null = null;
const NAVIGATE_EVENT = 'minebench:workspace-navigate';
type HoldVisual = { entering: boolean; ready: boolean; label: string };
type Navigation = { href: string; entering: boolean; immersive: boolean; label: string };
const announceHold = (detail: HoldVisual | null) => window.dispatchEvent(new CustomEvent(HOLD_EVENT, {detail}));
const requestNavigation = (detail: Navigation) => window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, {detail}));

export function WorkspaceSoundButton() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => setEnabled(soundEnabled()), []);
  return <button type="button" className="refresh-icon-button workspace-sound" aria-label={enabled ? 'Mute workspace sounds' : 'Enable workspace sounds'} aria-pressed={enabled}
    onClick={() => { const next = !enabled; setEnabled(next); try { localStorage.setItem(SOUND_KEY,next ? 'on' : 'off'); } catch {} }}>
    {enabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
  </button>;
}

export function WorkspaceMotion() {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const previous = useRef(pathname);
  const [hold, setHold] = useState<HoldVisual | null>(null);
  const [pending, setPending] = useState(false);
  const active = useRef<Navigation | null>(null);
  const animation = useRef<Animation | undefined>(undefined);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const overlay = useRef<HTMLDivElement>(null);
  const veilAnimation = useRef<Animation | undefined>(undefined);
  const clear = () => { clearTimeout(timeout.current); animation.current?.cancel(); animation.current=undefined; active.current=null; };
  useEffect(() => {
    const holdListener = (event: Event) => { if (!active.current) {veilAnimation.current?.cancel();setHold((event as CustomEvent<HoldVisual | null>).detail);} };
    const navigateListener = (event: Event) => {
      const next = (event as CustomEvent<Navigation>).detail;
      veilAnimation.current?.cancel();clear(); active.current=next; setPending(true);
      setHold({entering:next.entering,ready:true,label:next.label});
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animation.current=document.querySelector('main')?.animate([
          {opacity:1,transform:'scale(1)'},{opacity:.15,transform:`scale(${next.entering ? 1.035 : .97})`}
        ],{duration:200,easing:'ease-out',fill:'forwards'});
      }
      // Keep the current page recoverable when a route never completes.
      timeout.current=setTimeout(() => { clear();setPending(false);setHold(null); },10000);
      router.push(next.href);
    };
    window.addEventListener(HOLD_EVENT,holdListener); window.addEventListener(NAVIGATE_EVENT,navigateListener);
    return () => { veilAnimation.current?.cancel();clear();window.removeEventListener(HOLD_EVENT,holdListener);window.removeEventListener(NAVIGATE_EVENT,navigateListener); };
  }, [router]);
  useLayoutEffect(() => {
    const before=previous.current; previous.current=pathname;
    if(before===pathname) return;
    const transition=active.current;
    clear();setPending(false);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!reduced && (transition || isWorkspace(before)!==isWorkspace(pathname))) {
      animation.current=document.querySelector('main')?.animate([
        {opacity:.2,transform:`scale(${isWorkspace(pathname) ? .97 : 1.025})`},{opacity:1,transform:'scale(1)'}
      ],{duration:440,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
      veilAnimation.current?.cancel();
      const veil=overlay.current?.animate([{opacity:1},{opacity:0}],{duration:260,easing:'ease-out',fill:'forwards'});
      veilAnimation.current=veil;
      if(veil) void veil.finished.then(() => setHold(null)).catch(() => {}); else setHold(null);
    } else setHold(null);
  },[pathname]);
  return hold && <div ref={overlay} className="workspace-hold-overlay" data-ready={hold.ready} data-pending={pending} data-direction={hold.entering ? 'in' : 'out'}>
    <div className="workspace-hold-card" role="status" aria-live="polite">
      <div className="workspace-hold-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44"/><circle className="workspace-hold-progress" cx="50" cy="50" r="44"/></svg>{hold.entering ? <CornerDownRight size={28}/> : <Home size={28}/>}</div>
      <strong>{hold.ready ? (hold.entering ? 'Opening workspace' : 'Opening main site') : hold.entering ? 'Entering workspace' : 'Returning to main site'}</strong>
      <span>{hold.label}</span><small>{hold.ready ? '100%' : 'Keep holding · Escape to cancel'}</small>
    </div>
  </div>;
}

export default function WorkspaceLink({ children, onNavigate, onClick, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onContextMenu, ...props }: ComponentProps<typeof Link>) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const completed = useRef(false);
  const owner = useRef(Symbol());
  const session = useRef<{started:number;ready:boolean;cancel:()=>void} | null>(null);
  const suppressClick = useRef(false);
  const iqHost = useIQHost();
  const originalHref = typeof props.href === 'string' ? props.href : props.href.pathname || '/';
  const href = siteHref(originalHref, iqHost);
  const entering = !isWorkspace(pathname) && isWorkspace(href);
  const crossing = isWorkspace(pathname) !== isWorkspace(href) && href.startsWith('/') && !href.startsWith('//');
  const cancel = () => {
    if (!session.current) return;
    suppressClick.current = performance.now() - session.current.started >= 180;
    session.current.cancel(); session.current = null;
    if(currentHoldOwner===owner.current) {currentHoldOwner=null;announceHold(null);}
  };
  const abortHold = () => { if (session.current) { cancel(); suppressClick.current = true; } };
  useEffect(() => () => { session.current?.cancel();if(currentHoldOwner===owner.current) {currentHoldOwner=null;announceHold(null);} }, []);

  const navigate = (immersive: boolean, label: string) => requestNavigation({href,entering,immersive,label});

  return <Link {...props} href={typeof props.href === 'string' ? href : props.href} title={props.title || (crossing ? 'Click to open · Hold for immersive transition' : undefined)} data-workspace-link={crossing || undefined}
    onPointerDown={event => {
      onPointerDown?.(event);
      if (event.defaultPrevented || !crossing || event.button !== 0 || !event.isPrimary || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || props.target === '_blank') return;
      cancel(); suppressClick.current = false; completed.current=false; currentHoldOwner=owner.current; router.prefetch(href);
      const label = event.currentTarget.textContent?.trim() || (entering ? 'Workspace' : 'Main site');
      const stopSound = beginHoldSound(entering);
      const show = window.setTimeout(() => {if(currentHoldOwner===owner.current)announceHold({entering,ready:false,label});},180);
      const complete = window.setTimeout(() => { if (session.current && currentHoldOwner===owner.current) { currentHoldOwner=null;completed.current=true; suppressClick.current=true; session.current.cancel(); session.current=null; navigate(true,label); } },HOLD_MS);
      const escape = (e: KeyboardEvent) => { if(['Escape','Control','Meta','Alt','Shift'].includes(e.key)) abortHold(); };
      const hidden = () => { if(document.hidden) abortHold(); };
      window.addEventListener('blur',abortHold); window.addEventListener('keydown',escape); document.addEventListener('visibilitychange',hidden);
      session.current = {started:performance.now(),ready:false,cancel:() => {
        clearTimeout(show);clearTimeout(complete);stopSound();window.removeEventListener('blur',abortHold);window.removeEventListener('keydown',escape);document.removeEventListener('visibilitychange',hidden);
      }};
    }}
    onPointerUp={event => {
      onPointerUp?.(event); if(completed.current) return; cancel();
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) { suppressClick.current=false; return; }

    }}
    onPointerLeave={event => { onPointerLeave?.(event); abortHold(); }}
    onPointerCancel={event => { onPointerCancel?.(event); abortHold(); }}
    onContextMenu={event => { onContextMenu?.(event); abortHold(); }}
    onClick={event => { if(suppressClick.current && event.detail !== 0) { event.preventDefault(); suppressClick.current=false; return; } onClick?.(event); }}
    onNavigate={event => {
      let prevented=false;
      onNavigate?.({preventDefault:()=>{prevented=true;event.preventDefault();}});
      if(prevented || !crossing) return;
      event.preventDefault(); navigate(false, entering ? 'Workspace' : 'Main site');
    }}>
    {children}{entering && <CornerDownRight className="workspace-enter-icon" size={14} aria-label="Enter workspace"/>}
  </Link>;
}
