import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
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
            url: 'https://minebench.cloud/pool-rewards',
            changeFrequency: 'hourly',
            priority: 0.85,
        },
        {
            url: 'https://minebench.cloud/whitepaper',
            changeFrequency: 'monthly',
            priority: 0.7,
        },
    ];
}
