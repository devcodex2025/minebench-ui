#!/usr/bin/env node
/** Reproducible, content-gated Lighthouse/PSI measurements for MineBench. */
import { execFile, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const execFileAsync = promisify(execFile);

export const DEFAULT_ROUTES = ['/', '/leaderboard', '/downloads', '/guides',
  '/guides/randomx-benchmarking', '/guides/measure-hashrate-per-watt',
  '/guides/mining-profitability-calculator', '/guides/verify-minebench-download',
  '/depin', '/premium', '/whitepaper'];

const usage = () => console.error('Usage: node scripts/measure-performance.mjs [--origin URL] [--routes /,/x] [--profiles mobile,desktop] [--runs 3] [--mode lighthouse|psi] [--output DIR] [--min-score 90]');
export function parseArgs(argv, { ci = Boolean(process.env.BITBUCKET_BUILD_NUMBER) } = {}) {
  const out = { origin: process.env.PERF_ORIGIN || (ci ? 'https://minebench.cloud' : 'http://127.0.0.1:3000'), routes: DEFAULT_ROUTES,
    profiles: ['mobile', 'desktop'], runs: 3, mode: 'lighthouse', output: 'artifacts/performance', minScore: 90 };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i], value = argv[i + 1];
    if (flag === '--origin') out.origin = value;
    else if (flag === '--routes') out.routes = value.split(',').map(x => x.trim()).filter(Boolean);
    else if (flag === '--profiles') out.profiles = value.split(',').map(x => x.trim()).filter(Boolean);
    else if (flag === '--runs') out.runs = Number(value);
    else if (flag === '--mode') out.mode = value;
    else if (flag === '--output') out.output = value;
    else if (flag === '--min-score') out.minScore = Number(value);
    else { usage(); throw new Error(`Unknown option: ${flag}`); }
    i += 1;
  }
  const target = new URL(out.origin);
  if (target.username || target.password || target.pathname !== '/' || target.search || target.hash || (ci && target.href !== 'https://minebench.cloud/')) throw new Error('Invalid measurement origin: CI requires the canonical production origin');
  if (!out.routes.length || !out.routes.every(route => route.startsWith('/') && !route.startsWith('//')) || out.routes.some(route => new URL(route, target).origin !== target.origin) || !out.profiles.length || out.minScore < 0 || out.minScore > 100 || !/^https?:$/.test(new URL(out.origin).protocol) || !out.profiles.every(p => ['mobile', 'desktop'].includes(p)) || !['lighthouse', 'psi'].includes(out.mode) || !Number.isInteger(out.runs) || out.runs < 1 || !Number.isFinite(out.minScore)) throw new Error('Invalid measurement options');
  return out;
}

export function contentPrecheck(html, url, finalUrl = url, status = 200) {
  const h1 = (html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) || []).map(x => x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical/i)?.[1];
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const expected = new URL(url); const canonicalUrl = canonical ? new URL(canonical, url) : null;
  const valid = status === 200 && new URL(finalUrl).origin === expected.origin && new URL(finalUrl).pathname === expected.pathname && canonicalUrl?.origin === 'https://minebench.cloud' && canonicalUrl.pathname === expected.pathname && h1.length === 1 && text.length >= 120 && /minebench/i.test(text);
  return { valid, status, finalUrl, canonical, h1: h1[0] || null, textLength: text.length, reason: valid ? null : 'HTTP/content precheck failed (expected 200, MineBench content, one h1 and canonical)' };
}

async function fetchPage(url) {
  try { const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) }); const html = await response.text(); return contentPrecheck(html, url, response.url, response.status); }
  catch (error) { return { valid: false, status: null, finalUrl: url, reason: `Request failed: ${error.message}` }; }
}

function git(command) { try { return execFileSync('git', command, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }).trim(); } catch { return null; } }
async function buildId() { try { return (await readFile('.next/BUILD_ID', 'utf8')).trim(); } catch { return git(['rev-parse', 'HEAD']) || createHash('sha1').update(new Date().toISOString()).digest('hex'); } }
function runName(route, profile, run) { return `${String(run).padStart(2, '0')}-${profile}-${route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')}`; }
function metric(report, key, fallback = null) { const a = report?.audits?.[key]; return a?.numericValue ?? fallback; }
export function lighthouseReportValid(report, url) {
  const expected = new URL(url);
  const finalUrl = new URL(report.finalDisplayedUrl || report.finalUrl || url);
  const document = report.audits?.['network-requests']?.details?.items?.find(item => item.resourceType === 'Document');
  const statusAudit = report.audits?.['http-status-code'];
  return !report.runtimeError?.code && finalUrl.origin === expected.origin && finalUrl.pathname === expected.pathname && report.requestedUrl === url && document?.statusCode === 200 && (!statusAudit || statusAudit.score === 1) && Number.isFinite(report.categories?.performance?.score);
}

async function lighthouseCommand(url, profile, outputBase) {
  const bin = process.env.LIGHTHOUSE_BIN || 'lighthouse';
  const args = [url, '--only-categories=performance', '--output=json', '--output=html', `--output-path=${outputBase}`, '--quiet', '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage', '--save-assets'];
  if (profile === 'desktop') args.push('--preset=desktop');
  return execFileAsync(bin, args, { encoding: 'utf8', timeout: 300000, maxBuffer: 20 * 1024 * 1024 });
}

async function measureLighthouse(url, profile, jsonPath, htmlPath) {
  try { const base = jsonPath.replace(/\.json$/, ''); await lighthouseCommand(url, profile, base); const report = JSON.parse(await readFile(`${base}.report.json`, 'utf8')); await writeFile(jsonPath, JSON.stringify(report)); const score = (report.categories?.performance?.score ?? 0) * 100; const finalUrl = report.finalDisplayedUrl || report.finalUrl || url; const runtimeError = report.runtimeError?.code; const valid = lighthouseReportValid(report, url); return { valid, score, finalUrl, runtimeError, lcp: metric(report, 'largest-contentful-paint'), tbt: metric(report, 'total-blocking-time'), cls: metric(report, 'cumulative-layout-shift'), ttfb: metric(report, 'server-response-time'), resources: { requests: report.audits?.['network-requests']?.details?.items?.length ?? null, bytes: report.audits?.['total-byte-weight']?.numericValue ?? null }, lighthouseVersion: report.lighthouseVersion, settings: report.configSettings, htmlReport: `${base}.report.html`, jsonReport: `${base}.report.json` }; }
  catch (error) { return { valid: false, score: null, runtimeError: error.message }; }
}

async function measurePsi(url, profile, jsonPath) {
  const key = process.env.PSI_API_KEY ? `&key=${encodeURIComponent(process.env.PSI_API_KEY)}` : '';
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${profile}${key}`;
  let response; let body; try { response = await fetch(endpoint, { signal: AbortSignal.timeout(120000) }); body = await response.text(); } catch (error) { return { valid: false, score: null, runtimeError: `PSI_REQUEST_FAILED: ${error.name}` }; } let report; try { report = JSON.parse(body); } catch { report = {}; }
  await writeFile(jsonPath, body); const errorCode = response.status === 429 ? 'PSI_QUOTA_429' : report.error?.status || null;
  const lh = report.lighthouseResult; const score = (lh?.categories?.performance?.score ?? 0) * 100;
  const finalUrl = lh?.finalDisplayedUrl || lh?.finalUrl || url; const valid = response.ok && !errorCode && Boolean(lh) && lighthouseReportValid(lh, url);
  return { valid, score, finalUrl, runtimeError: errorCode || lh?.runtimeError?.code || null, lcp: metric(lh, 'largest-contentful-paint'), tbt: metric(lh, 'total-blocking-time'), cls: metric(lh, 'cumulative-layout-shift'), ttfb: metric(lh, 'server-response-time'), resources: { requests: lh?.audits?.['network-requests']?.details?.items?.length ?? null, bytes: lh?.audits?.['total-byte-weight']?.numericValue ?? null }, psiStatus: response.status };
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv); const output = join(options.output); await mkdir(output, { recursive: true });
  const started = new Date().toISOString(); const results = []; let invalid = false;
  const version = async name => { try { return JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8')).version; } catch { return null; } };
  const sourceScope = ['app', 'components', 'lib', 'next.config.js', 'styles', 'public'];
  const dirtyDiff = git(['diff', '--binary', '--', ...sourceScope]);
  const untracked = (git(['ls-files', '--others', '--exclude-standard', '--', ...sourceScope]) || '').split('\n').filter(Boolean);
  const untrackedHash = createHash('sha256');
  for (const file of untracked) { untrackedHash.update(file); untrackedHash.update(await readFile(file)); }
  const localBuildId = await buildId();
  const localOrigin = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(options.origin).hostname);
  for (const route of options.routes) for (const profile of options.profiles) for (let run = 1; run <= options.runs; run += 1) {
    const url = new URL(route, options.origin).toString(); const precheck = await fetchPage(url); const id = runName(route, profile, run); const jsonPath = join(output, `${id}.json`); const htmlPath = join(output, `${id}.html`); let measurement = { valid: false, score: null, runtimeError: 'PRECHECK_FAILED' };
    if (precheck.valid) measurement = options.mode === 'psi' ? await measurePsi(url, profile, jsonPath) : await measureLighthouse(url, profile, jsonPath, htmlPath);
    const result = { id, url, route, profile, run, precheck, ...measurement, accepted: Boolean(precheck.valid && measurement.valid && measurement.score >= options.minScore), measuredAt: new Date().toISOString() }; results.push(result); if (!result.accepted) invalid = true;
    await writeFile(join(output, `${id}.result.json`), JSON.stringify(result, null, 2)); console.log(`${result.accepted ? 'PASS' : 'BLOCK'} ${profile} ${route} run=${run} score=${result.score ?? 'n/a'}`);
  }
  const summary = { gitSha: git(['rev-parse', 'HEAD']), sourceScope, trackedDiffHash: dirtyDiff === null ? null : createHash('sha256').update(dirtyDiff).digest('hex'), untrackedSourceHash: untrackedHash.digest('hex'), localBuildId, testedDeploymentId: localOrigin ? localBuildId : process.env.PERF_DEPLOYMENT_ID || null, versions: { node: process.version, next: await version('next'), react: await version('react') }, cacheState: 'uncontrolled; cold/warm server/CDN state not proven', schemaVersion: 1, started, completed: new Date().toISOString(), options, gitDirty: Boolean(git(['status', '--porcelain'])), scenario: 'anonymous', consent: 'not granted', environment: new URL(options.origin).protocol === 'https:' ? 'production-or-preview-https' : 'local-http', results, pass: !invalid };
  await writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2)); return invalid ? 1 : 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().then(code => { process.exitCode = code; }).catch(error => { console.error(error.message); process.exitCode = 2; });
