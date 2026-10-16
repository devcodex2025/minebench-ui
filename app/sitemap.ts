import { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';

export default function sitemap(): MetadataRoute.Sitemap {
    const guidePages: MetadataRoute.Sitemap = GUIDES.map(({ slug }) => ({
        url: `https://minebench.cloud/guides/${slug}`,
        changeFrequency: 'monthly',
        priority: 0.7,
    }));

    return [
        { url: 'https://minebench.cloud/depin', changeFrequency: 'monthly', priority: 0.8 },
        {
            url: 'https://minebench.cloud',
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://minebench.cloud/dashboard',
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: 'https://minebench.cloud/downloads',
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: 'https://minebench.cloud/guides',
            changeFrequency: 'weekly',
            priority: 0.75,
        },
        ...guidePages,
        {
            url: 'https://minebench.cloud/premium',
            changeFrequency: 'weekly',
            priority: 0.75,
        },
        {
            url: 'https://minebench.cloud/leaderboard',
            changeFrequency: 'daily',
            priority: 0.85,
        },
        {
            url: 'https://minebench.cloud/whitepaper',
            changeFrequency: 'monthly',
            priority: 0.7,
        },
    ];
}
