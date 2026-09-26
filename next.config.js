/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/minebench-iq' },
        { source: '/robots.txt', destination: '/minebench-iq/robots.txt' },
        { source: '/sitemap.xml', destination: '/minebench-iq/sitemap.xml' },
      ].map((route) => ({
        ...route,
        has: [{ type: 'host', value: '^iq\\.minebench\\.cloud$' }],
      })),
    };
  },
  async headers() {
    return [
      {
        // Allow CORS for wallet-connect page to receive requests from localhost Electron app
        source: '/wallet-connect',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
      {
        source: '/dashboard',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
