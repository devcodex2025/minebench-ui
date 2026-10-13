// Local browser-test fixture, never used by application code.
const http = require('node:http');
http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  response.setHeader('Content-Type', 'application/json');
  if (url.searchParams.get('page') === '2') { response.writeHead(503); return response.end('{}'); }
  const empty = url.searchParams.get('page') === '1';
  if (url.pathname === '/api/conversions') {
    return response.end(JSON.stringify({ conversions: empty ? [] : [{ id: 'preview', status: 'confirmed',
      xmr_atomic: '25000000000', sol_lamports: '100000000', bmt_atomic: '250000000', bmt_decimals: 6,
      solana_signature: '1'.repeat(88), cluster: 'devnet', created_at: '2026-09-11T12:00:00Z' }], hasMore: !empty }));
  }
  if (url.searchParams.get('type') === 'bmt') {
    const zeroQueue = url.searchParams.get('page') === '3';
    return response.end(JSON.stringify({
      transactions: empty || zeroQueue ? [] : [
        { id: 'queued', status: 'pending', amount: '12.5', fee: '0.25', transaction_hash: null, created_at: '2026-09-22T12:00:00Z' },
        { id: 'confirming', status: 'pending', amount: '10', fee: '0.2', transaction_hash: '1'.repeat(88), created_at: '2026-09-22T11:59:00Z' },
        { id: 'completed', status: 'completed', amount: '8', fee: '0.1', transaction_hash: '2'.repeat(88), created_at: '2026-09-22T11:58:00Z' }
      ],
      queue: url.searchParams.get('page') === '4' ? null : zeroQueue
        ? { pendingCount: 0, amountBmt: '0', feeBmt: '0' }
        : { pendingCount: 5, amountBmt: '137.45', feeBmt: '2.55' },
      hasMore: !empty && !zeroQueue
    }));
  }
  response.end(JSON.stringify({ transactions: empty ? [] : [{ id: 'preview', status: url.searchParams.get('type') === 'bmt' ? 'completed' : 'confirmed',
    amount: '0.025', fee: '0.00001', transaction_hash: url.searchParams.get('type') === 'bmt' ? '1'.repeat(88) : 'a'.repeat(64),
    created_at: '2026-09-11T12:00:00Z' }], hasMore: !empty }));
}).listen(4319, '127.0.0.1', () => console.log('Transaction fixture listening on 4319'));
