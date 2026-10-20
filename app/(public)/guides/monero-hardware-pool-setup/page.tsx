import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const BASE_URL = 'https://minebench.cloud';
const PAGE_URL = BASE_URL + '/guides/monero-hardware-pool-setup';
const TITLE = 'Monero ASIC Pool Setup, Stats & XMR Payouts | MineBench';
const DESCRIPTION = 'Set up a Monero RandomX hardware miner on MineBench. Check Antminer X5 compatibility, pool settings, accepted shares, statistics, XMR payouts and support.';
const UPDATED_AT = '2026-10-19';
const DISCORD_URL = 'https://discord.gg/vsDyYh4rma';
const HARDWARE_IMAGE = '/img/guides/monero-mining-hardware.webp';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE, description: DESCRIPTION, url: PAGE_URL, type: 'article', modifiedTime: UPDATED_AT,
    images: [{ url: HARDWARE_IMAGE, width: 1280, height: 720, alt: 'Illustration of two standalone mining units with cooling fans and Ethernet connections' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [HARDWARE_IMAGE] },
};

const SECTIONS = [
  ['compatibility', 'Check your miner'], ['pool-settings', 'Pool settings'],
  ['connect', 'Connect step by step'], ['statistics', 'Track statistics'],
  ['advantages', 'Why use MineBench?'], ['payouts', 'XMR payouts and fees'],
  ['troubleshooting', 'Fix connection problems'], ['support', 'Get support'],
  ['faq', 'Frequently asked questions'],
];

const SETTINGS = [
  ['Algorithm', 'Monero RandomX (rx/0)', 'Confirm that your firmware supports the current Monero network.'],
  ['Pool host', 'xmr.minebench.cloud', 'Use the mining host, rather than the website or an HTTP API address.'],
  ['Stratum port', '3333', 'Shared proxy port in the current MineBench application configuration.'],
  ['Pool URL', 'stratum+tcp://xmr.minebench.cloud:3333', 'If firmware expects only host:port, enter xmr.minebench.cloud:3333.'],
  ['Worker / User / Wallet', 'YOUR_MONERO_WALLET_ADDRESS', 'Replace this with your own valid 95-character mainnet XMR address.'],
  ['Password', 'x', 'A conventional Stratum placeholder; this is not your wallet password.'],
  ['Rig ID, if supported', 'rig-01', 'Optional device label. Keep the payout wallet in the User field.'],
];

const FAQS = [
  {
    question: 'Can an ASIC miner mine Monero?',
    answer: 'Monero uses RandomX, an ASIC-resistant algorithm designed around general-purpose CPUs. Some dedicated devices, including the Antminer X5, are sold for RandomX mining. The label “Monero ASIC” alone does not establish compatibility: the device must support current Monero RandomX and the pool’s Stratum connection.',
  },
  {
    question: 'Can I connect an Antminer X5 to MineBench?',
    answer: 'Bitmain documents the X5 as a RandomX miner. MineBench has not established model-specific compatibility in this guide. Check your firmware, confirm the current pool terms with support, enter the pool URL and your Monero wallet as the Worker/User, and verify accepted shares before leaving it running.',
  },
  {
    question: 'What is the MineBench Monero pool address?',
    answer: 'The XMR endpoint used in this guide is xmr.minebench.cloud:3333, matching the current client configuration. Firmware that expects a complete plain Stratum URL can use stratum+tcp://xmr.minebench.cloud:3333. Confirm the deployed host, availability and wallet-attributing proxy route with support before mining. A TLS mining endpoint has not been verified for this guide.',
  },
  {
    question: 'Why does MineBench use port 3333 rather than 3334 for miners?',
    answer: 'The application uses a shared Stratum proxy on port 3333 for BMT and XMR modes. In the pool reference configuration, that proxy forwards work to P2Pool on internal port 3334. Miners connect to the proxy; selecting XMR changes the wallet login, not the port. Confirm the deployed public endpoint with support before mining.',
  },
  {
    question: 'Do I need MineBench Premium for a standalone hardware miner?',
    answer: 'Premium controls custom wallet and pool settings inside the MineBench desktop client. A standalone hardware miner uses its own firmware settings and an XMR wallet login. Check direct-miner availability and payout terms with MineBench support before connecting.',
  },
  {
    question: 'Where can I check my Monero miner statistics?',
    answer: 'Check your device’s status page for its own hashrate and accepted or rejected shares. The MineBench dashboard shows aggregate pool activity, not personal direct-XMR balances, worker history or payout transaction history. Contact MineBench support for payout-policy confirmation and wallet-specific follow-up.',
  },
  {
    question: 'Does an accepted share mean I have received XMR?',
    answer: 'No. Accepted Stratum work, a qualifying P2Pool share, a confirmed pool receipt, a miner balance credit and a completed XMR transfer are different stages. Your wallet receiving a confirmed transfer is the payment check.',
  },
  {
    question: 'When will my XMR payout arrive, and what is the minimum?',
    answer: 'A fixed public minimum or payout interval has not been verified for this guide. Direct payouts require eligible credited work, an enabled payout service, the active minimum and fee policy, unlocked funds and network confirmation. Confirm current terms in MineBench Discord before directing hashrate to the pool.',
  },
];

export default function MoneroHardwarePoolGuide() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TechArticle', '@id': PAGE_URL + '#article',
        headline: TITLE, description: DESCRIPTION, dateModified: UPDATED_AT, mainEntityOfPage: PAGE_URL,
        image: BASE_URL + HARDWARE_IMAGE, inLanguage: 'en',
        author: { '@type': 'Organization', name: 'MineBench Team', url: BASE_URL },
        publisher: { '@type': 'Organization', name: 'MineBench', url: BASE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: BASE_URL + '/guides' },
          { '@type': 'ListItem', position: 3, name: 'Monero hardware pool setup', item: PAGE_URL },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map(({ question, answer }) => ({
          '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer },
        })),
      },
    ],
  };

  return <>
    <Header liveMetrics={false} />
    <main id="refresh-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-24 pt-36 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-3 text-sm text-zinc-300">
        <Link prefetch={false} href="/" className="inline-flex min-h-10 items-center hover:text-white">Home</Link>
        <span aria-hidden="true">/</span>
        <Link prefetch={false} href="/guides" className="inline-flex min-h-10 items-center hover:text-white">Guides</Link>
        <span aria-hidden="true">/</span><span aria-current="page">Monero hardware pool setup</span>
      </nav>
      <div className="mt-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
      <header className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-300">Monero mining guide</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Monero ASIC pool setup: connect your RandomX miner</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">
          Point a compatible Monero hardware miner at MineBench, verify accepted work, and understand how XMR payouts work.
          Before configuring an Antminer X5 or another device sold as a Monero ASIC, check its RandomX support.
          Monero is designed to resist ASIC specialization.
        </p>
        <p className="mt-5 text-sm text-zinc-300">By MineBench Team · Reviewed <time dateTime={UPDATED_AT}>October 19, 2026</time></p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#pool-settings" className="btn-primary">View pool settings</a>
          <Link prefetch={false} href="/dashboard" className="btn-secondary">View pool statistics</Link>
        </div>
      </header>
      <figure className="mt-10 min-w-0 lg:mt-0">
        <Image
          src={HARDWARE_IMAGE}
          alt="Illustration of two standalone mining units with cooling fans and Ethernet connections"
          width={1280}
          height={720}
          sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(100vw - 48px), (max-width: 1151px) calc(50vw - 56px), 520px"
          priority
          className="h-auto w-full rounded-2xl border border-white/10"
        />
        <figcaption className="mt-3 text-sm leading-6 text-zinc-400">
          Illustrative mining hardware. Confirm RandomX support and firmware compatibility for your exact device.
        </figcaption>
      </figure>
      </div>
      <div className="mt-12 grid items-start gap-10 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label="On this page" className="rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:sticky lg:top-36">
          <p className="mb-3 text-sm font-semibold text-white">On this page</p>
          <ol className="text-sm text-zinc-300">
            {SECTIONS.map(([id, label]) => <li key={id}><a href={'#' + id} className="flex min-h-10 items-center rounded px-2 py-2 hover:bg-white/[0.05] hover:text-white">{label}</a></li>)}
          </ol>
        </nav>
        <article className="min-w-0 space-y-12 text-base leading-8 text-zinc-300">
          <section id="compatibility" className="scroll-mt-36" aria-labelledby="compatibility-title">
            <h2 id="compatibility-title" className="text-2xl font-semibold text-white">Can your Monero ASIC or hardware miner connect?</h2>
            <p className="mt-4">Monero uses RandomX, a CPU-oriented proof-of-work algorithm designed for ASIC resistance.
              A Bitcoin SHA-256 miner, Litecoin Scrypt miner, or an older CryptoNight-only device cannot mine current Monero by changing its pool URL.
              Your miner must support current Monero RandomX and a compatible Stratum connection.</p>
            <p className="mt-4">Bitmain documents the Antminer X5 as an XMR RandomX device. This establishes its advertised workload;
              it does not establish that a particular firmware release has been tested with MineBench.
              Follow the manufacturer&apos;s setup instructions and confirm accepted work during your first connection.</p>
            <p className="mt-4">See the <a href="https://www.getmonero.org/get-started/mining/" className="text-yellow-300 underline underline-offset-4">official Monero mining guide</a> and
              {' '}<a href="https://file12.bitmain.com/shop-product-s3/firmware/921167f2-ad4f-40ad-b08f-d1393ef209c2/2023/09/22/15/X5%20Server%20Manual.pdf" className="text-yellow-300 underline underline-offset-4">Bitmain X5 server manual (PDF)</a>.
              For a desktop CPU, use our <Link prefetch={false} href="/guides/randomx-benchmarking" className="text-yellow-300 underline underline-offset-4">RandomX benchmark guide</Link> to measure sustained performance.</p>
          </section>
          <section id="pool-settings" className="scroll-mt-36" aria-labelledby="pool-settings-title">
            <h2 id="pool-settings-title" className="text-2xl font-semibold text-white">MineBench Monero mining pool settings</h2>
            <p className="mt-4">For standalone XMR mining, put your own Monero payout address in the miner&apos;s User or Worker login field.
              Use a valid 95-character Monero mainnet primary address or subaddress, beginning with 4 or 8.
              Integrated addresses and payment IDs are not supported by this login format.</p>
            <p className="mt-3 text-sm lg:hidden">Scroll the table horizontally to read all settings.</p>
            <div className="mt-5 overflow-x-auto rounded-xl border border-white/10" role="region" aria-label="Pool settings table" tabIndex={0}>
              <table className="w-full min-w-3xl text-left">
                <caption className="sr-only">Settings for a standalone Monero RandomX miner</caption>
                <thead><tr><th scope="col" className="p-4">Setting</th><th scope="col" className="p-4">Value</th><th scope="col" className="p-4">How to use it</th></tr></thead>
                <tbody>{SETTINGS.map(([setting, value, detail]) => <tr key={setting}>
                  <th scope="row" className="border-t border-white/10 p-4 align-top font-medium text-white">{setting}</th>
                  <td className="border-t border-white/10 p-4 align-top"><code className="whitespace-nowrap text-white">{value}</code></td>
                  <td className="min-w-48 border-t border-white/10 p-4 align-top">{detail}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <aside className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-5" aria-label="Connection and payout terms">
              <p className="font-semibold text-white">Confirm the connection route and payout terms</p>
              <p className="mt-2">The endpoint above follows the current application configuration; its deployed availability and routing through the wallet-attributing proxy
                have not been verified for this guide. A direct P2Pool connection alone does not establish a personal XMR balance.
                A TLS mining endpoint, current fee, minimum payout,
                payout interval, and automatic direct-XMR payout availability have not been verified for this guide.
                Confirm these with <a href={DISCORD_URL} className="text-yellow-300 underline underline-offset-4">MineBench support</a> before committing hashrate.</p>
            </aside>
          </section>
          <section id="connect" className="scroll-mt-36" aria-labelledby="connect-title">
            <h2 id="connect-title" className="text-2xl font-semibold text-white">How to add MineBench to your miner</h2>
            <figure className="mt-6">
              <Image
                src="/img/guides/monero-pool-connection.svg"
                alt="Connection diagram: RandomX miner to MineBench Stratum at xmr.minebench.cloud:3333, followed by work verification."
                width={600}
                height={900}
                loading="lazy"
                unoptimized
                className="mx-auto h-auto w-full max-w-md"
              />
              <figcaption className="mt-3 text-sm leading-6 text-zinc-400">
                Your Monero wallet is the payout login. A separate rig label identifies the device.
              </figcaption>
            </figure>
            <ol className="mt-5 list-decimal space-y-5 pl-6">
              <li><strong className="text-white">Prepare your XMR wallet.</strong> Copy your receiving address from your own Monero wallet. Check the full address after pasting it. A pool setup requires a public receiving address, never your seed phrase, spend key, or wallet password.</li>
              <li><strong className="text-white">Open the miner&apos;s local web interface.</strong> Use the device address on your own network and open its mining configuration. On X5-style interfaces, locate the pool configuration fields: Pool URL, Worker, and Password. Labels vary by firmware.</li>
              <li><strong className="text-white">Set the primary pool.</strong> Enter <code className="break-all text-white">stratum+tcp://xmr.minebench.cloud:3333</code>. If the form separates host and port, use <code className="text-white">xmr.minebench.cloud</code> and <code className="text-white">3333</code>. Do not enable SSL/TLS for this plain Stratum example.</li>
              <li><strong className="text-white">Set the payout identity.</strong> Enter your complete Monero wallet address as Worker/User and <code className="text-white">x</code> as Password. If your miner supports a separate Rig ID, use a label such as <code className="text-white">rig-01</code>. Do not replace the wallet login with that label or append an undocumented suffix.</li>
              <li><strong className="text-white">Save and apply.</strong> Use your firmware&apos;s Save/Apply action and restart mining if required. Review secondary pool slots: a failover pool has its own wallet and payout rules. Repeating the same endpoint in every slot does not create an independent backup.</li>
              <li><strong className="text-white">Verify accepted work.</strong> Open the miner&apos;s status or log page. Check that the active pool is MineBench, the connection stays up, and accepted shares increase. A local hashrate reading alone does not confirm that the pool accepted any work.</li>
            </ol>
            <h3 className="mt-7 text-lg font-semibold text-white">Equivalent XMRig example for a CPU rig</h3>
            <p className="mt-3">Use this on an existing XMRig installation, replacing the wallet placeholder. Hardware web interfaces use the settings table above.</p>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-white" tabIndex={0} aria-label="XMRig command example"><code>{[
              'xmrig -a rx/0 \\',
              '  -o xmr.minebench.cloud:3333 \\',
              '  -u YOUR_MONERO_WALLET_ADDRESS \\',
              '  -p x \\',
              '  --rig-id rig-01',
            ].join('\n')}</code></pre>
            <p className="mt-3 text-sm">See <a href="https://xmrig.com/docs/miner/config/pool" className="text-yellow-300 underline underline-offset-4">XMRig&apos;s official pool configuration reference</a> for the meaning of its pool and rig-ID options.
              No wallet address or credential is prefilled in this example.</p>
          </section>
          <section id="statistics" className="scroll-mt-36" aria-labelledby="statistics-title">
            <h2 id="statistics-title" className="text-2xl font-semibold text-white">How to track Monero mining statistics</h2>
            <p className="mt-4">Use your device and the public pool dashboard together. They measure different parts of the mining process.</p>
            <dl className="mt-5 space-y-5">
              <div><dt className="font-semibold text-white">Your miner&apos;s status page</dt><dd>Check local hashrate, active pool, accepted and rejected work, uptime, temperatures, and firmware errors where available. This is the first place to verify your own device.</dd></div>
              <div><dt><Link prefetch={false} href="/dashboard" className="font-semibold text-yellow-300 underline underline-offset-4">MineBench live dashboard</Link></dt><dd>Review public aggregate pool statistics and activity. These totals do not show your personal XMR balance, individual worker history, or payout transaction history.</dd></div>
              <div><dt><a href={DISCORD_URL} className="font-semibold text-yellow-300 underline underline-offset-4">Payout status and policy support</a></dt><dd>Ask MineBench support to confirm the active payout route, service availability, minimum, fees, and the appropriate channel for wallet-specific follow-up.</dd></div>
              <div><dt className="font-semibold text-white">Your Monero wallet</dt><dd>Let your wallet synchronize and check received transfers for actual XMR payment. A receipt to MineBench is separate from a payout to your wallet.</dd></div>
            </dl>
            <p className="mt-5">Personal direct-XMR worker history, balances, and wallet-address lookup are not available through the public dashboard.
              Use the device status and your own wallet, and contact support for a payout investigation.
              Pool-side averages can differ from local hashrate because they use accepted work over time.
              Check freshness and error indicators before interpreting an empty chart as zero activity.</p>
          </section>
          <section id="advantages" className="scroll-mt-36" aria-labelledby="advantages-title">
            <h2 id="advantages-title" className="text-2xl font-semibold text-white">Why use the MineBench pool?</h2>
            <ul className="mt-5 list-disc space-y-4 pl-6">
              <li><strong className="text-white">Inspect public pool activity.</strong> The dashboard provides aggregate pool statistics. Review current activity and confirm connection and payout terms with support before choosing where to direct your miner.</li>
              <li><strong className="text-white">Keep rewards understandable.</strong> XMR received by the pool, BMT credited, and completed BMT transfers are separate states, so one counter does not imply every payment has finished.</li>
              <li><strong className="text-white">Use your own hardware configuration.</strong> Compatible standalone miners can specify the Stratum endpoint and XMR payout login in their firmware. The desktop client is a separate option for CPU benchmarking and mining.</li>
              <li><strong className="text-white">Compare CPU measurements.</strong> The <Link prefetch={false} href="/leaderboard" className="text-yellow-300 underline underline-offset-4">hardware leaderboard</Link> provides submitted benchmark context. Results come from different conditions and do not certify an ASIC model or predict income.</li>
              <li><strong className="text-white">Get help in one community.</strong> MineBench Discord is the existing support channel for configuration questions and payout follow-up.</li>
            </ul>
          </section>
          <section id="payouts" className="scroll-mt-36" aria-labelledby="payouts-title">
            <h2 id="payouts-title" className="text-2xl font-semibold text-white">How Monero pool payouts work</h2>
            <p className="mt-4">Standalone miners using an XMR wallet login follow the direct-XMR reward route.
              MineBench&apos;s documented design is custodial: P2Pool first pays the MineBench pool wallet,
              then MineBench accounts for eligible work and sends a separate XMR payment to the miner&apos;s address.
              P2Pool does not pay every downstream miner directly in this setup.</p>
            <figure className="mt-6">
              <Image
                src="/img/guides/monero-xmr-payout-flow.svg"
                alt="XMR payout diagram: eligible work, P2Pool receipt to MineBench, miner balance after fees, and a separate transfer to the miner wallet."
                width={600}
                height={900}
                loading="lazy"
                unoptimized
                className="mx-auto h-auto w-full max-w-md"
              />
              <figcaption className="mt-3 text-sm leading-6 text-zinc-400">
                The pool receipt, balance credit, and transfer to your wallet are separate stages.
                Active payout terms and eligibility still apply.
              </figcaption>
            </figure>
            <ol className="mt-5 list-decimal space-y-4 pl-6">
              <li><strong className="text-white">Work is verified.</strong> A Stratum acceptance is a connection/work signal. Reward attribution requires verified work eligible for the relevant P2Pool share window.</li>
              <li><strong className="text-white">The pool receives XMR.</strong> P2Pool uses a PPLNS (Pay Per Last N Shares) window. A block must produce an eligible, confirmed receipt to the MineBench wallet; local hashrate alone creates no fixed reward.</li>
              <li><strong className="text-white">The miner balance is credited.</strong> MineBench applies the fee policy recorded for that reward and allocates the eligible net XMR contribution to the miner&apos;s wallet balance. A balance credit is still distinct from a wallet transfer.</li>
              <li><strong className="text-white">An eligible payout is sent.</strong> When automatic XMR payouts are active, the payout service requires the configured minimum and fee conditions plus sufficient unlocked funds. A submitted transfer must then reach its required network confirmation state.</li>
            </ol>
            <h3 className="mt-7 text-lg font-semibold text-white">Fees, minimum payout, and timing</h3>
            <p className="mt-3">Pool fees and Monero transaction fees are separate costs. Ask support for the active pool percentage,
              minimum net XMR transfer, who covers the network fee, and whether direct payouts are currently active.
              This guide does not publish a fixed rate or threshold because live terms have not been verified.</p>
            <p className="mt-4">P2Pool window eligibility, block discovery, receipt confirmation, fund unlocking, payout processing,
              and the receiving wallet&apos;s synchronization can all affect when you see XMR.
              There is no verified hourly or daily payment promise here. If a payout appears delayed,
              collect the mining period and device logs and use the support steps below.</p>
            <h3 className="mt-7 text-lg font-semibold text-white">XMR hardware mining and BMT client rewards</h3>
            <p className="mt-3">An XMR wallet login identifies the XMR payout route. The desktop client&apos;s BMT mode uses its authenticated
              Solana identity and a separate conversion and claim flow.
              A Solana address is not a Monero payout address. Do not combine the two identities in a hardware miner login.
              <Link prefetch={false} href="/premium" className="ml-1 text-yellow-300 underline underline-offset-4">Premium</Link> concerns custom wallet and pool controls inside the desktop app.</p>
          </section>
          <section id="troubleshooting" className="scroll-mt-36" aria-labelledby="troubleshooting-title">
            <h2 id="troubleshooting-title" className="text-2xl font-semibold text-white">Troubleshoot a Monero pool connection</h2>
            <dl className="mt-5 space-y-5">
              <div><dt className="font-semibold text-white">Connection refused, timeout, or DNS error</dt><dd>Recheck the host and port, the miner&apos;s network connection, DNS, and outbound firewall rules. Confirm pool availability with support if it persists. The mining URL is not an HTTPS website URL.</dd></div>
              <div><dt className="font-semibold text-white">Login or wallet rejected</dt><dd>Paste your own 95-character mainnet XMR address again. Remove spaces, payment IDs, extra wallet addresses, and worker suffixes. Use a separate Rig ID only if supported.</dd></div>
              <div><dt className="font-semibold text-white">Local hashrate but no accepted work</dt><dd>Verify current Monero RandomX support, check the active pool slot, and read the device error messages. Check that SSL/TLS is disabled for the plain Stratum example. A different algorithm cannot be fixed by changing only the pool address.</dd></div>
              <div><dt className="font-semibold text-white">Rejected or stale shares increase</dt><dd>Check connection stability, latency, firmware errors, clock settings, and temperatures. A share can become stale when the job changes before submission. Record the exact rejection text and avoid unsupported tuning changes.</dd></div>
              <div><dt className="font-semibold text-white">Pool chart or payout does not match expectations</dt><dd>Compare the same time range, check the page&apos;s last update, and separate pool totals from your device&apos;s work. An accepted Stratum share, an XMR receipt to MineBench, and a transfer to your wallet are different events.</dd></div>
            </dl>
          </section>
          <section id="support" className="scroll-mt-36 rounded-xl border border-white/10 bg-white/[0.03] p-6" aria-labelledby="support-title">
            <h2 id="support-title" className="text-2xl font-semibold text-white">Get Monero miner setup and payout support</h2>
            <p className="mt-4">Use the MineBench Discord linked from the official website. For a useful first report, include:</p>
            <ul className="mt-4 list-disc space-y-2 pl-6">
              <li>Miner model, firmware version, and selected algorithm.</li>
              <li>Pool host and port, active pool slot, and optional rig label.</li>
              <li>Exact error message, mining period with timezone, and accepted/rejected counts.</li>
              <li>For statistics issues, the page, time range, and visible last-update time.</li>
              <li>For payout questions, when you mined and whether your own wallet has finished syncing.</li>
            </ul>
            <p className="mt-4">Redact wallet addresses, network details, and credentials from public screenshots.
              Never send seed phrases, private keys, wallet passwords, remote-access credentials, or API tokens.
              If wallet-specific investigation is necessary, arrange the appropriate support channel before sharing details.</p>
            <a href={DISCORD_URL} className="btn-primary mt-6">Open MineBench Discord</a>
          </section>
          <section id="faq" className="scroll-mt-36" aria-labelledby="faq-title">
            <h2 id="faq-title" className="text-2xl font-semibold text-white">Monero ASIC pool setup FAQ</h2>
            <div className="mt-5 divide-y divide-white/10">
              {FAQS.map(({ question, answer }) => <details key={question} className="py-4">
                <summary className="min-h-10 cursor-pointer py-2 font-medium text-white">{question}</summary>
                <p className="mt-3">{answer}</p>
              </details>)}
            </div>
          </section>
          <section className="border-t border-white/10 pt-8" aria-labelledby="related-title">
            <h2 id="related-title" className="text-xl font-semibold text-white">Related mining guides</h2>
            <ul className="mt-4">
              <li><Link prefetch={false} href="/guides/randomx-benchmarking" className="inline-flex min-h-10 items-center text-yellow-300 underline underline-offset-4">Run a RandomX CPU benchmark</Link></li>
              <li><Link prefetch={false} href="/guides/measure-hashrate-per-watt" className="inline-flex min-h-10 items-center text-yellow-300 underline underline-offset-4">Measure hashrate per watt</Link></li>
              <li><Link prefetch={false} href="/guides/mining-profitability-calculator" className="inline-flex min-h-10 items-center text-yellow-300 underline underline-offset-4">Check mining profitability inputs</Link></li>
            </ul>
          </section>
        </article>
      </div>
    </main>
    <Footer />
  </>;
}
