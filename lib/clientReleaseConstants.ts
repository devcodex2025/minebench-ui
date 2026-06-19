export const CLIENT_RELEASE_REPO = 'devcodex2025/minebench-mining-benchmark-client';
export const CLIENT_RELEASES_URL = `https://github.com/${CLIENT_RELEASE_REPO}/releases`;

export const CLIENT_RELEASE_FALLBACK_VERSION =
  process.env.NEXT_PUBLIC_CLIENT_RELEASE_FALLBACK_VERSION ||
  process.env.CLIENT_RELEASE_FALLBACK_VERSION ||
  'v0.8.18';

export const getClientReleaseDownloadUrls = (tagName = CLIENT_RELEASE_FALLBACK_VERSION) => {
  const version = tagName.replace(/^v/i, '');
  const baseUrl = `${CLIENT_RELEASES_URL}/download/${tagName}`;

  return {
    appimage: `${baseUrl}/MineBench.Client_${version}_amd64.AppImage`,
    deb: `${baseUrl}/MineBench.Client_${version}_amd64.deb`,
    dmg: `${baseUrl}/MineBench.Client_${version}_universal.dmg`,
    exe: `${baseUrl}/MineBench.Client_${version}_x64-setup.exe`,
    msi: `${baseUrl}/MineBench.Client_${version}_x64_en-US.msi`,
    rpm: `${baseUrl}/MineBench.Client-${version}-1.x86_64.rpm`,
  };
};
