/**
 * Shared client for GitHub REST API release lookups.
 *
 * Consolidates the request logic that previously lived (and drifted) in both
 * `lib/clientRelease.ts` and `pages/api/releases.ts`. Centralizing it fixes a
 * real bug: the CPU/GPU release route was omitting the `User-Agent` header,
 * which the GitHub REST API requires — requests without it are rejected with
 * `403 Forbidden` regardless of authentication, so those lookups silently
 * failed and the downloads page fell back to `null`.
 *
 * See: https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api#user-agent-requirement
 */

export const GITHUB_USER_AGENT = 'MineBench-UI';

export type GithubFetchResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

const buildHeaders = (): Record<string, string> => {
  const token = process.env.GITHUB_SERVER_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    // Required by the GitHub REST API for every request; omitting it yields 403.
    'User-Agent': GITHUB_USER_AGENT,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Fetch a GitHub REST endpoint with the required headers.
 *
 * When a server token is present but rejected (401/403 — e.g. expired or
 * scoped to a different repo), the request is retried once anonymously so a
 * bad token never takes down an otherwise-public lookup.
 */
export async function fetchGithub(url: string): Promise<Response> {
  const headers = buildHeaders();
  let response = await fetch(url, { headers, cache: 'no-store' });

  if ((response.status === 401 || response.status === 403) && headers.Authorization) {
    const { Authorization: _authorization, ...publicHeaders } = headers;
    response = await fetch(url, { headers: publicHeaders, cache: 'no-store' });
  }

  return response;
}

/**
 * Fetch a GitHub REST endpoint and parse the JSON body.
 *
 * Returns a structured result rather than throwing so callers can decide how
 * to degrade (fall back, return null, propagate). `data` is `null` whenever
 * the response is not OK or the body is not valid JSON.
 */
export async function fetchGithubJson<T = unknown>(url: string): Promise<GithubFetchResult<T>> {
  const response = await fetchGithub(url);

  if (!response.ok) {
    return { ok: false, status: response.status, data: null };
  }

  try {
    const data = (await response.json()) as T;
    return { ok: true, status: response.status, data };
  } catch {
    return { ok: false, status: response.status, data: null };
  }
}
