'use client';

import { Download } from 'lucide-react';
import { preload } from 'react-dom';
import { Button, ButtonLink } from '@/components/base/buttons/button';
import { trackMarketingEvent } from '@/lib/marketingAnalytics';

export function ChooseDownloadButton() {
    preload('/fonts/MineBenchMonoLatin.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' });
    return (
        <Button
            onClick={() => {
                const el = document.getElementById('download-section');
                if (el) window.scrollTo({
                    top: el.getBoundingClientRect().top + window.scrollY - 112,
                    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
                });
            }}
            leadingIcon={Download}
            className="h-11 px-5"
        >
            Choose your download
        </Button>
    );
}

export function DownloadBuildLink({ href, platform, arch }: { href: string; platform: 'windows' | 'macos' | 'linux'; arch: string }) {
    const handleDownloadClick = async () => {
        trackMarketingEvent('download_selected', { platform, arch });
        try {
            await fetch('/api/increment-download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'client', platform, arch }),
            });
        } catch (error) {
            console.error('Error tracking download:', error);
        }
    };

    return (
        <ButtonLink href={href} target="_blank" rel="noopener noreferrer" onClick={handleDownloadClick} leadingIcon={Download} className="mt-4">
            Download
        </ButtonLink>
    );
}
