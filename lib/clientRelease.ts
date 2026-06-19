import {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
} from './clientReleaseConstants';

export {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
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
    'User-Agent': 'MineBench-UI',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const createFallbackClientRelease = (): GithubRelease => {
  const tagName = CLIENT_RELEASE_FALLBACK_VERSION;
  const urls = getClientReleaseDownloadUrls(tagName);

  return {
    html_url: `${CLIENT_RELEASES_URL}/tag/${tagName}`,
    name: tagName,
    tag_name: tagName,
    version: tagName,
    assets: [
      { name: `MineBench.Client-${tagName.replace(/^v/i, '')}-1.x86_64.rpm`, browser_download_url: urls.rpm },
      { name: `MineBench.Client_${tagName.replace(/^v/i, '')}_amd64.AppImage`, browser_download_url: urls.appimage },
      { name: `MineBench.Client_${tagName.replace(/^v/i, '')}_amd64.deb`, browser_download_url: urls.deb },
      { name: `MineBench.Client_${tagName.replace(/^v/i, '')}_universal.dmg`, browser_download_url: urls.dmg },
      { name: `MineBench.Client_${tagName.replace(/^v/i, '')}_x64-setup.exe`, browser_download_url: urls.exe },
      { name: `MineBench.Client_${tagName.replace(/^v/i, '')}_x64_en-US.msi`, browser_download_url: urls.msi },
    ],
  };
};

export async function getLatestClientRelease(): Promise<GithubRelease> {
  try {
    const url = `https://api.github.com/repos/${CLIENT_RELEASE_REPO}/releases/latest`;
    const headers = githubHeaders();
    let response = await fetch(url, { headers, cache: 'no-store' });

    if ((response.status === 401 || response.status === 403) && headers.Authorization) {
      const { Authorization: _authorization, ...publicHeaders } = headers;
      response = await fetch(url, { headers: publicHeaders, cache: 'no-store' });
    }

    if (!response.ok) {
      throw new Error(`Client release fetch failed: ${response.status}`);
    }

    const release = await response.json();
    return {
      ...release,
      version: release.tag_name || release.name,
    };
  } catch (err) {
    console.error('[clientRelease] Latest client release unavailable:', err);
    return createFallbackClientRelease();
  }
}
