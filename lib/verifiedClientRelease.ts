import 'server-only';
import { createHash, createPublicKey, verify } from 'node:crypto';

const FRESH = 5 * 60 * 1000;
const STALE = 24 * 60 * 60 * 1000;
const REQUIRED = ['windows-x86_64', 'linux-x86_64', 'macos-x86_64', 'macos-aarch64'];
const MAX_JSON = 512 * 1024;
type Json = Record<string, any>;
type Evidence = { selectionRaw: string; selectionSignature: string; catalogRaw: string; catalogSignature: string; release: Json; tagSourceSha: string; verifiedAt: number };
type Dependencies = { env: NodeJS.ProcessEnv; fetch: typeof fetch; now?: () => number; snapshot?: () => Promise<string> };

function object(value: any, keys: string[]): asserts value is Json {
  if (!value || Array.isArray(value) || typeof value !== 'object' || Object.keys(value).some(k => !keys.includes(k))) throw new Error('Invalid signed metadata schema');
}
const hex = (s: any, n: number) => typeof s === 'string' && new RegExp(`^[a-f0-9]{${n}}$`).test(s);
const sha = (s: string) => createHash('sha256').update(s).digest('hex');
const integer = (n: any) => Number.isSafeInteger(n) && n > 0;
const time = (s: any) => {
  if (typeof s !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(s)) return NaN;
  const ms = Date.parse(s);
  return Number.isFinite(ms) && new Date(ms).toISOString() === (s.length === 20 ? s.slice(0, -1) + '.000Z' : s) ? ms : NaN;
};
function signed(raw: string, signature: string, pem: string | undefined) {
  if (!pem || typeof raw !== 'string' || Buffer.byteLength(raw) > 128 * 1024 || typeof signature !== 'string' || signature.length > 256) throw new Error('Signed release metadata is not configured');
  const key = createPublicKey(pem);
  if (key.asymmetricKeyType !== 'ed25519' || !verify(null, Buffer.from(raw), key, Buffer.from(signature, 'base64'))) throw new Error('Release signature rejected');
  return JSON.parse(raw);
}
function repository(env: NodeJS.ProcessEnv) {
  const repo = env.CLIENT_RELEASE_GITHUB_REPO;
  if (!repo || !/^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repo)) throw new Error('Canonical GitHub repository is not configured');
  return repo;
}
function selection(raw: string, sig: string, env: NodeJS.ProcessEnv, now: number) {
  const floor = Number(env.CLIENT_RELEASE_SELECTION_MIN_SEQUENCE || 1);
  if (!integer(floor)) throw new Error('Invalid release sequence floor');
  const s = signed(raw, sig, env.CLIENT_RELEASE_SELECTION_PUBLIC_KEY);
  object(s, ['schemaVersion', 'repository', 'channel', 'releaseId', 'tag', 'version', 'sourceSha', 'catalogSha256', 'sequence', 'issuedAt', 'expiresAt', 'revoked']);
  if (s.schemaVersion !== 1 || s.repository !== repository(env) || s.channel !== 'stable' || !integer(s.releaseId) || !integer(s.sequence)
    || !/^\d+\.\d+\.\d+$/.test(s.version) || s.tag !== `v${s.version}` || !hex(s.sourceSha, 40) || !hex(s.catalogSha256, 64)
    || typeof s.revoked !== 'boolean' || s.revoked || !Number.isFinite(time(s.issuedAt)) || !Number.isFinite(time(s.expiresAt))
    || time(s.issuedAt) > now || time(s.expiresAt) <= now || time(s.expiresAt) <= time(s.issuedAt) || time(s.expiresAt) - time(s.issuedAt) > 7 * STALE
    || s.sequence < floor) throw new Error('Release selection is invalid, stale, or revoked');
  return s;
}
const assetUrl = (repo: string, tag: string, name: string) => `https://github.com/${repo}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(name)}`;

function validate(e: Evidence, env: NodeJS.ProcessEnv, now: number) {
  const s = selection(e.selectionRaw, e.selectionSignature, env, now);
  if (e.selectionRaw !== env.CLIENT_RELEASE_SELECTION_JSON || e.selectionSignature !== env.CLIENT_RELEASE_SELECTION_SIGNATURE
    || !Number.isFinite(e.verifiedAt) || e.verifiedAt > now || now - e.verifiedAt > STALE) throw new Error('Cached release selection is no longer current');
  if (sha(e.catalogRaw) !== s.catalogSha256) throw new Error('Release catalog digest mismatch');
  const c = signed(e.catalogRaw, e.catalogSignature, env.CLIENT_RELEASE_CATALOG_PUBLIC_KEY);
  object(c, ['schemaVersion', 'repository', 'clientVersion', 'channel', 'sourceSha', 'releaseId', 'tag', 'publishedAt', 'requiredTargets', 'assets']);
  const r = e.release;
  if (c.schemaVersion !== 1 || c.repository !== s.repository || c.clientVersion !== s.version || c.channel !== 'stable' || c.sourceSha !== s.sourceSha
    || c.releaseId !== s.releaseId || c.tag !== s.tag || !Number.isFinite(time(c.publishedAt)) || time(c.publishedAt) > now
    || r.id !== s.releaseId || r.tag_name !== s.tag || r.draft !== false || r.prerelease !== false || e.tagSourceSha !== s.sourceSha
    || r.html_url !== `https://github.com/${s.repository}/releases/tag/${encodeURIComponent(s.tag)}`
    || !Array.isArray(c.requiredTargets) || c.requiredTargets.length !== REQUIRED.length
    || new Set(c.requiredTargets).size !== REQUIRED.length || REQUIRED.some(t => !c.requiredTargets.includes(t))
    || !Array.isArray(c.assets) || c.assets.length < 1 || c.assets.length > 64 || !Array.isArray(r.assets) || r.assets.length > 100) throw new Error('Release identity or target matrix mismatch');
  const inventory = new Map<string, Json>();
  for (const a of r.assets) {
    if (!a || typeof a.name !== 'string' || inventory.has(a.name) || !integer(a.size) || a.browser_download_url !== assetUrl(s.repository, s.tag, a.name)) throw new Error('Invalid GitHub release inventory');
    inventory.set(a.name, a);
  }
  for (const name of ['client-release.json', 'client-release.json.sig', 'SHA256SUMS']) if (!inventory.has(name)) throw new Error('Required signed release metadata is missing');
  const metadataNames = [`manifest-stable-${s.version}.json`, `manifest-stable-${s.version}.json.sig`, `stable-versions-snapshot-${s.version}.json`, `stable-versions-snapshot-${s.version}.json.sig`];
  const names = new Set<string>();
  const suffixes: Record<string, string> = { nsis: '.exe', appimage: '.AppImage', deb: '.deb', rpm: '.rpm', dmg: '.dmg', 'app-tar-gz': '.app.tar.gz', signature: '.sig', sbom: '.json', provenance: '.json', notices: '.txt' };
  const assets = c.assets.map((a: Json) => {
    object(a, ['name', 'os', 'architecture', 'package', 'url', 'size', 'sha256']);
    const published = inventory.get(a.name);
    const metadata = a.package === 'updater-metadata';
    const targetValid = metadata
      ? a.os === 'all' && a.architecture === 'all' && metadataNames.includes(a.name) && a.size <= (a.name.endsWith('.sig') ? 16384 : 128 * 1024)
      : REQUIRED.includes(`${a.os}-${a.architecture}`) && suffixes[a.package] && a.name.endsWith(suffixes[a.package]);
    if (typeof a.name !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(a.name) || names.has(a.name) || !hex(a.sha256, 64) || !integer(a.size)
      || !targetValid
      || !published || a.url !== assetUrl(s.repository, s.tag, a.name) || a.url !== published.browser_download_url || a.size !== published.size
      || (published.digest && published.digest !== `sha256:${a.sha256}`)) throw new Error('Release asset mismatch');
    names.add(a.name);
    return { name: a.name as string, browser_download_url: a.url as string, platform: a.os as string, architecture: a.architecture as string, package: a.package as string, sha256: a.sha256 as string, size: a.size as number };
  });
  if (metadataNames.some(name => !assets.some((a: Json) => a.name === name && a.package === 'updater-metadata'))) throw new Error('Missing immutable updater metadata');
  for (const target of REQUIRED) {
    const packages = target.startsWith('windows') ? ['nsis'] : target.startsWith('linux') ? ['appimage', 'deb', 'rpm'] : ['dmg', 'app-tar-gz'];
    for (const pkg of [...packages, 'sbom', 'provenance', 'notices']) {
      if (assets.filter((a: Json) => `${a.platform}-${a.architecture}` === target && a.package === pkg).length !== 1) throw new Error('Incomplete required release artifacts');
    }
    const updater = assets.find((a: Json) => `${a.platform}-${a.architecture}` === target && a.package === (target.startsWith('windows') ? 'nsis' : target.startsWith('linux') ? 'appimage' : 'app-tar-gz'))!;
    if (!assets.some((a: Json) => a.name === `${updater.name}.sig` && a.package === 'signature' && `${a.platform}-${a.architecture}` === target)) throw new Error('Missing updater signature');
  }
  if (r.assets.some((a: Json) => !names.has(a.name) && !['client-release.json', 'client-release.json.sig', 'SHA256SUMS'].includes(a.name))) throw new Error('Unexpected release asset');
  return { metadataStatus: 'live' as 'live' | 'fallback', freshness: 'live' as 'live' | 'fallback', provider: 'github' as const, releaseId: s.releaseId, sourceSha: s.sourceSha, catalogDigest: s.catalogSha256, html_url: r.html_url as string, name: s.tag as string, tag_name: s.tag as string, version: s.version as string, assets };
}

async function textBody(response: Response, limit: number) {
  const length = response.headers.get('content-length');
  if (length && Number(length) > limit) throw new Error('Release metadata is too large');
  if (!response.body) throw new Error('Empty release metadata response');
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length;
      if (size > limit) throw new Error('Release metadata is too large'); chunks.push(item.value); }
  } finally { await reader.cancel(); }
  return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
}

export function createGithubReleaseAdapter(d: Dependencies) {
  let cached: Evidence | undefined;
  let pending: Promise<ReturnType<typeof validate>> | undefined;
  const now = d.now || Date.now;
  async function request(url: string, limit = MAX_JSON, asset = false) {
    for (let hop = 0; hop <= 3; hop++) {
      const u = new URL(url);
      if (u.protocol !== 'https:' || u.username || u.password || u.port || u.hash
        || !(asset ? ['github.com', 'release-assets.githubusercontent.com'].includes(u.hostname) : u.hostname === 'api.github.com')) throw new Error('Untrusted release metadata destination');
      const response = await d.fetch(url, { cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(5000), headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'MineBench-UI' } });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location'); if (!asset || !location || hop === 3) throw new Error('Unapproved release metadata redirect');
        url = new URL(location, url).href; continue;
      }
      if (!response.ok) throw new Error('Release metadata is unavailable');
      return textBody(response, limit);
    }
    throw new Error('Release metadata redirect limit exceeded');
  }
  async function live() {
    const raw = d.env.CLIENT_RELEASE_SELECTION_JSON || ''; const detached = d.env.CLIENT_RELEASE_SELECTION_SIGNATURE || '';
    const s = selection(raw, detached, d.env, now());
    const api = `https://api.github.com/repos/${s.repository}`;
    const release = JSON.parse(await request(`${api}/releases/${s.releaseId}`));
    let ref = JSON.parse(await request(`${api}/git/ref/tags/${encodeURIComponent(s.tag)}`)).object;
    for (let n = 0; ref?.type === 'tag' && n < 2; n++) {
      if (!hex(ref.sha, 40)) throw new Error('Invalid annotated tag');
      ref = JSON.parse(await request(`${api}/git/tags/${ref.sha}`)).object;
    }
    if (ref?.type !== 'commit' || ref.sha !== s.sourceSha) throw new Error('Tag does not identify the approved source SHA');
    const catalogRaw = await request(assetUrl(s.repository, s.tag, 'client-release.json'), 128 * 1024, true);
    const catalogSignature = (await request(assetUrl(s.repository, s.tag, 'client-release.json.sig'), 256, true)).trim();
    const evidence: Evidence = { selectionRaw: raw, selectionSignature: detached, catalogRaw, catalogSignature, release, tagSourceSha: ref.sha, verifiedAt: now() };
    const result = validate(evidence, d.env, now()); cached = evidence; return result;
  }
  return async function get() {
    // Always authenticate current selection, including revocation, before any cache lookup.
    selection(d.env.CLIENT_RELEASE_SELECTION_JSON || '', d.env.CLIENT_RELEASE_SELECTION_SIGNATURE || '', d.env, now());
    if (cached && now() - cached.verifiedAt < FRESH) return validate(cached, d.env, now());
    if (pending) return pending;
    pending = (async () => {
      try { return await live(); }
      catch {
        let evidence = cached;
        if (!evidence && d.snapshot) {
          const raw = await d.snapshot(); if (Buffer.byteLength(raw) > 1024 * 1024) throw new Error('Release snapshot exceeds its limit');
          evidence = JSON.parse(raw) as Evidence;
        }
        if (!evidence) throw new Error('No verified client release is available');
        const result = validate(evidence, d.env, now()); return { ...result, metadataStatus: 'fallback' as const, freshness: 'fallback' as const };
      }
    })();
    try { return await pending; } finally { pending = undefined; }
  };
}

const getRelease = createGithubReleaseAdapter({ env: process.env, fetch: (...args) => fetch(...args), snapshot: async () => {
  const path = process.env.CLIENT_RELEASE_VERIFIED_SNAPSHOT_PATH;
  if (!path) throw new Error('Verified release snapshot is not configured');
  // The deployment owner supplies this reviewed snapshot; request handlers never write it.
  const file = await import('node:fs/promises').then(fs => fs.open(path, 'r'));
  try { if ((await file.stat()).size > 1024 * 1024) throw new Error('Release snapshot exceeds its limit'); return await file.readFile('utf8'); } finally { await file.close(); }
} });
export const getVerifiedGithubClientRelease = () => getRelease();
