import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Monero Pool Setup & RandomX Mining Guides | MineBench',
  description: 'Monero pool setup and how-to guides for RandomX CPU benchmarks, H/s per watt, mining-cost inputs and verifying official MineBench downloads.',
  alternates: { canonical: 'https://minebench.cloud/guides' },
  openGraph: {
    title: 'Monero Pool Setup & RandomX Mining Guides | MineBench',
    description: 'Choose a guide for Monero pool setup, repeatable CPU benchmarks, hashrate efficiency, cost estimates or official download checks.',
    url: 'https://minebench.cloud/guides',
    type: 'website',
    images: [{ url: '/img/guides/randomx-cpu-workbench.webp', width: 1280, height: 720, alt: 'Illustration of a cooled desktop CPU on a benchmark workbench' }],
  },
  twitter: { card: 'summary_large_image', title: 'Monero Pool Setup & RandomX Mining Guides | MineBench', description: 'Practical guides for repeatable benchmarks, mining efficiency, cost inputs and release verification.', images: ['/img/guides/randomx-cpu-workbench.webp'] },
};

export default function GuidesPage() {
  return <>
    <Header liveMetrics={false} />
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-5xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-400">MineBench guides</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Monero mining, pool setup and RandomX guides</h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-300">Choose the guide for your next step: connect compatible Monero hardware, run a repeatable RandomX CPU benchmark, measure H/s per watt, check mining-cost inputs or verify a client download. Pool receipts, benchmark results and personal payouts each need their own checks.</p>
      <section className="mt-12 grid gap-5 md:grid-cols-3" aria-label="Guides">
        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white"><Link prefetch={false} href="/guides/monero-hardware-pool-setup" className="hover:text-yellow-300">Monero ASIC pool setup, statistics and XMR payouts</Link></h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Check RandomX hardware compatibility, configure the MineBench pool, verify accepted work, and understand payout stages and support.</p>
          <Link prefetch={false} href="/guides/monero-hardware-pool-setup" className="mt-5 inline-flex min-h-10 items-center font-medium text-yellow-300 hover:text-yellow-200">Set up your miner <span aria-hidden="true">→</span></Link>
        </article>
        {GUIDES.map((guide) => <article key={guide.slug} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold text-white"><Link prefetch={false} href={`/guides/${guide.slug}`} className="hover:text-yellow-300">{guide.title}</Link></h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{guide.description}</p>
          <Link prefetch={false} href={`/guides/${guide.slug}`} className="mt-5 inline-flex min-h-10 items-center font-medium text-yellow-300 hover:text-yellow-200">Read the guide <span aria-hidden="true">→</span></Link>
        </article>)}
      </section>
      <section className="mt-12 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-6">
        <h2 className="text-xl font-semibold text-white">Ready to measure your hardware?</h2>
        <p className="mt-2 text-zinc-300">Download the client, run a benchmark and compare the result with public hardware data.</p>
        <Link prefetch={false} href="/downloads" className="mt-4 inline-flex min-h-10 items-center font-medium text-yellow-300 hover:text-yellow-200">Download MineBench <span aria-hidden="true">→</span></Link>
      </section>
    </main>
    <Footer />
  </>;
}
