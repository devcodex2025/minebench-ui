import type { Metadata } from 'next';
import { PREMIUM_PRICE_USDC, PREMIUM_FAQS } from '@/lib/marketing';

const title = `MineBench Premium | ${PREMIUM_PRICE_USDC} USDC Once, More Mining Control`;
const description = `Compare Free and Premium. Add custom Monero wallet routing and pool settings for ${PREMIUM_PRICE_USDC} USDC once, plus Solana network fees.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: 'https://minebench.cloud/premium' },
  openGraph: { title, description, url: 'https://minebench.cloud/premium', siteName: 'MineBench' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://minebench.cloud/premium#software',
        name: 'MineBench Premium',
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Windows, Linux',
        url: 'https://minebench.cloud/premium',
        description,
        screenshot: 'https://minebench.cloud/screenshots/app-overview-screenshots/premium.png',
        offers: {
          '@type': 'Offer',
          url: 'https://minebench.cloud/premium#premium-purchase',
          price: PREMIUM_PRICE_USDC,
          priceCurrency: 'USDC',
          description: 'One-time payment on Solana. SOL network fees are additional. No expiry or recurring subscription.',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://minebench.cloud/' },
          { '@type': 'ListItem', position: 2, name: 'Premium', item: 'https://minebench.cloud/premium' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: PREMIUM_FAQS.map(faq => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })),
      },
    ],
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />{children}</>;
}
