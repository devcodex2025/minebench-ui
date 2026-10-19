# MineBench Client release catalog contract

GitHub selection remains opt-in through server-only `CLIENT_RELEASE_GITHUB_ENABLED=true`.
Activation requires the canonical `CLIENT_RELEASE_GITHUB_REPO`, approved public
assets, complete signed release evidence, and the shared updater selection.
The legacy provider stays selected until cutover is approved.

## Trust scopes

Use distinct Ed25519 public keys in `CLIENT_RELEASE_SELECTION_PUBLIC_KEY` and
`CLIENT_RELEASE_CATALOG_PUBLIC_KEY` (PEM SPKI). Sign the exact UTF-8 JSON bytes;
provide detached base64 signatures, without a JSON reserialization step.
These scopes are separate from the existing Tauri updater minisign key and
from the runtime engine registry minisign key. Never send private keys or
provider credentials to the website, browser, or installed client.

## Stable selection

`CLIENT_RELEASE_SELECTION_JSON` contains exactly `schemaVersion:1`, `repository`,
`channel:"stable"`, positive integer `releaseId`, `tag`, three-part `version`,
40-character lowercase `sourceSha`, 64-character lowercase `catalogSha256`,
positive integer `sequence`, ISO `issuedAt`/`expiresAt`, and boolean `revoked`.
`CLIENT_RELEASE_SELECTION_SIGNATURE` authenticates those exact bytes.
`CLIENT_RELEASE_SELECTION_MIN_SEQUENCE` must be a positive safe integer and is
maintained in protected deployment configuration from the external release ledger.
Reject future, expired, replayed, revoked, or mismatching selections before any
cache lookup. This server deployment snapshot must contain the same approved
signed selection as the updater facade. Live facade integration and operational
sequence-floor advancement must be verified before activation.

## Client catalog

`client-release.json` contains exactly `schemaVersion:1`, `repository`,
`clientVersion`, `channel`, `sourceSha`, `releaseId`, `tag`, `publishedAt`,
`requiredTargets`, and `assets`. Its detached signature is
`client-release.json.sig`. The required target set is exactly:

- `windows-x86_64`
- `linux-x86_64`
- `macos-x86_64`
- `macos-aarch64`

Every asset declares `name`, `os`, `architecture`, `package`, `url`, positive
integer `size`, and lowercase `sha256`. Supported package values are `nsis`,
`appimage`, `deb`, `rpm`, `dmg`, `app-tar-gz`, `signature`, `sbom`, `provenance`,
and `notices`. Each target needs its installer/update package(s), detached
updater signature, SBOM, provenance, and notices. Linux requires all three
installer formats. macOS requires separate native DMG and updater archives.
The catalog excludes itself, its signature, and SHA256SUMS from its own
inventory. Those three metadata assets are also required in the Release.
The catalog also contains exactly four immutable updater documents as
`all` / `all` / `updater-metadata`: `manifest-stable-<version>.json`, its `.sig`,
`stable-versions-snapshot-<version>.json`, and its `.sig`. These metadata entries
are capped at 128 KiB each and cannot become public package download buttons.
Unlisted release assets, duplicate names, missing targets/signatures, and
mismatching names, sizes, URLs, or API digests fail closed.

Only exact `https://github.com/<repository>/releases/download/<tag>/<name>`
links are accepted. The adapter verifies the exact release ID and peeled tag
commit SHA; it never selects GitHub latest or an arbitrary filename version.
Request-time checks use signed metadata and the API inventory. The external
release qualification must verify final package bytes, OS signatures, notices,
and extracted package contents before signing and promoting the catalog.

## Verified fallback

Fresh in-memory metadata lasts at most five minutes. Each network request has
a five-second timeout; bodies and redirect counts are bounded. Catalog redirects
are limited to GitHub and its release asset CDN. A GitHub failure can use a
reviewed server-local `CLIENT_RELEASE_VERIFIED_SNAPSHOT_PATH`. The file contains
`selectionRaw`, `selectionSignature`, `catalogRaw`, `catalogSignature`, the API
`release` inventory, `tagSourceSha`, and `verifiedAt` (epoch milliseconds).
The deployment owner creates the snapshot after qualification; request handlers
do not write it. Maximum size is 1 MiB.

Every fallback verifies both signatures and the full inventory again, matches
the currently configured signed selection exactly, and expires after 24 hours
or signed selection expiry, whichever comes first. A known revocation always
wins over a snapshot. With no safe fallback, `/api/releases` returns HTTP 503
with `{cpu:null,gpu:null,client:null,metadataStatus:"unavailable"}`. The Downloads
page and its metadata remain renderable. Durable snapshot provisioning and
facade selection synchronization remain activation gates.
If client-side revalidation becomes unavailable, the page clears initial GitHub
links instead of retaining a possibly withdrawn release. A verified bounded
server fallback remains a successful API response; legacy provider behavior is
preserved.

The server-rendered Downloads layout retains its initial immutable release labels.
One small client provider revalidates the catalog on mount. If the selected
version, source SHA, release ID, or catalog digest changes, it removes the old
links and asks for a page refresh; it never places new bytes behind old labels.
The public page and Pages API share the same release helper. React cache
deduplicates lookups within a server-rendering request, not across API requests.
