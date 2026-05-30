export const CLIENT_RELEASE_REPO = 'devcodex2025/minebench-mining-benchmark-client';
export const CLIENT_RELEASES_URL = `https://github.com/${CLIENT_RELEASE_REPO}/releases`;
export const CLIENT_RELEASE_FALLBACK_VERSION = 'v0.8.14';

const PRODUCT_NAME = 'MineBench Client';

// Constructs a direct GitHub release asset download URL from the tag and Tauri's filename suffix.
// Tauri v2 naming: "{productName}_{version}_{suffix}" e.g. "MineBench Client_0.8.14_x64-setup.exe"
export const buildDirectDownloadUrl = (tag: string, suffix: string): string => {
    const version = tag.replace(/^v/, '');
    const filename = encodeURIComponent(`${PRODUCT_NAME}_${version}_${suffix}`);
    return `https://github.com/${CLIENT_RELEASE_REPO}/releases/download/${tag}/${filename}`;
};
