'use client';

import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';

export type TokenAllocation = {
    label: string;
    percent: number;
    amount: string;
    color: string;
};

type TokenomicsChartProps = {
    allocations: TokenAllocation[];
};

const size = 240;
const center = size / 2;
const radius = 88;
const circumference = 2 * Math.PI * radius;

export default function TokenomicsChart({ allocations }: TokenomicsChartProps) {
    const circleRefs = useRef<Array<SVGCircleElement | null>>([]);
    const detailRef = useRef<HTMLDivElement | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const activeIndex = hoveredIndex ?? selectedIndex;
    const activeAllocation = activeIndex === null ? null : allocations[activeIndex];
    let cumulativePercent = 0;

    useEffect(() => {
        const media = gsap.matchMedia();
        media.add('(prefers-reduced-motion: no-preference)', () => {
            circleRefs.current.forEach((circle, index) => {
                if (!circle) return;
                const segmentLength = circumference * allocations[index].percent / 100;
                gsap.fromTo(circle,
                    { strokeDasharray: `0 ${circumference}`, opacity: 0 },
                    {
                        strokeDasharray: `${segmentLength} ${circumference - segmentLength}`,
                        opacity: 1,
                        duration: 0.85,
                        delay: index * 0.09,
                        ease: 'power2.out',
                    });
            });
        });
        return () => media.revert();
    }, [allocations]);

    useEffect(() => {
        if (!detailRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        gsap.fromTo(detailRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' });
    }, [activeIndex]);

    const selectAllocation = (index: number) => {
        setSelectedIndex(current => current === index ? null : index);
    };

    return (
        <div className="grid items-center gap-8 md:grid-cols-[260px_minmax(0,1fr)]">
            <div className="relative mx-auto h-[260px] w-[260px]" onMouseLeave={() => setHoveredIndex(null)}>
                <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full overflow-visible" role="img" aria-label="Interactive BMT token allocation chart">
                    <circle cx={center} cy={center} r={radius} fill="none" stroke="rgb(39 39 42)" strokeWidth="22" />
                    {allocations.map((item, index) => {
                        const segmentLength = circumference * item.percent / 100;
                        const offset = circumference * cumulativePercent / 100;
                        cumulativePercent += item.percent;
                        const isActive = activeIndex === index;
                        const isDimmed = activeIndex !== null && !isActive;

                        return (
                            <circle
                                key={item.label}
                                ref={element => { circleRefs.current[index] = element; }}
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={item.color}
                                strokeWidth={isActive ? 30 : 22}
                                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                                strokeDashoffset={-offset}
                                strokeLinecap="butt"
                                transform={`rotate(-90 ${center} ${center})`}
                                style={{
                                    opacity: isDimmed ? 0.35 : 1,
                                    filter: isActive ? `drop-shadow(0 0 8px ${item.color})` : 'drop-shadow(0 0 0 transparent)',
                                }}
                                className="cursor-pointer outline-none transition-[opacity,stroke-width,filter] duration-200 focus-visible:opacity-100"
                                role="button"
                                tabIndex={0}
                                aria-label={`${item.label}: ${item.percent}%, ${item.amount} BMT`}
                                aria-pressed={selectedIndex === index}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onFocus={() => setHoveredIndex(index)}
                                onBlur={() => setHoveredIndex(null)}
                                onClick={() => selectAllocation(index)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        selectAllocation(index);
                                    }
                                }}
                            />
                        );
                    })}
                </svg>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-14 text-center">
                    <div key={activeAllocation?.label ?? 'total'} ref={detailRef}>
                        <span className="block text-xs text-zinc-400">{activeAllocation?.label ?? 'Total allocation'}</span>
                        <span className="mt-1 block text-4xl font-semibold tracking-tight text-white">
                            {activeAllocation ? `${activeAllocation.percent}%` : '1B'}
                        </span>
                        <span className="mt-1 block text-xs font-medium text-yellow-400">
                            {activeAllocation ? `${activeAllocation.amount} BMT` : 'BMT · Solana'}
                        </span>
                    </div>
                </div>
            </div>

            <div>
                <p className="mb-3 text-xs text-zinc-500">Hover, focus or tap an allocation to explore it.</p>
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">BMT allocation published on 29 August 2026, total 1,000,000,000 BMT</caption>
                    <thead>
                        <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                            <th scope="col" className="pb-3 font-medium">Allocation</th>
                            <th scope="col" className="pb-3 text-right font-medium">Share</th>
                            <th scope="col" className="pb-3 pl-3 text-right font-medium">BMT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allocations.map((item, index) => {
                            const isActive = activeIndex === index;
                            return (
                                <tr
                                    key={item.label}
                                    className="cursor-pointer border-b border-zinc-800/70 transition-colors duration-200"
                                    style={{ backgroundColor: isActive ? 'rgba(250, 204, 21, 0.07)' : 'transparent' }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    onClick={() => selectAllocation(index)}
                                >
                                    <th scope="row" className="py-3 pr-2 font-medium text-zinc-200">
                                        <button
                                            type="button"
                                            className="flex w-full items-center text-left outline-none focus-visible:text-yellow-400"
                                            aria-pressed={selectedIndex === index}
                                            onFocus={() => setHoveredIndex(index)}
                                            onBlur={() => setHoveredIndex(null)}
                                        >
                                            <span
                                                className="mr-2 inline-block h-2 w-2 shrink-0 rounded-full transition-transform duration-200"
                                                style={{ backgroundColor: item.color, transform: `scale(${isActive ? 1.6 : 1})` }}
                                                aria-hidden="true"
                                            />
                                            {item.label}
                                        </button>
                                    </th>
                                    <td className="py-3 text-right tabular-nums text-white">{item.percent}%</td>
                                    <td className="py-3 pl-3 text-right text-xs tabular-nums text-zinc-400">{item.amount}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
