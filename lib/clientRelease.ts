import { getVerifiedGithubClientRelease } from './verifiedClientRelease';
import {
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_API_URL,
  CLIENT_RELEASES_URL,
  CLIENT_RELEASE_GITHUB_API_URL,
  CLIENT_RELEASE_GITHUB_ENABLED,
  CLIENT_RELEASE_API_TIMEOUT_MS,
} from './clientReleaseConstants';
import { cache } from 'react';

export {
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_API_URL,
  CLIENT_RELEASES_URL,
  CLIENT_RELEASE_GITHUB_API_URL,
  CLIENT_RELEASE_GITHUB_ENABLED,
  CLIENT_RELEASE_API_TIMEOUT_MS,
};

export type ClientRelease = {
  metadataStatus: 'live' | 'fallback';
  url?: string;
  html_url?: string;
  name: string | null;
  tag_name: string;
  version?: string;
  assets?: Array<{ name: string; browser_download_url: string; platform?: string; architecture?: string; package?: string; sha256?: string; size?: number }>;
  provider?: 'bitbucket' | 'github';
  sourceSha?: string;
  releaseId?: number;
  catalogDigest?: string;
  freshness?: 'live' | 'fallback';
};

type BitbucketDownload = {
  name?: string;
};

type BitbucketDownloadsResponse = {
  values?: BitbucketDownload[];
};

const extractVersion = (name: string): string | null => {
  const match = name.match(/^MineBench\.Client(?:_|-)(\d+(?:\.\d+)+)(?:_|-)/i);
  return match?.[1] || null;
};

const compareVersions = (left: string, right: string): number => {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference;
  }

  return 0;
};

const toDownloadUrl = (download: BitbucketDownload): string | null => {
  if (!download.name) return null;
  return `${CLIENT_RELEASES_URL}${encodeURIComponent(download.name)}`;
};

export const getLatestClientRelease = cache(async (): Promise<ClientRelease> => {
  if (CLIENT_RELEASE_GITHUB_ENABLED) return getVerifiedGithubClientRelease();
  try {
    const response = await fetch(`${CLIENT_RELEASES_API_URL}?pagelen=100`, {
      headers: { Accept: 'application/json', 'User-Agent': 'MineBench-UI' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Bitbucket downloads fetch failed: ${response.status}`);
    }

    const payload = await response.json() as BitbucketDownloadsResponse;
    const downloads = (payload.values || []).filter((download): download is BitbucketDownload & { name: string } => (
      typeof download.name === 'string' && extractVersion(download.name) !== null
    ));
    const versions = downloads
      .map((download) => extractVersion(download.name))
      .filter((version): version is string => version !== null)
      .sort(compareVersions);
    const latestVersion = versions[versions.length - 1];

    if (!latestVersion) {
      throw new Error('Bitbucket downloads contain no MineBench client builds');
    }

    const assets = downloads
      .filter((download) => extractVersion(download.name) === latestVersion)
      .map((download) => ({
        name: download.name,
        browser_download_url: toDownloadUrl(download),
      }))
      .filter((asset): asset is { name: string; browser_download_url: string } => asset.browser_download_url !== null);
    const tagName = `v${latestVersion}`;

    return {
      metadataStatus: 'live',
      html_url: CLIENT_RELEASES_URL,
      name: tagName,
      tag_name: tagName,
      version: tagName,
      assets,
    };
  } catch (err) {
    console.error('[clientRelease] Latest Bitbucket client release unavailable:', err);
    throw new Error('No verified client release is available');
  }
});
