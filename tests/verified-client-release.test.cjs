const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateKeyPairSync, sign, createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(readFileSync(require.resolve('../lib/verifiedClientRelease.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {}, require: name => name === 'server-only' ? {} : require(name), process: { env: {} }, Buffer, URL, TextDecoder, AbortSignal, fetch, console };
vm.runInNewContext(source, context);
const { createGithubReleaseAdapter } = context.exports;
const selectionKey = generateKeyPairSync('ed25519');
const catalogKey = generateKeyPairSync('ed25519');
const digest = s => createHash('sha256').update(s).digest('hex');
const timestamp = Date.parse('2026-10-19T00:00:00Z');
function fixture(change = () => {}) {
  const repo = 'approved/client'; const version = '1.2.3'; const tag = `v${version}`;
  const url = name => `https://github.com/${repo}/releases/download/${tag}/${name}`;
  const assets = [];
  const add = (os, arch, pkg, suffix) => { const name = `mbc-${version}-stable-${os}-${arch}-${pkg}${suffix}`; assets.push({ name, os, architecture: arch, package: pkg, url: url(name), size: 123, sha256: 'b'.repeat(64) }); return name; };
  for (const [os, arch] of [['windows','x86_64'], ['linux','x86_64'], ['macos','x86_64'], ['macos','aarch64']]) {
    const packages = os === 'windows' ? [['nsis','.exe']] : os === 'linux' ? [['appimage','.AppImage'],['deb','.deb'],['rpm','.rpm']] : [['dmg','.dmg'],['app-tar-gz','.app.tar.gz']];
    for (const [pkg,suffix] of packages) {
      const name = add(os,arch,pkg,suffix);
      if (['nsis','appimage','app-tar-gz'].includes(pkg)) assets.push({ name: `${name}.sig`, os, architecture: arch, package: 'signature', url: url(`${name}.sig`), size: 128, sha256: 'c'.repeat(64) });
    }
    for (const [pkg,suffix] of [['sbom','.json'],['provenance','.json'],['notices','.txt']]) add(os,arch,pkg,suffix);
  }
  for (const name of [`manifest-stable-${version}.json`, `manifest-stable-${version}.json.sig`, `stable-versions-snapshot-${version}.json`, `stable-versions-snapshot-${version}.json.sig`]) assets.push({ name, os:'all', architecture:'all', package:'updater-metadata', url:url(name), size:123, sha256:'e'.repeat(64) });
  const catalog = { schemaVersion: 1, repository: repo, clientVersion: version, channel: 'stable', sourceSha: 'a'.repeat(40), releaseId: 123, tag, publishedAt: new Date(timestamp - 1000).toISOString(), requiredTargets: ['windows-x86_64','linux-x86_64','macos-x86_64','macos-aarch64'], assets };
  const selection = { schemaVersion: 1, repository: repo, channel: 'stable', releaseId: 123, tag, version, sourceSha: catalog.sourceSha, catalogSha256: '', sequence: 10, issuedAt: new Date(timestamp - 1000).toISOString(), expiresAt: new Date(timestamp + 2 * 86400000).toISOString(), revoked: false };
  const release = { id:123, tag_name:tag, html_url:`https://github.com/${repo}/releases/tag/${tag}`, draft:false, prerelease:false, assets:assets.map(a => ({ name:a.name,browser_download_url:a.url,size:a.size,digest:`sha256:${a.sha256}` })).concat(['client-release.json','client-release.json.sig','SHA256SUMS'].map(name => ({ name, browser_download_url:url(name), size:123 }))) };
  change({ catalog, selection, release });
  const catalogRaw = JSON.stringify(catalog); selection.catalogSha256 = digest(catalogRaw);
  const selectionRaw = JSON.stringify(selection);
  const selectionSignature = sign(null,Buffer.from(selectionRaw),selectionKey.privateKey).toString('base64');
  const catalogSignature = sign(null,Buffer.from(catalogRaw),catalogKey.privateKey).toString('base64');
  const env = { CLIENT_RELEASE_GITHUB_REPO:repo, CLIENT_RELEASE_SELECTION_JSON:selectionRaw, CLIENT_RELEASE_SELECTION_SIGNATURE:selectionSignature, CLIENT_RELEASE_SELECTION_PUBLIC_KEY:selectionKey.publicKey.export({ type:'spki',format:'pem' }), CLIENT_RELEASE_CATALOG_PUBLIC_KEY:catalogKey.publicKey.export({ type:'spki',format:'pem' }), CLIENT_RELEASE_SELECTION_MIN_SEQUENCE:'10' };
  const evidence = { selectionRaw, selectionSignature, catalogRaw, catalogSignature, release, tagSourceSha:catalog.sourceSha, verifiedAt:timestamp };
  const fetch = async target => {
    if (target.endsWith('/releases/123')) return Response.json(release);
    if (target.includes('/git/ref/tags/')) return Response.json({ object:{ type:'commit',sha:catalog.sourceSha } });
    if (target.endsWith('client-release.json.sig')) return new Response(catalogSignature);
    if (target.endsWith('client-release.json')) return new Response(catalogRaw);
    throw Error(`Unexpected request: ${target}`);
  };
  return { env, fetch, now:() => timestamp, evidence };
}
test('a complete independently signed catalog selects exact version-specific assets', async () => {
  const f = fixture(); const release = await createGithubReleaseAdapter(f)();
  assert.equal(release.provider,'github'); assert.equal(release.version,'1.2.3'); assert.equal(release.assets.length,28);
  assert.ok(release.assets.every(a => a.browser_download_url.includes('/releases/download/v1.2.3/')));
});
for (const [name,change] of [
  ['draft',({release})=>release.draft=true],
  ['prerelease',({release})=>release.prerelease=true],
  ['wrong source',({selection})=>selection.sourceSha='d'.repeat(40)],
  ['wrong repository',({selection})=>selection.repository='other/client'],
  ['revoked selection',({selection})=>selection.revoked=true],
  ['noncanonical timestamp',({selection})=>selection.issuedAt='2026-10-18 23:59:59Z'],
  ['expired selection',({selection})=>selection.expiresAt=new Date(timestamp-1).toISOString()],
  ['replayed selection',({selection})=>selection.sequence=9],
  ['unknown signed field',({catalog})=>catalog.executionUrl='https://evil.example/x'],
  ['incomplete matrix',({catalog})=>catalog.requiredTargets.pop()],
  ['missing immutable updater metadata',({catalog})=>catalog.assets=catalog.assets.filter(a=>a.package!=='updater-metadata')],
  ['unknown updater metadata',({catalog})=>catalog.assets.find(a=>a.package==='updater-metadata').name='other.json'],
  ['oversized updater metadata',({catalog})=>catalog.assets.find(a=>a.package==='updater-metadata').size=128*1024+1],
  ['wrong architecture',({catalog})=>catalog.assets[0].architecture='arm64'],
  ['missing updater signature',({catalog})=>catalog.assets=catalog.assets.filter(a=>a.package!=='signature')],
  ['wrong asset size',({release})=>release.assets[0].size++],
  ['wrong asset digest',({release})=>release.assets[0].digest='sha256:'+'d'.repeat(64)],
  ['non-GitHub URL',({catalog})=>catalog.assets[0].url='https://evil.example/x.exe'],
  ['unknown inventory asset',({release})=>release.assets.push({name:'surprise.exe',size:42,browser_download_url:'https://github.com/approved/client/releases/download/v1.2.3/surprise.exe'})],
]) test(`rejects ${name}`,async()=> { await assert.rejects(createGithubReleaseAdapter(fixture(change))()); });
test('bad signature is rejected before any GitHub request',async()=> {
  const f=fixture();f.env.CLIENT_RELEASE_SELECTION_SIGNATURE='AAAA';f.fetch=()=>assert.fail('must not fetch');await assert.rejects(createGithubReleaseAdapter(f)());
});
test('catalog tampering and unexpected redirects fail closed',async()=> {
  for(const tamper of ['bytes','redirect']){
    const f=fixture();const request=f.fetch;f.fetch=async url=> url.endsWith('client-release.json') ? tamper==='bytes' ? new Response('{}') : new Response(null,{status:302,headers:{location:'https://127.0.0.1/catalog'}}) : request(url);
    await assert.rejects(createGithubReleaseAdapter(f)());
  }
});
test('cold API failure is unavailable; reviewed durable snapshot is bounded to 24 hours',async()=> {
  const f=fixture();f.fetch=async()=>{throw Error('offline')};await assert.rejects(createGithubReleaseAdapter(f)());
  f.snapshot=async()=>JSON.stringify(f.evidence); f.now=()=>timestamp+6*60000;
  assert.equal((await createGithubReleaseAdapter(f)()).metadataStatus,'fallback');
  f.now=()=>timestamp+86400001;await assert.rejects(createGithubReleaseAdapter(f)());
});
test('known revocation cannot be overridden by a previously valid durable snapshot',async()=> {
  const f=fixture();f.snapshot=async()=>JSON.stringify(f.evidence);f.fetch=async()=>{throw Error('offline')};
  const revoked=JSON.parse(f.env.CLIENT_RELEASE_SELECTION_JSON);revoked.revoked=true;
  f.env.CLIENT_RELEASE_SELECTION_JSON=JSON.stringify(revoked);f.env.CLIENT_RELEASE_SELECTION_SIGNATURE=sign(null,Buffer.from(f.env.CLIENT_RELEASE_SELECTION_JSON),selectionKey.privateKey).toString('base64');
  await assert.rejects(createGithubReleaseAdapter(f)());
});

test('malformed anti-replay floors fail closed before fetching',async()=> {
  for(const floor of ['NaN','garbage','0','-1','1.5','9007199254740992']) {
    const f=fixture();f.env.CLIENT_RELEASE_SELECTION_MIN_SEQUENCE=floor;f.fetch=()=>assert.fail('must not fetch');await assert.rejects(createGithubReleaseAdapter(f)());
  }
});
