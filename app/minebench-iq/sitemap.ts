import type { MetadataRoute } from 'next';
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://iq.minebench.cloud/', changeFrequency: 'monthly', priority: 1 }];
}
