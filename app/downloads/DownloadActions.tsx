'use client';

import { Download } from 'lucide-react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { preload } from 'react-dom';
import { Button, ButtonLink } from '@/components/base/buttons/button';
import { trackMarketingEvent } from '@/lib/marketingAnalytics';

type ReleaseIdentity = {
    provider?: 'github' | 'bitbucket';
    version?: string;
    tag_name?: string;
    sourceSha?: string;
    releaseId?: number;
    catalogDigest?: string;
    assets?: Array<{ browser_download_url: string }>;
};

type Availability = { urls?: string[]; message?: string };
const DownloadAvailability = createContext<Availability>({});

export function DownloadReleaseProvider({ initialClientRelease, children }: { initialClientRelease: ReleaseIdentity | null; children: ReactNode }) {
    const [availability, setAvailability] = useState<Availability>({});

    useEffect(() => {
        const controller = new AbortController();
        let active = true;
        const initiallyVerified = initialClientRelease?.provider === 'github';
        const unavailable = () => {
            if (active && initiallyVerified) setAvailability({ urls: [], message: 'Verified release metadata is temporarily unavailable. Refresh this page before downloading.' });
        };

        const deadline = setTimeout(() => {
            unavailable();
            active = false;
            controller.abort();
        }, 10_000);

        void (async () => {
            try {
                const response = await fetch('/api/releases', { cache: 'no-store', signal: controller.signal });
                if (!response.ok) throw new Error('Release verification unavailable');
                const current: ReleaseIdentity | null = (await response.json())?.client || null;
                if (!active) return;
                if (!current) throw new Error('Release metadata missing');
                if (!initiallyVerified && current.provider !== 'github') return;
                const sameSelection = initiallyVerified && current.provider === 'github'
                    && /^[a-f0-9]{40}$/.test(current.sourceSha || '')
                    && /^[a-f0-9]{64}$/.test(current.catalogDigest || '')
                    && Number.isSafeInteger(current.releaseId) && Number(current.releaseId) > 0
                    && current.sourceSha === initialClientRelease.sourceSha
                    && current.releaseId === initialClientRelease.releaseId
                    && current.catalogDigest === initialClientRelease.catalogDigest
                    && (current.version || current.tag_name) === (initialClientRelease.version || initialClientRelease.tag_name)
                    && Array.isArray(current.assets);
                if (!sameSelection) {
                    setAvailability({ urls: [], message: 'The selected release has changed. Refresh this page to see its verified downloads.' });
                    return;
                }
                setAvailability({ urls: current.assets!.map(asset => asset.browser_download_url) });
            } catch {
                unavailable();
            } finally {
                clearTimeout(deadline);
            }
        })();

        return () => { active = false; clearTimeout(deadline); controller.abort(); };
    }, [initialClientRelease]);

    return (
        <DownloadAvailability.Provider value={availability}>
            {children}
            {availability.message && <p role="status" className="mb-12 text-center text-sm text-amber-200">{availability.message}</p>}
        </DownloadAvailability.Provider>
    );
}

export function DownloadReleaseNotesLink({ href }: { href: string }) {
    const availability = useContext(DownloadAvailability);
    if (availability.urls?.length === 0) return null;
    return <a className="underline" href={href}>Release notes and checksums</a>;
}

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
    const availability = useContext(DownloadAvailability);
    if (availability.urls && !availability.urls.includes(href)) return null;
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

    const platformLabel = { windows: 'Windows', macos: 'macOS', linux: 'Linux' }[platform];
    const architectureLabel = ['x64', 'x86_64'].includes(arch) ? 'x86-64' : arch.toUpperCase();
    const packageLabel = /\.(app\.tar\.gz|appimage|dmg|deb|rpm|msi|exe|zip)(?:[?#]|$)/i.exec(href)?.[1].toUpperCase();

    return (
        <ButtonLink aria-label={`Download MineBench Client for ${platformLabel} ${architectureLabel}${packageLabel ? ` (${packageLabel})` : ''}`} href={href} target="_blank" rel="noopener noreferrer" onClick={handleDownloadClick} leadingIcon={Download} className="mt-4">
            Download
        </ButtonLink>
    );
}
