import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GUIDE_BY_SLUG, GUIDES } from '@/lib/guides';

type Props = { params: Promise<{ slug: string }> };
const BASE_URL = 'https://minebench.cloud';

export function generateStaticParams() {
  return GUIDES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = Object.prototype.hasOwnProperty.call(GUIDE_BY_SLUG, slug) ? GUIDE_BY_SLUG[slug] : undefined;
  if (!guide) return {};
  const url = `${BASE_URL}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: { title: guide.title, description: guide.description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.description }
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = Object.prototype.hasOwnProperty.call(GUIDE_BY_SLUG, slug) ? GUIDE_BY_SLUG[slug] : undefined;
  if (!guide) notFound();
  const url = `${BASE_URL}/guides/${guide.slug}`;
  const relatedGuides = GUIDES.filter(({ slug }) => slug !== guide.slug).slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        datePublished: guide.updatedAt,
        dateModified: guide.updatedAt,
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: 'MineBench Team', url: BASE_URL },
        publisher: { '@type': 'Organization', name: 'MineBench', url: BASE_URL }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${BASE_URL}/guides` },
          { '@type': 'ListItem', position: 3, name: guide.title, item: url }
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } }))
      }
    ]
  };

  return <>
    <Header />
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-3xl px-4 pb-24 pt-36 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Breadcrumb" className="text-sm text-zinc-400"><Link href="/" className="hover:text-white">Home</Link> <span aria-hidden="true">/</span> <Link href="/guides" className="hover:text-white">Guides</Link> <span aria-hidden="true">/</span> <span>{guide.title}</span></nav>
      <article className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">Technical guide</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">{guide.title}</h1>
        <p className="mt-5 text-xl leading-8 text-zinc-300">{guide.summary}</p>
        <p className="mt-5 text-sm text-zinc-500">Last updated: <time dateTime={guide.updatedAt}>{guide.updatedAt}</time> · MineBench Team</p>
        <div className="mt-12 space-y-12">
          {guide.sections.map((section) => <section key={section.heading}>
            <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="mt-4 leading-8 text-zinc-300">{paragraph}</p>)}
            {section.steps && <ol className="mt-5 list-decimal space-y-3 pl-6 leading-7 text-zinc-300">{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
          </section>)}
        </div>
        <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby="guide-faqs">
          <h2 id="guide-faqs" className="text-2xl font-semibold text-white">Frequently asked questions</h2>
          <div className="mt-5 divide-y divide-white/10">{guide.faqs.map((faq) => <details key={faq.question} className="py-5"><summary className="cursor-pointer font-medium text-white">{faq.question}</summary><p className="mt-3 leading-7 text-zinc-300">{faq.answer}</p></details>)}</div>
        </section>
        <section className="mt-12 border-t border-white/10 pt-8" aria-labelledby="related-guides">
          <h2 id="related-guides" className="text-2xl font-semibold text-white">Related mining guides</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {relatedGuides.map((related) => <Link key={related.slug} href={`/guides/${related.slug}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300 hover:border-yellow-400/30 hover:text-yellow-200">
              {related.title}
            </Link>)}
          </div>
        </section>
        <section className="mt-12 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-6">
          <h2 className="text-xl font-semibold text-white">Run your own benchmark</h2>
          <p className="mt-2 text-zinc-300">Download the MineBench client and compare your hardware with public results.</p>
          <div className="mt-4 flex flex-wrap gap-5">
            <Link href="/downloads" className="inline-flex font-medium text-yellow-300 hover:text-yellow-200">Download MineBench <span aria-hidden="true">→</span></Link>
            <Link href="/leaderboard" className="inline-flex font-medium text-yellow-300 hover:text-yellow-200">Compare benchmark results <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </article>
    </main>
    <Footer />
  </>;
}
