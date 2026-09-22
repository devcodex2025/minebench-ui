import AnimatedContent from '@/components/reactbits/AnimatedContent';
import FadeContent from '@/components/reactbits/FadeContent';
import Link from 'next/link';
import { HOME_FAQS } from '@/lib/marketing';

export function GettingStarted() {
  return (
    <section aria-labelledby="getting-started" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-3 text-sm font-medium text-yellow-400">From download to comparison</p>
      <h2 id="getting-started" className="text-3xl font-semibold tracking-tight sm:text-4xl">Run your first mining benchmark</h2>
      <ol className="mt-8 grid gap-6 md:grid-cols-3">
        {[
          { title: 'Choose your build', text: 'Download the free client for your operating system and architecture.', href: '/downloads', link: 'See available downloads' },
          { title: 'Measure your hardware', text: 'Open Benchmarks in the desktop client, run a test, and review the reported hashrate and telemetry.', href: '/downloads#application-overview', link: 'See the client interface' },
          { title: 'Compare the results', text: 'Find your device in the public leaderboard. Compare results with the algorithm and system settings in mind.', href: '/leaderboard', link: 'Explore hardware results' },
        ].map((step, index) => (
          <AnimatedContent as="li" delay={index * 0.07} key={step.title} className="surface-panel p-6">
            <span className="text-sm font-medium tabular-nums text-yellow-400">0{index + 1}</span>
            <h3 className="mt-4 text-xl font-semibold text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{step.text}</p>
            <Link href={step.href} className="mt-5 inline-block text-sm text-yellow-400 hover:underline">{step.link} &rarr;</Link>
          </AnimatedContent>
        ))}
      </ol>
    </section>
  );
}

export function BenchmarkFAQ() {
  return (
    <FadeContent as="section" aria-labelledby="benchmark-faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h2 id="benchmark-faq" className="mb-8 text-3xl font-semibold tracking-tight">Before your first benchmark</h2>
      <div className="divide-y divide-zinc-800 border-y border-zinc-800">
        {HOME_FAQS.map(faq => (
          <details key={faq.question} className="group py-5">
            <summary className="scroll-mt-28 cursor-pointer text-base font-medium text-white marker:text-yellow-400">{faq.question}</summary>
            <p className="mt-4 text-sm leading-7 text-zinc-400">{faq.answer}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm text-zinc-400">Need help with setup? <a href="https://discord.gg/vsDyYh4rma" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline">Ask the MineBench community</a>.</p>
    </FadeContent>
  );
}
