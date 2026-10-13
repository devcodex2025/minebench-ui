import {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_API_URL,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
} from './clientReleaseConstants';

export {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_API_URL,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
};

export type ClientRelease = {
  url?: string;
  html_url?: string;
  name: string | null;
  tag_name: string;
  version?: string;
  assets?: Array<{ name: string; browser_download_url: string }>;
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

const createFallbackClientRelease = (): ClientRelease => {
  const tagName = CLIENT_RELEASE_FALLBACK_VERSION;
  const version = tagName.replace(/^v/i, '');
  const urls = getClientReleaseDownloadUrls(tagName);

  return {
    html_url: CLIENT_RELEASES_URL,
    name: tagName,
    tag_name: tagName,
    version: tagName,
    assets: [
      { name: `MineBench.Client-${version}-1.x86_64.rpm`, browser_download_url: urls.rpm },
      { name: `MineBench.Client_${version}_amd64.AppImage`, browser_download_url: urls.appimage },
      { name: `MineBench.Client_${version}_amd64.deb`, browser_download_url: urls.deb },
      { name: `MineBench.Client_${version}_x64-setup.exe`, browser_download_url: urls.exe },
    ],
  };
};

export async function getLatestClientRelease(): Promise<ClientRelease> {
  try {
    const response = await fetch(`${CLIENT_RELEASES_API_URL}?pagelen=100`, {
      headers: { Accept: 'application/json', 'User-Agent': 'MineBench-UI' },
      cache: 'no-store',
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
      html_url: CLIENT_RELEASES_URL,
      name: tagName,
      tag_name: tagName,
      version: tagName,
      assets,
    };
  } catch (err) {
    console.error('[clientRelease] Latest Bitbucket client release unavailable:', err);
    return createFallbackClientRelease();
  }
}
