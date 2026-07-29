import {
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
} from './clientReleaseConstants';
import { fetchGithub } from './github';

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
    const response = await fetchGithub(url);

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
