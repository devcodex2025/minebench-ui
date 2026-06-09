export const CLIENT_RELEASE_REPO = 'devcodex2025/minebench-mining-benchmark-client';
export const CLIENT_RELEASES_URL = `https://github.com/${CLIENT_RELEASE_REPO}/releases`;
export const CLIENT_RELEASE_FALLBACK_VERSION = 'v0.8.15';

export function getDirectDownloadUrls(tagName: string) {
    const v = tagName.replace(/^v/, '');
    const base = `https://github.com/${CLIENT_RELEASE_REPO}/releases/download/${tagName}`;
    return {
        exe:      `${base}/MineBench.Client_${v}_x64-setup.exe`,
        msi:      `${base}/MineBench.Client_${v}_x64_en-US.msi`,
        dmg:      `${base}/MineBench.Client_${v}_universal.dmg`,
        appimage: `${base}/MineBench.Client_${v}_amd64.AppImage`,
        deb:      `${base}/MineBench.Client_${v}_amd64.deb`,
        rpm:      `${base}/MineBench.Client-${v}-1.x86_64.rpm`,
    };
}
