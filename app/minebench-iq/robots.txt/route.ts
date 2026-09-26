export function GET() {
  return new Response('User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://iq.minebench.cloud/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
