export const CLIENT_RELEASE_REPO = 'minebenchapp/minebench-client';
export const CLIENT_RELEASES_URL = `https://bitbucket.org/${CLIENT_RELEASE_REPO}/downloads/`;
export const CLIENT_RELEASES_API_URL = `https://api.bitbucket.org/2.0/repositories/${CLIENT_RELEASE_REPO}/downloads`;
export const CLIENT_RELEASE_GITHUB_REPO = process.env.CLIENT_RELEASE_GITHUB_REPO || CLIENT_RELEASE_REPO;
export const CLIENT_RELEASE_GITHUB_API_URL = `https://api.github.com/repos/${CLIENT_RELEASE_GITHUB_REPO}`;
export const CLIENT_RELEASE_GITHUB_ENABLED = process.env.CLIENT_RELEASE_GITHUB_ENABLED === 'true';
export const CLIENT_RELEASE_CACHE_MAX_AGE_MS = 5 * 60 * 1000;
export const CLIENT_RELEASE_API_TIMEOUT_MS = 5000;
export const CLIENT_RELEASE_MAX_STALE_MS = 24 * 60 * 60 * 1000;
