import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'CPU Mining, RandomX & Hashrate Guides | MineBench',
  description: 'Practical guides for RandomX CPU mining benchmarks, hashrate efficiency, profitability inputs, and safe MineBench client downloads.',
  alternates: { canonical: 'https://minebench.cloud/guides' },
  openGraph: {
    title: 'CPU Mining, RandomX & Hashrate Guides | MineBench',
    description: 'Practical guides for RandomX benchmarking, hashrate efficiency, profitability inputs, and safe client setup.',
    url: 'https://minebench.cloud/guides',
    type: 'website'
  }
};

export default function GuidesPage() {
  return <>
    <Header />
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">MineBench guides</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">CPU mining, RandomX and hashrate guides</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">Run clearer mining benchmarks, compare RandomX hardware results, measure hashrate efficiency, check profitability inputs, and verify a MineBench download. Estimates are scenarios, not earnings guarantees.</p>
      <section className="mt-12 grid gap-5 md:grid-cols-3" aria-label="Guides">
        {GUIDES.map((guide) => <article key={guide.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white"><Link href={`/guides/${guide.slug}`} className="hover:text-yellow-300">{guide.title}</Link></h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{guide.description}</p>
          <Link href={`/guides/${guide.slug}`} className="mt-5 inline-flex font-medium text-yellow-300 hover:text-yellow-200">Read the guide <span aria-hidden="true">→</span></Link>
        </article>)}
      </section>
      <section className="mt-12 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-6">
        <h2 className="text-xl font-semibold text-white">Ready to measure your hardware?</h2>
        <p className="mt-2 text-zinc-300">Download the client, run a benchmark and compare the result with public hardware data.</p>
        <Link href="/downloads" className="mt-4 inline-flex font-medium text-yellow-300 hover:text-yellow-200">Download MineBench <span aria-hidden="true">→</span></Link>
      </section>
    </main>
    <Footer />
  </>;
}
