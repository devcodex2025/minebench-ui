import {
  BITBUCKET_WORKSPACE,
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
} from './clientReleaseConstants';

export {
  BITBUCKET_WORKSPACE,
  CLIENT_RELEASE_FALLBACK_VERSION,
  CLIENT_RELEASE_REPO,
  CLIENT_RELEASES_URL,
  getClientReleaseDownloadUrls,
};

export type Release = {
  url?: string;
  html_url?: string;
  name: string | null;
  tag_name: string;
  version?: string;
  assets?: any[];
};

type BitbucketTag = {
  name: string;
  links?: { html?: { href?: string } };
};

type BitbucketDownload = {
  name: string;
  links?: { self?: { href?: string } };
};

const bitbucketHeaders = (): Record<string, string> => {
  const accessToken = process.env.BITBUCKET_ACCESS_TOKEN;
  const apiToken = process.env.BITBUCKET_API_TOKEN;
  const email = process.env.BITBUCKET_ACCOUNT_EMAIL;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'MineBench-UI',
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (apiToken && email) {
    headers.Authorization = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
  }

  return headers;
};

const fetchBitbucket = async (url: string): Promise<Response> => {
  const headers = bitbucketHeaders();
  let response = await fetch(url, { headers, cache: 'no-store' });

  if ((response.status === 401 || response.status === 403) && headers.Authorization) {
    const { Authorization: _authorization, ...publicHeaders } = headers;
    response = await fetch(url, { headers: publicHeaders, cache: 'no-store' });
  }

  return response;
};

export async function getLatestBitbucketRelease(repoSlug: string): Promise<Release> {
  const apiBase = `https://api.bitbucket.org/2.0/repositories/${BITBUCKET_WORKSPACE}/${repoSlug}`;
  const [tagsResponse, downloadsResponse] = await Promise.all([
    fetchBitbucket(`${apiBase}/refs/tags?sort=-target.date&pagelen=1`),
    fetchBitbucket(`${apiBase}/downloads?sort=-created_on&pagelen=100`),
  ]);

  if (!tagsResponse.ok) {
    throw new Error(`Bitbucket tags fetch failed for ${repoSlug}: ${tagsResponse.status}`);
  }

  const tags = await tagsResponse.json() as { values?: BitbucketTag[] };
  const tag = tags.values?.[0];
  if (!tag?.name) {
    throw new Error(`No release tag found for ${repoSlug}`);
  }

  const downloads = downloadsResponse.ok
    ? await downloadsResponse.json() as { values?: BitbucketDownload[] }
    : { values: [] };
  const version = tag.name.replace(/^v/i, '');
  const allAssets = (downloads.values || []).map((download) => ({
    name: download.name,
    browser_download_url:
      download.links?.self?.href || `${apiBase}/downloads/${encodeURIComponent(download.name)}`,
  }));
  const versionAssets = allAssets.filter((asset) => asset.name.includes(version));

  return {
    html_url: `https://bitbucket.org/${BITBUCKET_WORKSPACE}/${repoSlug}/downloads/`,
    name: tag.name,
    tag_name: tag.name,
    version: tag.name,
    assets: versionAssets.length > 0 ? versionAssets : allAssets,
  };
}

const createFallbackClientRelease = (): Release => {
  const tagName = CLIENT_RELEASE_FALLBACK_VERSION;
  const urls = getClientReleaseDownloadUrls(tagName);

  return {
    html_url: CLIENT_RELEASES_URL,
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

export async function getLatestClientRelease(): Promise<Release> {
  try {
    return await getLatestBitbucketRelease(CLIENT_RELEASE_REPO);
  } catch (err) {
    console.error('[clientRelease] Latest client release unavailable:', err);
    return createFallbackClientRelease();
  }
}
