import {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  buildDirectDownloadUrl,
} from './clientReleaseConstants';

export {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  buildDirectDownloadUrl,
};

export type GithubRelease = {
  url?: string;
  html_url?: string;
  name: string | null;
  tag_name: string;
  version?: string;
  assets?: any[];
};

const githubHeaders = (): Record<string, string> => {
  const token = process.env.GITHUB_SERVER_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

export const getClientReleaseFallback = (): GithubRelease => ({
  url: CLIENT_RELEASES_URL,
  html_url: CLIENT_RELEASES_URL,
  name: CLIENT_RELEASE_FALLBACK_VERSION,
  tag_name: CLIENT_RELEASE_FALLBACK_VERSION,
  version: CLIENT_RELEASE_FALLBACK_VERSION,
  assets: [],
});

export async function getLatestClientRelease(): Promise<GithubRelease> {
  try {
    const response = await fetch(`https://api.github.com/repos/${CLIENT_RELEASE_REPO}/releases/latest`, {
      headers: githubHeaders(),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Client release fetch failed: ${response.status}`);
    }

    const release = await response.json();
    return {
      ...release,
      version: release.tag_name || release.name || CLIENT_RELEASE_FALLBACK_VERSION,
    };
  } catch (err) {
    console.error('[clientRelease] Falling back to static client release:', err);
    return getClientReleaseFallback();
  }
}
