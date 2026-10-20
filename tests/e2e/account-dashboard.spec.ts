import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

async function signInAs(page: import('@playwright/test').Page, token = 'account-test-token', origin = 'https://localhost:3443') {
  await page.context().addCookies([{
    name: '__Host-minebench-account', value: token, url: origin,
    httpOnly: true, secure: true, sameSite: 'Strict'
  }]);
}

test.beforeEach(async ({ context }, testInfo) => {
  await context.route('**/*', async route => {
    if (new URL(route.request().url()).origin === 'https://localhost:3443') return route.continue();
    testInfo.annotations.push({ type: 'unexpected-external-request', description: new URL(route.request().url()).origin });
    await route.abort('blockedbyclient');
  });
});

test.afterEach(async ({}, testInfo) => {
  expect(testInfo.annotations.filter(item => item.type === 'unexpected-external-request')).toEqual([]);
});

async function serveProductionHostFixture(page: import('@playwright/test').Page, authenticated = false) {
  // Only the browser sees the production hostname; every response comes from the local fixture.
  await page.context().route('https://minebench.cloud/**', async route => {
    const url = new URL(route.request().url());
    const headers: Record<string, string> = { ...await route.request().allHeaders(), host: 'localhost:3443' };
    if (authenticated) {
      // Model cookie transport only at this proxy boundary; local-origin tests use real browser transport.
      const sessions = (await page.context().cookies('https://minebench.cloud'))
        .filter(cookie => cookie.name === '__Host-minebench-account');
      expect(sessions).toHaveLength(1);
      expect(sessions[0]).toMatchObject({ name: '__Host-minebench-account', value: 'account-test-token',
        domain: 'minebench.cloud', path: '/', secure: true, httpOnly: true, sameSite: 'Strict' });
      headers.cookie = `${sessions[0].name}=${sessions[0].value}`;
    }
    const response = await route.fetch({
      url: `https://localhost:3443${url.pathname}${url.search}`,
      headers,
      maxRedirects: 0
    });
    if (response.status() >= 300 && response.status() < 400) {
      await route.abort('blockedbyclient');
      throw new Error('Production-host fixtures must not follow redirects outside local routing');
    }
    await route.fulfill({ response });
  });
  await page.context().route(/^https:\/\/(?:www\.)?(?:googletagmanager|google-analytics)\.com\//, route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* inert analytics fixture */' }));
}

test('private account redirects unauthenticated visitors to sign in', async ({ page }) => {
  const response = await page.goto('/account');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/account\/login$/);
  await expect(page.getByRole('heading', { name: 'Your mining, in one place' })).toBeVisible();
  await expect(page.getByText(/Direct and Premium XMR miners can create an account with a passkey/i)).toBeVisible();
});

test('account routes issue a fresh private CSP nonce and never request analytics', async ({ page }) => {
  const analyticsRequests: string[] = [];
  page.on('request', request => {
    if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
  });
  await page.addInitScript(() => localStorage.setItem('minebench:analytics-consent', 'granted'));
  const first = await page.goto('/account/login');
  const second = await page.goto('/account/login?source=private');
  const nonce = (response: typeof first) => {
    const policy = response?.headers()['content-security-policy'] || '';
    return policy.match(/script-src[^;]*'nonce-([^']+)'/)?.[1];
  };
  expect(nonce(first)).toBeTruthy();
  expect(nonce(second)).toBeTruthy();
  expect(nonce(first)).not.toBe(nonce(second));
  expect(analyticsRequests).toEqual([]);
});

test('public-to-account navigation reloads without retaining public analytics scripts', async ({ page }) => {
  await serveProductionHostFixture(page);
  const analyticsRequests: string[] = [];
  const accountDocumentRequests: string[] = [];
  page.on('request', request => {
    if (/google-analytics|googletagmanager/.test(request.url())) analyticsRequests.push(request.url());
    if (request.isNavigationRequest() && new URL(request.url()).pathname === '/account/login') {
      accountDocumentRequests.push(request.url());
    }
  });
  await page.addInitScript(() => localStorage.setItem('minebench:analytics-consent', 'granted'));
  await page.goto('https://minebench.cloud/');
  await expect.poll(() => analyticsRequests.length).toBeGreaterThan(0);
  await page.waitForLoadState('networkidle');
  const publicScriptLoads = analyticsRequests.filter(url => url.includes('/gtag/js')).length;
  await page.evaluate(() => {
    const link = document.createElement('a');
    link.id = 'account-navigation-test';
    // The unauthenticated /account redirect is tested separately on the local origin.
    link.href = '/account/login';
    link.textContent = 'Open account';
    document.body.appendChild(link);
  });
  await Promise.all([
    page.waitForURL(/\/account\/login$/),
    page.locator('#account-navigation-test').click(),
  ]);
  expect(accountDocumentRequests).toHaveLength(1);
  expect(await page.locator('#google-analytics-loader, #google-analytics').count()).toBe(0);
  expect(analyticsRequests.filter(url => url.includes('/gtag/js'))).toHaveLength(publicScriptLoads);
  expect(analyticsRequests.some(url => new URL(url).searchParams.get('dl')?.includes('/account'))).toBe(false);
  await page.waitForLoadState('networkidle');
});

test('account-to-public navigation starts a clean public document before loading analytics', async ({ page }) => {
  await serveProductionHostFixture(page, true);
  const publicDocumentRequests: string[] = [];
  const analyticsScriptLoads: string[] = [];
  page.on('request', request => {
    if (request.isNavigationRequest() && new URL(request.url()).pathname === '/') publicDocumentRequests.push(request.url());
    if (request.url().includes('/gtag/js')) analyticsScriptLoads.push(request.url());
  });
  await page.addInitScript(() => localStorage.setItem('minebench:analytics-consent', 'granted'));
  await signInAs(page, 'account-test-token', 'https://minebench.cloud');
  await page.goto('https://minebench.cloud/account');
  await expect(page.getByRole('heading', { name: 'Your mining account' })).toBeVisible();
  expect(await page.locator('#google-analytics-loader, #google-analytics').count()).toBe(0);
  await page.evaluate(() => {
    const link = document.createElement('a');
    link.id = 'public-navigation-test';
    link.href = '/';
    link.textContent = 'Open public site';
    document.body.appendChild(link);
  });
  await Promise.all([page.waitForURL(url => url.pathname === '/'), page.locator('#public-navigation-test').click()]);
  await expect.poll(() => analyticsScriptLoads.length).toBeGreaterThan(0);
  expect(publicDocumentRequests).toHaveLength(1);
  await page.waitForLoadState('networkidle');
});

test('authenticated dashboard loads scoped BMT and XMR data after the document', async ({ page }) => {
  await signInAs(page);
  const response = await page.goto('/account');
  expect(response?.status()).toBe(200);
  const documentHtml = await response!.text();
  expect(documentHtml).not.toContain('987654321000');
  expect((await page.request.get('/api/account/session')).status()).toBe(200);
  expect((await page.request.get('/api/account/statistics/overview?mode=bmt&range=24h&limit=25')).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Your mining account' })).toBeVisible();
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'overview', exact: true }).click();
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'workers', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Authenticated worker connections and accepted work' })).toBeVisible();
  await expect(page.getByText('6000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'rewards', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Canonical BMT rewards' })).toBeVisible();
  await page.getByRole('button', { name: 'payouts', exact: true }).click();
  await expect(page.getByRole('table', { name: 'Canonical BMT payouts' })).toBeVisible();
  await expect(page.getByText('0.01', { exact: true })).toBeVisible();

  await page.getByLabel('Mining mode').selectOption('direct-xmr');
  await expect(page.getByText(/Only canonical XMR portions attributed to this account/i)).toBeVisible();
  await page.getByRole('button', { name: 'overview', exact: true }).click();
  await expect(page.getByText('Available XMR · MineBench account allocation')).toBeVisible();
  await expect(page.getByText('4.56', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'rewards', exact: true }).click();
  await expect(page.getByRole('table', { name: 'MineBench account-allocated XMR rewards' })).toBeVisible();
  await expect(page.getByText('4.56', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'payouts', exact: true }).click();
  await expect(page.getByRole('table', { name: 'MineBench account-allocated XMR payouts' })).toBeVisible();
  await expect(page.getByText('0.2', { exact: true })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Recorded fee BMT' })).toHaveCount(0);
  await expect(page.getByText(/do not prove wallet ownership or exchange receipt/i)).toBeVisible();
  await page.getByLabel('Mining mode').selectOption('premium-xmr');
  await page.getByRole('button', { name: 'overview', exact: true }).click();
  await expect(page.getByText('1.23', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Verified XMR mining identity' })).toBeVisible();
  await expect(page.getByText(/No active Premium XMR source is configured/i)).toBeVisible();
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
});

test('a second authenticated account receives only its own projected values', async ({ page }) => {
  await signInAs(page, 'other-account-test-token');
  await page.goto('/account');
  await expect(page.getByText('0.111', { exact: true })).toBeVisible();
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
});

test('work without canonical financial attribution keeps finances explicitly unavailable', async ({ page }) => {
  await signInAs(page, 'account-unattributed-test-token');
  await page.goto('/account');
  await page.getByLabel('Mining mode').selectOption('direct-xmr');
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  await expect(page.getByText('12600', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'rewards', exact: true }).click();
  await expect(page.getByText(/XMR finances require complete canonical attribution/i)).toBeVisible();
  await expect(page.getByText('4.56', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'payouts', exact: true }).click();
  await expect(page.getByText(/XMR finances require complete canonical attribution/i)).toBeVisible();
  await expect(page.getByRole('table', { name: /XMR payouts/ })).toHaveCount(0);
});

test('credential-only XMR accounts see their canonical portions for both rails', async ({ page }) => {
  await signInAs(page, 'account-credential-only-test-token');
  await page.goto('/account');
  for (const mode of ['direct-xmr', 'premium-xmr']) {
    await page.getByLabel('Mining mode').selectOption(mode);
    await page.getByRole('button', { name: 'overview', exact: true }).click();
    await expect(page.getByText('0.006', { exact: true })).toBeVisible();
    await expect(page.getByText('4.56', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'workers', exact: true }).click();
    await expect(page.getByText('12600', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'rewards', exact: true }).click();
    await expect(page.getByText('0.008', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'payouts', exact: true }).click();
    await expect(page.getByText('confirmed', { exact: true })).toBeVisible();
    await expect(page.getByText('0.002', { exact: true })).toHaveCount(2);
  }
});

test('overview shows canonical work metrics without inventing XMR finances', async ({ page }) => {
  await page.route('**/api/account/statistics/overview?mode=direct-xmr*', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({
      accountId: 'test-account', asOf: '2026-10-19T12:00:00.000Z',
      freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'partial', reasons: [] }, nextCursor: null,
      data: { balances: null, financeAvailable: false, reason: 'ACCOUNT_BOUND_XMR_HISTORY_REQUIRED', telemetry: null,
        workMetrics: { source: 'verified_proxy_journal', effectiveHashrateHps: null, averageHashrateHps: null,
          lastAcceptedAt: '2026-10-19T11:59:00.000Z',
          window24h: { seconds: 86400, acceptedEvents: 2, rejectedEvents: 1, staleEvents: null, invalidEvents: 3, lastAcceptedAt: '2026-10-19T11:59:00.000Z' },
          window7d: { seconds: 604800, acceptedEvents: 5, rejectedEvents: 1, staleEvents: null, invalidEvents: 3, lastAcceptedAt: '2026-10-19T11:59:00.000Z' },
          completeness: { status: 'partial', reasons: ['HASHRATE_UNAVAILABLE_PROTOCOL_OBSERVED_WORK'] } } }
    })
  }));
  await signInAs(page, 'account-credential-only-test-token');
  await page.goto('/account');
  await page.getByLabel('Mining mode').selectOption('direct-xmr');
  await expect(page.getByRole('heading', { name: 'Account-bound mining work' })).toBeVisible();
  await expect(page.getByText(/Financial history is unavailable until future authenticated work/i)).toBeVisible();
  await expect(page.getByText('Canonical accepted events').first()).toBeVisible();
  await expect(page.getByText('2', { exact: true })).toBeVisible();
  await expect(page.getByText('Unavailable', { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Hashrate is unavailable because protocol-observed difficulty/)).toBeVisible();
});

test('a zero-share worker can be observed connected without recent accepted activity', async ({ page }) => {
  const observedAt = '2026-10-19T11:59:45.000Z';
  await page.route('**/api/account/statistics/workers?*', route => route.fulfill({ json: {
    accountId: '11111111-1111-4111-8111-111111111111', asOf: '2026-10-19T12:00:00.000Z',
    freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'complete', reasons: [] }, nextCursor: null,
    data: { workers: [{ workerEpochId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', asset: 'BMT',
      acceptedEvents: 0, acceptedDifficulty: '0', lastAcceptedAt: null,
      effectiveHashrateHps: '0', averageHashrateHps: '0', activity: 'no_recent_accepted_work',
      presence: { source: 'proxy_observed_connection.v1', state: 'connected', observedAt,
        receivedAt: '2026-10-19T11:59:46.000Z', freshness: 'fresh' } }] }
  } }));
  await signInAs(page);
  await page.goto('/account');
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'dddddddd' });
  await expect(row.getByRole('cell').nth(2)).toHaveText(`Observed connected${observedAt}`);
  await expect(row.getByRole('cell').nth(3)).toHaveText('0');
  await expect(row.getByRole('cell').nth(7)).toHaveText('No accepted work within 1h');
  await expect(row.getByRole('cell').nth(8)).toHaveText('Unavailable');
  await expect(row.getByText('Accepted work within 1h', { exact: true })).toHaveCount(0);
});

test('stale and missing connection evidence stay unknown independently of accepted activity', async ({ page }) => {
  const acceptedAt = '2026-10-19T11:59:00.000Z';
  await page.route('**/api/account/statistics/workers?*', route => route.fulfill({ json: {
    accountId: '11111111-1111-4111-8111-111111111111', asOf: '2026-10-19T12:00:00.000Z',
    freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'partial', reasons: [] }, nextCursor: null,
    data: { workers: [
      { workerEpochId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', asset: 'BMT', acceptedEvents: 1,
        acceptedDifficulty: '6000', lastAcceptedAt: acceptedAt, activity: 'recent_accepted_work',
        presence: { source: 'proxy_observed_connection.v1', state: 'connected',
          observedAt: '2026-10-19T11:55:00.000Z', receivedAt: '2026-10-19T11:55:01.000Z', freshness: 'stale' } },
      { workerEpochId: 'ffffffff-ffff-4fff-8fff-ffffffffffff', asset: 'BMT', acceptedEvents: 0,
        acceptedDifficulty: '0', lastAcceptedAt: null, activity: 'no_recent_accepted_work',
        presence: { source: 'proxy_observed_connection.v1', state: 'unknown', observedAt: null,
          receivedAt: null, freshness: 'missing' } },
      { workerEpochId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', asset: 'BMT', acceptedEvents: 1,
        acceptedDifficulty: '9000', lastAcceptedAt: acceptedAt, activity: 'recent_accepted_work' },
      { workerEpochId: 'abababab-abab-4bab-8bab-abababababab', asset: 'BMT', acceptedEvents: 1,
        acceptedDifficulty: '12000', lastAcceptedAt: acceptedAt, activity: 'recent_accepted_work',
        presence: { source: 'proxy_observed_connection.v1', state: 'disconnected',
          observedAt: '2026-10-19T11:59:50.000Z', receivedAt: '2026-10-19T11:59:51.000Z', freshness: 'fresh' } }
    ] }
  } }));
  await signInAs(page);
  await page.goto('/account');
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  for (const epoch of ['eeeeeeee', 'ffffffff', 'aaaaaaaa']) {
    const connection = page.getByRole('row').filter({ hasText: epoch }).getByRole('cell').nth(2);
    await expect(connection).toContainText('Unknown');
    await expect(connection).not.toContainText('Observed connected');
    await expect(connection).not.toContainText('Observed disconnected');
  }
  const recent = page.getByRole('row').filter({ hasText: 'eeeeeeee' });
  await expect(recent.getByRole('cell').nth(7)).toHaveText('Accepted work within 1h');
  await expect(recent.getByRole('cell').nth(8)).toHaveText(acceptedAt);
  const missing = page.getByRole('row').filter({ hasText: 'ffffffff' });
  await expect(missing.getByRole('cell').nth(2)).toHaveText('Unknown');
  await expect(missing.getByRole('cell').nth(7)).toHaveText('No accepted work within 1h');
  await expect(missing.getByRole('cell').nth(8)).toHaveText('Unavailable');
  const disconnected = page.getByRole('row').filter({ hasText: 'abababab' });
  await expect(disconnected.getByRole('cell').nth(2)).toContainText('Observed disconnected');
  await expect(disconnected.getByRole('cell').nth(7)).toHaveText('Accepted work within 1h');
  await expect(disconnected.getByRole('cell').nth(8)).toHaveText(acceptedAt);
});

test('linked conversions show safe stages and only recorded canonical output and timestamps', async ({ page }) => {
  const createdAt = '2026-10-18T10:00:00.000Z';
  const processingAt = '2026-10-19T11:20:00.000Z';
  const completedAt = '2026-10-19T11:40:00.000Z';
  const unsafeStage = 'private_provider_token_never_display';
  await page.route('**/api/account/statistics/rewards?*', route => route.fulfill({ json: {
    accountId: '11111111-1111-4111-8111-111111111111', asOf: '2026-10-19T12:00:00.000Z',
    freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'partial', reasons: [
      'CONVERSION_OUTPUT_UNAVAILABLE', 'CONVERSION_RECONCILIATION_REQUIRED', 'CONVERSION_STATUS_UNAVAILABLE'
    ] }, nextCursor: null, data: { items: [], conversions: [
      { referenceId: 'processing', createdAt, status: 'processing', stage: 'exchange_conversion',
        stageUpdatedAt: processingAt, xmrInputAtomic: '1234567890123',
        bmtOutputAtomic: null, bmtOutputDecimal: null, decimals: 9 },
      { referenceId: 'reconciliation', createdAt, status: 'reconciliation_required', stage: 'ledger_reconciliation',
        stageUpdatedAt: null, xmrInputAtomic: '2500000000000',
        bmtOutputAtomic: null, bmtOutputDecimal: null, decimals: 9 },
      { referenceId: 'completed', createdAt, status: 'completed', stage: 'complete', stageUpdatedAt: completedAt,
        completedAt, xmrInputAtomic: '3000000000000', bmtOutputAtomic: '9007199254740993000001',
        bmtOutputDecimal: null, decimals: 9 },
      { referenceId: 'unknown', createdAt, status: 'processing', stage: unsafeStage, stageUpdatedAt: null,
        xmrInputAtomic: '4000000000000', bmtOutputAtomic: null, bmtOutputDecimal: null, decimals: 9 }
    ] }
  } }));
  await signInAs(page);
  await page.goto('/account');
  await page.getByRole('button', { name: 'rewards', exact: true }).click();
  const table = page.getByRole('table', { name: /Linked conversions/ });
  const processing = table.getByRole('row').filter({ hasText: 'Exchange conversion' });
  await expect(processing.getByRole('cell').nth(1)).toHaveText(`Exchange conversion${processingAt}`);
  await expect(processing.getByRole('cell').nth(2)).toHaveText('1.234567890123');
  await expect(processing.getByRole('cell').nth(3)).toHaveText('Unavailable');
  const reconciliation = table.getByRole('row').filter({ hasText: 'Ledger reconciliation' });
  await expect(reconciliation.getByRole('cell').nth(1)).toHaveText('Ledger reconciliation');
  await expect(reconciliation.getByRole('cell').nth(3)).toHaveText('Unavailable');
  const completed = table.getByRole('row').filter({ hasText: 'Canonical BMT credited' });
  await expect(completed.getByRole('cell').nth(1)).toHaveText(`Canonical BMT credited${completedAt}`);
  await expect(completed.getByRole('cell').nth(3)).toHaveText('9007199254740.993000001');
  const unknown = table.getByRole('row').filter({ hasText: 'Unknown stage' });
  await expect(unknown.getByRole('cell').nth(1)).toHaveText('Unknown stage');
  await expect(unknown.getByRole('cell').nth(3)).toHaveText('Unavailable');
  await expect(page.getByText(unsafeStage, { exact: false })).toHaveCount(0);
  await expect(page.getByText(/A linked conversion needs reconciliation before its BMT output can be confirmed/)).toBeVisible();
  await expect(page.getByText(/The conversion stage cannot be confirmed from the available records/)).toBeVisible();
});

test('BMT worker credential is shown once and never written to browser storage', async ({ page }) => {
  const password = 'b'.repeat(43);
  await page.route('**/api/account/bmt/worker-credential/sources', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ sources: [
      { id: '00000000-0000-4000-8000-000000000002', effectiveAfter: '2026-10-18T22:00:00.000Z' }
    ] })
  }));
  await page.route('**/api/account/bmt/worker-credential', route => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({
      rail: 'bmt', password, effectiveAfter: '2026-10-19T12:05:00.000Z', rotated: true
    })
  }));
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'BMT app worker credential' })).toBeVisible();
  await page.getByRole('button', { name: 'Rotate BMT worker password' }).click();
  await expect(page.getByLabel('One-time BMT stratum password')).toHaveValue(password);
  await expect(page.getByText(/not saved in browser storage/i)).toBeVisible();
  const storage = await page.evaluate(() => JSON.stringify({
    local: Object.keys(localStorage).map(key => localStorage.getItem(key)),
    session: Object.keys(sessionStorage).map(key => sessionStorage.getItem(key))
  }));
  expect(storage).not.toContain(password);
});

test('statistics loading is visible and a failed request can be retried', async ({ page }) => {
  let attempts = 0;
  await page.route('**/api/account/statistics/overview?*', async route => {
    attempts += 1;
    if (attempts === 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'temporarily_unavailable' }) });
      return;
    }
    await route.continue();
  });
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByRole('status').filter({ hasText: 'Verifying your account and loading statistics' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Statistics are unavailable' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test('empty worker, reward and payout responses show explicit empty states', async ({ page }) => {
  await page.route('**/api/account/statistics/**?*', async route => {
    const tab = new URL(route.request().url()).pathname.split('/').at(-1);
    if (!['workers', 'rewards', 'payouts'].includes(tab ?? '')) return route.continue();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      accountId: '11111111-1111-4111-8111-111111111111', asOf: '2026-10-19T12:00:00.000Z',
      freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'complete', reasons: [] },
      nextCursor: null, data: tab === 'workers' ? { workers: [] } : { items: [] }
    }) });
  });
  await signInAs(page);
  await page.goto('/account');
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  await expect(page.getByText('No authenticated workers are available for this mode.')).toBeVisible();
  await page.getByRole('button', { name: 'rewards', exact: true }).click();
  await expect(page.getByText('No canonical rewards records are available in this window. Historical coverage may be incomplete.')).toBeVisible();
  await page.getByRole('button', { name: 'payouts', exact: true }).click();
  await expect(page.getByText('No canonical payouts records are available in this window. Historical coverage may be incomplete.')).toBeVisible();
});

test('a delayed response from the previous mining mode cannot replace current worker data', async ({ page }) => {
  await page.route('**/api/account/statistics/workers?*', async route => {
    const mode = new URL(route.request().url()).searchParams.get('mode');
    if (mode === 'bmt') {
      await new Promise(resolve => setTimeout(resolve, 700));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        accountId: '11111111-1111-4111-8111-111111111111', asOf: '2026-10-19T12:00:00.000Z',
        freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'complete', reasons: [] }, nextCursor: null,
        data: { workers: [{ workerEpochId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', asset: 'BMT', acceptedEvents: 1, acceptedDifficulty: '42', lastAcceptedAt: '2026-10-19T12:00:00.000Z' }] }
      }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      accountId: '11111111-1111-4111-8111-111111111111', asOf: '2026-10-19T12:00:00.000Z',
      freshness: { status: 'fresh', ageSeconds: 1 }, completeness: { status: 'complete', reasons: [] }, nextCursor: null,
      data: { workers: [{ workerEpochId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', asset: 'XMR', acceptedEvents: 2, acceptedDifficulty: '84', lastAcceptedAt: '2026-10-19T12:00:00.000Z' }] }
    }) });
  });
  await signInAs(page);
  await page.goto('/account');
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  await page.getByLabel('Mining mode').selectOption('direct-xmr');
  await expect(page.getByText('cccccccc', { exact: false })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByText('bbbbbbbb', { exact: false })).toHaveCount(0);
  await expect(page.getByText('cccccccc', { exact: false })).toBeVisible();
});

test('XMR spend-key binding challenge and verified result stay scoped to the selected mining source', async ({ page }) => {
  await signInAs(page, 'account-binding-test-token');
  await page.goto('/account');
  await page.getByLabel('Mining mode').selectOption('direct-xmr');
  await expect(page.getByLabel('Mining source')).toBeVisible();
  await page.getByLabel('Monero mainnet address').fill('4'.repeat(95));
  await page.getByRole('button', { name: 'Create spend-key challenge' }).click();
  await expect(page.getByLabel('Exact message')).toHaveValue(/MineBench direct-XMR ownership challenge/);
  await page.getByLabel('Spend-key signature').fill('mock-proof-pass');
  await page.getByRole('button', { name: 'Verify and bind address' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Ownership verified' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Verified XMR bindings' })).toContainText('44444444');
  await page.getByRole('button', { name: 'Rotate verified-address worker password' }).click();
  await expect(page.getByLabel('One-time stratum password')).toHaveValue('A'.repeat(43));
  await expect(page.getByText(/previous password is revoked for new work/i)).toBeVisible();
});

test('XMR worker password rotation shows a one-time credential and supports hiding it', async ({ page }) => {
  await signInAs(page, 'account-binding-test-token');
  await page.goto('/account');
  await page.getByLabel('Mining mode').selectOption('direct-xmr');
  const rotate = page.getByRole('button', { name: 'Rotate account worker password' });
  await expect(rotate).toBeEnabled();
  await rotate.click();
  const stratumField = page.getByLabel('One-time stratum password');
  await expect(stratumField).toHaveValue('A'.repeat(43));
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(stratumField).toHaveCount(0);
});

test('keyboard-only passkey fixture login can open every private view and sign out', async ({ page }) => {
  // WebAuthn and verification are deterministic fixtures; no real authenticator is used.
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'PublicKeyCredential', {
      configurable: true, value: class PublicKeyCredential {}
    });
    Object.defineProperty(navigator, 'credentials', { configurable: true, value: { get: async () => ({
      id: 'AQID', rawId: new Uint8Array([1, 2, 3]).buffer, type: 'public-key',
      authenticatorAttachment: 'platform', getClientExtensionResults: () => ({}),
      response: { authenticatorData: new Uint8Array([1]).buffer, clientDataJSON: new Uint8Array([2]).buffer,
        signature: new Uint8Array([3]).buffer, userHandle: null }
    }) } });
  });
  await page.route('**/api/account/passkey/login-options', route => route.fulfill({ json: {
    challengeId: 'keyboard-fixture-challenge', options: { challenge: 'AQID', rpId: 'localhost',
      allowCredentials: [], userVerification: 'preferred', timeout: 30000 }
  } }));
  let verified = false;
  await page.route('**/api/account/passkey/login-verify', async route => {
    const body = route.request().postDataJSON();
    expect(body.challengeId).toBe('keyboard-fixture-challenge');
    expect(body.credential.id).toBe('AQID');
    verified = true;
    await signInAs(page);
    await route.fulfill({ json: { valid: true } });
  });
  const tabTo = async (target: import('@playwright/test').Locator, backwards = false) => {
    for (let attempts = 0; attempts < 40; attempts++) {
      if (await target.evaluate(element => element === document.activeElement)) break;
      await page.keyboard.press(backwards ? 'Shift+Tab' : 'Tab');
    }
    await expect(target).toBeFocused();
  };
  await page.goto('/account');
  await expect(page).toHaveURL(/\/account\/login$/);
  const login = page.getByRole('button', { name: 'Sign in with passkey', exact: true });
  await expect(login).toBeVisible();
  await tabTo(login);
  await page.keyboard.press('Enter');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  expect(verified).toBe(true);
  for (const [view, table] of [['workers', 'Authenticated worker connections and accepted work'],
    ['rewards', 'Canonical BMT rewards'], ['payouts', 'Canonical BMT payouts']] as const) {
    const tab = page.getByRole('button', { name: view, exact: true });
    await tabTo(tab);
    await page.keyboard.press('Enter');
    await expect(tab).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('table', { name: table })).toBeVisible();
  }
  const overview = page.getByRole('button', { name: 'overview', exact: true });
  await tabTo(overview, true);
  await page.keyboard.press('Space');
  await expect(overview).toHaveAttribute('aria-current', 'page');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  await tabTo(page.getByRole('button', { name: 'Sign out / switch account' }), true);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/account\/login$/);
  expect((await page.request.get('/api/account/session')).status()).toBe(401);
});

test('all three mining modes and private views have no automated accessibility violations', async ({ page }) => {
  test.setTimeout(120000);
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Your mining account' })).toBeVisible();
  for (const [mode, amount] of [['bmt', '987.654321'], ['premium-xmr', '1.23'], ['direct-xmr', '4.56']] as const) {
    if (mode !== 'bmt') await page.getByLabel('Mining mode').selectOption(mode);
    for (const view of ['overview', 'workers', 'rewards', 'payouts'] as const) {
      await page.getByRole('button', { name: view, exact: true }).click();
      if (view === 'overview') await expect(page.getByText(amount, { exact: true })).toBeVisible();
      else await expect(page.getByRole('table', { name: view === 'workers'
        ? 'Authenticated worker connections and accepted work'
        : mode === 'bmt' ? `Canonical BMT ${view}` : `MineBench account-allocated XMR ${view}` })).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, `${mode}/${view}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
    }
  }
});

test('private APIs require a session and reject cross-origin logout', async ({ page }) => {
  const anonymous = await page.request.get('/api/account/statistics/overview?mode=bmt&range=24h&limit=25');
  expect(anonymous.status()).toBe(401);
  expect(anonymous.headers()['cache-control']).toContain('no-store');

  await signInAs(page);
  const crossOriginLogout = await page.request.post('/api/account/logout', {
    headers: { origin: 'https://attacker.example' }
  });
  expect(crossOriginLogout.status()).toBe(403);
  expect(crossOriginLogout.headers()['cache-control']).toContain('no-store');
});

test('a revoked account session clears private data on the next request', async ({ page }) => {
  await page.route('**/api/account/passkeys', route => route.fulfill({ json: { authenticators: [
    { id: 'owner-passkey', createdAt: '2026-10-12T11:22:33.000Z', transports: ['internal'] }
  ] } }));
  let revoked = false;
  await page.route('**/api/account/statistics/**?*', async route => {
    if (revoked) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthorized' }) });
    return route.continue();
  });
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  await expect(page.getByText('Added 2026-10-12 11:22:33.000 UTC')).toBeVisible();
  revoked = true;
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Your session ended or access was denied' })).toBeVisible();
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Account passkeys' })).toHaveCount(0);
  await expect(page.getByText('Added 2026-10-12 11:22:33.000 UTC')).toHaveCount(0);
});

test('a worker credential denial clears statistics and every private setting', async ({ page }) => {
  await page.route('**/api/account/passkeys', route => route.fulfill({ json: { authenticators: [
    { id: 'owner-passkey', createdAt: '2026-10-12T11:22:33.000Z', transports: ['internal'] }
  ] } }));
  await page.route('**/api/account/bmt/worker-credential/sources', route => route.fulfill({ json: { sources: [
    { id: '00000000-0000-4000-8000-000000000002', effectiveAfter: '2026-10-18T22:00:00.000Z' }
  ] } }));
  await page.route('**/api/account/bmt/worker-credential', route => route.fulfill({ status: 403, json: { error: 'denied' } }));
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  await expect(page.getByText('Added 2026-10-12 11:22:33.000 UTC')).toBeVisible();
  await page.getByRole('button', { name: 'Rotate BMT worker password' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Your session ended or access was denied' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account passkeys' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'BMT app worker credential' })).toHaveCount(0);
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'workers', exact: true }).click();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('a passkey list denial clears the authenticated dashboard', async ({ page }) => {
  await page.route('**/api/account/passkeys', route => route.fulfill({ status: 401, json: { error: 'revoked' } }));
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByRole('alert').filter({ hasText: 'Your session ended or access was denied' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account passkeys' })).toHaveCount(0);
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
});

test('failed sign out clears all private settings while retry remains available', async ({ page }) => {
  await page.route('**/api/account/passkeys', route => route.fulfill({ json: { authenticators: [
    { id: 'owner-passkey', createdAt: '2026-10-12T11:22:33.000Z', transports: ['internal'] }
  ] } }));
  await page.route('**/api/account/logout', route => route.fulfill({ status: 503, json: { error: 'unavailable' } }));
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByText('Added 2026-10-12 11:22:33.000 UTC')).toBeVisible();
  await page.getByRole('button', { name: 'Sign out / switch account' }).click();
  await expect(page.getByRole('button', { name: 'Retry sign-out' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account passkeys' })).toHaveCount(0);
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
});

test('sign out clears the account session and returns to the login page', async ({ page }) => {
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByRole('heading', { name: 'Your mining account' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out / switch account' }).click();
  await expect(page).toHaveURL(/\/account\/login$/);
  const session = await page.request.get('/api/account/session');
  expect(session.status()).toBe(401);
});

test('sign out clears another open account tab before it can show private settings again', async ({ page, context }) => {
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  const other = await context.newPage();
  try {
    await other.goto('/account');
    await expect(other.getByText('987.654321', { exact: true })).toBeVisible();
    await page.bringToFront();
    await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sign out / switch account' }).click();
    await expect(other).toHaveURL(/\/account\/login$/);
    await other.bringToFront();
    await expect(other.getByText('987.654321', { exact: true })).toHaveCount(0);
    await expect(other.getByRole('heading', { name: 'Account passkeys' })).toHaveCount(0);
  } finally { await other.close(); }
});

test('browser back cannot restore a private account document after logout', async ({ page }) => {
  await signInAs(page);
  await page.goto('/account');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  await page.goto('/account?history-entry=second');
  await expect(page.getByText('987.654321', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out / switch account' }).click();
  await expect(page).toHaveURL(/\/account\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/account\/login$/);
  await expect(page.getByText('987.654321', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Account passkeys' })).toHaveCount(0);
});
