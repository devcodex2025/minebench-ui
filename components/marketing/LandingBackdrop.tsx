'use client';

export default function LandingBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,210,92,0.16),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(71,188,140,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,210,92,0.08),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.14]" />
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(8,10,15,0.92),rgba(8,10,15,0))]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(0deg,rgba(8,10,15,0.98),rgba(8,10,15,0))]" />
    </div>
  );
}
