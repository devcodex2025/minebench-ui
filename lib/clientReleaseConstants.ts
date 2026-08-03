export const BITBUCKET_WORKSPACE = 'minebenchapp';
export const CLIENT_RELEASE_REPO = 'minebench-client';
export const CLIENT_REPOSITORY_URL = `https://bitbucket.org/${BITBUCKET_WORKSPACE}/${CLIENT_RELEASE_REPO}`;
export const CLIENT_RELEASES_URL = `${CLIENT_REPOSITORY_URL}/downloads/`;

export const CLIENT_RELEASE_FALLBACK_VERSION =
  process.env.NEXT_PUBLIC_CLIENT_RELEASE_FALLBACK_VERSION ||
  process.env.CLIENT_RELEASE_FALLBACK_VERSION ||
  'v0.8.18';

export const getClientReleaseDownloadUrls = (tagName = CLIENT_RELEASE_FALLBACK_VERSION) => {
  const version = tagName.replace(/^v/i, '');
  const downloadUrl = (filename: string) =>
    `https://api.bitbucket.org/2.0/repositories/${BITBUCKET_WORKSPACE}/${CLIENT_RELEASE_REPO}/downloads/${encodeURIComponent(filename)}`;

  return {
    appimage: downloadUrl(`MineBench.Client_${version}_amd64.AppImage`),
    deb: downloadUrl(`MineBench.Client_${version}_amd64.deb`),
    dmg: downloadUrl(`MineBench.Client_${version}_universal.dmg`),
    exe: downloadUrl(`MineBench.Client_${version}_x64-setup.exe`),
    msi: downloadUrl(`MineBench.Client_${version}_x64_en-US.msi`),
    rpm: downloadUrl(`MineBench.Client-${version}-1.x86_64.rpm`),
  };
};
