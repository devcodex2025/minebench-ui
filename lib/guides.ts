export type Guide = {
  slug: string;
  title: string;
  description: string;
  summary: string;
  publishedAt: string;
  updatedAt: string;
  image: { src: string; socialSrc?: string; width: number; height: number; alt: string; caption: string };
  relatedLinks?: Array<{ href: string; label: string }>;
  sections: Array<{ heading: string; paragraphs: string[]; steps?: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const GUIDES: Guide[] = [
  {
    slug: 'randomx-benchmarking',
    title: 'RandomX CPU Benchmark: How to Test Monero Hashrate',
    description: 'Run a repeatable RandomX CPU benchmark for Monero. Record sustained H/s, threads, memory, temperature and power, then compare like-for-like results.',
    summary: 'A useful RandomX CPU benchmark records sustained hashes per second (H/s) under repeatable conditions. This guide shows how to prepare a Monero benchmark, record the settings and compare your result without mistaking a short peak for stable performance.',
    publishedAt: '2026-10-02',
    updatedAt: '2026-10-19',
    image: {
      src: '/img/guides/randomx-cpu-workbench.webp', width: 1280, height: 720,
      alt: 'Illustration of a cooled desktop CPU on a benchmark workbench',
      caption: 'Illustrative CPU test setup. Record the actual hardware, software settings, sustained hashrate and measurement interval for your own run.',
    },
    relatedLinks: [
      { href: '/downloads', label: 'Get the official MineBench client' },
      { href: '/leaderboard', label: 'Compare public CPU benchmark results' },
      { href: 'https://www.getmonero.org/get-started/mining/', label: 'Read Monero’s official mining overview' },
    ],
    sections: [
      {
        heading: 'What a RandomX benchmark measures',
        paragraphs: [
          'RandomX is a proof-of-work algorithm used by Monero. RandomX mining repeatedly computes candidate proofs, while a CPU mining benchmark reports how many hashes the processor completes per second under the selected settings. It does not measure a guaranteed return or prove that a configuration is optimal for every workload.',
          'For a useful comparison, keep the benchmark duration, power profile, cooling conditions, operating system and miner settings visible. Results from different conditions should be treated as directional rather than identical laboratory measurements.'
        ]
      },
      {
        heading: 'What is a good CPU mining hashrate?',
        paragraphs: [
          'There is no single good CPU mining hashrate. The useful baseline is a sustained result from the same RandomX algorithm on the same processor model, with a similar thread count, memory setup, power limit and test duration. A number from another algorithm or a short peak is not a like-for-like comparison.',
          'Miner software such as XMRig can also report RandomX hashrate, but software version, configuration and measurement interval can change the result. Treat third-party XMRig benchmark data as separate unless the algorithm and test conditions match; this comparison does not imply that MineBench supports or bundles a particular third-party miner.'
        ]
      },
      {
        heading: 'Run a repeatable benchmark',
        paragraphs: ['Start from a stable machine and record enough context for another miner to interpret the result.'],
        steps: [
          'Download the MineBench client from the official downloads page and confirm the release matches your operating system.',
          'Close workload-heavy applications and choose a resource limit that is safe for the machine and its cooling.',
          'Choose a fixed warm-up and measurement duration. Let temperature and hashrate settle, then record the sustained average rather than the first peak.',
          'Record the exact CPU model, active threads, memory configuration, operating system, miner version, benchmark duration, temperature and power data when available.',
          'Repeat the run after a settings change instead of comparing a single short sample.',
          'Compare the submitted result with similar hardware on the public leaderboard and note differences in system configuration.'
        ]
      },
      {
        heading: 'Record the algorithm, units and test conditions',
        paragraphs: [
          'Write down the exact RandomX variant reported by the miner. A Monero result should not be compared with a different coin’s RandomX variant or another proof-of-work algorithm. Convert units before comparing: 1 kH/s equals 1,000 H/s.',
          'Keep a simple run record: date, CPU model, memory, active threads, software version, algorithm, warm-up duration, measurement duration, average H/s and temperatures. If you measure watts, note whether the reading covers the CPU package or the complete system at the wall.',
          'Run the same settings more than once before tuning. Then change one setting and repeat the same procedure. A repeatable increase is more useful than an isolated maximum.',
        ],
      },
      {
        heading: 'Use public results carefully',
        paragraphs: [
          'The MineBench leaderboard is a public comparison surface, not a controlled laboratory ranking. Hardware names, cooling, memory, operating-system settings and miner configuration can all affect results.',
          'Use the comparison to form a hypothesis, then verify it on your own hardware. Do not use a public benchmark alone to estimate profitability; electricity cost, pool conditions, fees and uptime matter separately.'
        ]
      },
      {
        heading: 'Increase CPU mining hashrate safely',
        paragraphs: [
          'Start by finding the cause of a low or falling hashrate. Check sustained temperature, thermal throttling, background load, memory configuration, thread count and power limits one variable at a time. Repeat the same benchmark after each change so the comparison remains useful.',
          'A higher setting can increase heat and power draw without improving sustained work. Stop when temperatures or system stability leave the hardware manufacturer’s supported range. CPU mining and GPU mining can also compete for shared cooling and system power even though they use different processors.'
        ]
      },
      {
        heading: 'Can CPU mining damage a computer?',
        paragraphs: [
          'CPU mining creates a sustained processor load. Adequate cooling, supported power settings, clean airflow and temperature monitoring reduce risk, while overheating, unstable tuning and worn cooling components can shorten hardware life or cause shutdowns. No benchmark can certify that a device is safe under every configuration.',
          'Use an opt-in resource limit, watch sustained temperatures and stop the workload if the machine throttles, crashes or exceeds the limits published by its hardware manufacturer.'
        ]
      }
    ],
    faqs: [
      { question: 'How do I benchmark a CPU for Monero mining?', answer: 'Use a benchmark that reports the Monero RandomX variant, allow a consistent warm-up, and record sustained H/s over a fixed measurement interval. Keep the CPU, memory, active threads, software version and cooling settings with the result, then repeat the run.' },
      { question: 'Does a higher RandomX hashrate guarantee higher earnings?', answer: 'No. Hashrate is one input. Electricity cost, pool conditions, fees, uptime and reward rules also affect any outcome.' },
      { question: 'Why can the same CPU produce different results?', answer: 'Cooling, memory, operating system, thread settings, background load and benchmark duration can all change a measured result.' },
      { question: 'How do I know whether a CPU miner is working?', answer: 'Look for a sustained non-zero hashrate, accepted work reported by the service in use, stable temperatures and the absence of repeated errors. A momentary peak alone does not confirm stable operation.' },
      { question: 'Is CPU mining better than GPU mining?', answer: 'It depends on the algorithm, hardware, energy use and objective. Compare results only for the same workload; RandomX is designed around general-purpose CPUs, while other algorithms can favor GPUs.' },
      { question: 'Can CPU mining damage a CPU?', answer: 'Sustained load creates heat and wear. Operate within manufacturer limits, maintain cooling, avoid unstable tuning and stop if the system overheats, throttles or becomes unstable.' }
    ]
  },
  {
    slug: 'measure-hashrate-per-watt',
    title: 'Hashrate per Watt: Measure Mining Efficiency (H/s/W)',
    description: 'Calculate H/s per watt from sustained hashrate and measured power. Compare wall and chip readings, convert units, and test two mining settings fairly.',
    summary: 'Divide sustained hashrate by watts measured during the same interval to calculate mining efficiency in H/s/W. Keep the algorithm and power measurement boundary consistent: a CPU-only sensor reading and whole-system wall power describe different costs.',
    publishedAt: '2026-10-02',
    updatedAt: '2026-10-19',
    image: {
      src: '/img/guides/hashrate-per-watt.svg', socialSrc: '/img/guides/hashrate-per-watt.webp', width: 600, height: 760,
      alt: 'Worked efficiency example: 6,000 H/s at 240 W is 25 H/s/W; 5,400 H/s at 180 W is 30 H/s/W',
      caption: 'Illustrative settings on the same algorithm and wall-power boundary. Setting B has lower hashrate but completes more hashes per watt.',
    },
    relatedLinks: [
      { href: '/guides/randomx-benchmarking', label: 'Prepare a repeatable RandomX benchmark' },
      { href: '/guides/mining-profitability-calculator', label: 'Convert measured watts into an electricity-cost scenario' },
    ],
    sections: [
      {
        heading: 'Calculate hashrate per watt',
        paragraphs: [
          'Hashrate per watt = sustained hashrate ÷ measured watts. For example, a machine producing 1,000 H/s while drawing 100 W has an observed efficiency of 10 H/s/W for that test.',
          'Use an average from a stable interval rather than a momentary peak. If the power reading includes the whole computer, label it that way; it cannot be compared directly with a CPU-only measurement.'
        ]
      },
      {
        heading: 'Worked example: fewer hashes, better efficiency',
        paragraphs: [
          'Consider two illustrative settings on the same machine and algorithm. Setting A averages 6,000 H/s at 240 W: 6,000 ÷ 240 = 25 H/s/W. Setting B averages 5,400 H/s at 180 W: 5,400 ÷ 180 = 30 H/s/W.',
          'Setting B produces 10% less hashrate while using 25% less power, so its hashrate per watt is 20% higher. That makes B more efficient in this comparison; deciding which setting earns more also needs a separate reward and electricity-cost scenario.',
          'Normalize the units first. A reading of 6 kH/s is 6,000 H/s, not 6 H/s. Keep CPU and GPU results separate when they use different algorithms.',
        ],
      },
      {
        heading: 'Collect a comparable measurement',
        paragraphs: ['A trustworthy comparison documents where the number came from and what it includes.'],
        steps: [
          'Record the processor or GPU, operating system, memory, cooling profile and miner settings.',
          'Allow the system to reach stable temperature before recording hashrate and power.',
          'Use the same meter boundary for every run: whole-system wall power or a clearly defined component reading.',
          'Run more than once and retain the average, range and test duration.',
          'Compare only results with a similar algorithm and power-measurement boundary.'
        ]
      },
      {
        heading: 'Choose a mining watt meter boundary',
        paragraphs: [
          'A plug-in watt meter measures the whole machine at the wall, including conversion losses, memory, fans and storage. A software sensor may estimate only CPU or GPU package power. Both readings can be useful, but they answer different questions and should be labelled clearly.',
          'For operating-cost estimates, whole-system wall power is usually the more complete input. For tuning one component, a package-power reading can help compare settings as long as every run uses the same sensor and boundary.',
          'If you subtract idle power to study the extra load from mining, label the result as incremental power. It excludes the rest of the system’s energy use and is not the total electricity bill.'
        ]
      },
      {
        heading: 'Why mining electricity use changes',
        paragraphs: [
          'Mining performs continuous computation, so the processor can remain under sustained load instead of returning to an idle state. Electricity use depends on the active hardware, voltage and clock settings, cooling, power-supply efficiency and how much of the system the measurement includes.',
          'Do not compare hashrate per watt across different algorithms as if the work were identical. Use the same algorithm, measurement boundary and stable interval, then compare both hashrate and watts.'
        ]
      },
      {
        heading: 'Separate efficiency from profitability',
        paragraphs: [
          'An efficient configuration can still be unprofitable when electricity is expensive or network and pool conditions change. A profitability calculation also needs current reward value, pool fees, infrastructure costs and the local energy rate.',
          'MineBench publishes benchmark and pool information to help users inspect the system. It does not make earnings guarantees, and users should choose resource limits that are safe for their hardware.'
        ]
      }
    ],
    faqs: [
      { question: 'How do I calculate H/s per watt?', answer: 'Divide sustained hashes per second by watts measured over the same stable interval. A result of 6,000 H/s at 240 W is 25 H/s/W. Compare only the same algorithm and power measurement boundary.' },
      { question: 'Should I use peak or average hashrate?', answer: 'Use sustained average hashrate from a stable test interval. Peaks are useful diagnostics but are not a reliable efficiency baseline.' },
      { question: 'Can I compare wall power with chip-only power?', answer: 'Not directly. Label the measurement boundary and compare like with like.' },
      { question: 'What is the best hashrate per watt?', answer: 'The larger result is more efficient only when the algorithm, hardware scope, power boundary and test interval are comparable. There is no universal best value across different workloads.' },
      { question: 'How do I convert watts into electricity cost?', answer: 'Multiply watts by operating hours, divide by 1,000 to get kilowatt-hours, then multiply by the electricity price per kilowatt-hour.' }
    ]
  },
  {
    slug: 'mining-profitability-calculator',
    title: 'Mining Profitability Calculator: Check Inputs and Costs',
    description: 'Check mining calculator inputs with measured CPU hashrate, wall power, electricity price, fees and uptime. Follow an illustrative daily-cost calculation.',
    summary: 'Build a mining profitability scenario from measured hashrate, wall power, electricity price, uptime and a separately verified gross reward estimate. This guide explains the inputs and arithmetic; it does not provide a live earnings calculator or a current reward quote.',
    publishedAt: '2026-10-02',
    updatedAt: '2026-10-19',
    image: {
      src: '/img/guides/profitability-inputs.svg', socialSrc: '/img/guides/profitability-inputs.webp', width: 600, height: 760,
      alt: 'Illustrative mining cost calculation: 240 W for 20 hours costs $0.96 at $0.20 per kWh; $1.50 gross less $0.03 fees leaves $0.51 before other costs',
      caption: 'Hypothetical USD arithmetic, not current network data or MineBench earnings. The $1.50 gross input already assumes the illustrated 20-hour period.',
    },
    relatedLinks: [
      { href: '/guides/randomx-benchmarking', label: 'Measure sustained CPU hashrate first' },
      { href: '/guides/measure-hashrate-per-watt', label: 'Check the wall-power measurement boundary' },
      { href: '/guides/monero-hardware-pool-setup#payouts', label: 'Understand XMR receipt, balance credit and payout stages' },
    ],
    sections: [
      {
        heading: 'What a mining profitability calculator needs',
        paragraphs: [
          'A mining profitability calculator needs a sustained hashrate, a clear power measurement, an electricity price, pool or service fees, expected uptime and current network conditions. Leaving out any of these inputs can make an estimate look more certain than it is.',
          'Use averages from a stable benchmark rather than peak readings. Network conditions and asset prices change, so an estimate should be treated as a scenario, not a promise of earnings.'
        ]
      },
      {
        heading: 'Calculate CPU hashrate and energy cost',
        paragraphs: [
          'CPU hashrate is measured in hashes per second. Use the sustained average reported during a stable benchmark rather than attempting to infer it from processor clock speed. AMD, Intel, Ryzen and Xeon systems all use the same unit, but their results depend on the specific model, memory, settings and algorithm.',
          'Calculate energy use with kilowatt-hours = watts ÷ 1,000 × operating hours. Then calculate electricity cost with energy cost = kilowatt-hours × price per kilowatt-hour. Use whole-system wall power when the goal is to estimate the cost of operating the complete machine.'
        ]
      },
      {
        heading: 'Work through a daily mining-cost example',
        paragraphs: [
          'These numbers demonstrate the arithmetic in USD; they are not a current reward forecast. A system drawing 240 W for 20 hours uses 240 ÷ 1,000 × 20 = 4.8 kWh. At $0.20 per kWh, the electricity cost is $0.96 for that period.',
          'Suppose a separate gross reward estimate for those same 20 hours is $1.50 before a 2% fee. The fee is $0.03, leaving $1.50 − $0.03 − $0.96 = $0.51 before cooling, maintenance, hardware and any other costs. Do not deduct a fee again if the gross estimate already includes it.',
          'Align every input to the same period. A 24-hour gross estimate needs an uptime adjustment before comparison with 20 hours of electricity use. Include off-period or idle energy separately if the machine remains powered on.',
        ],
      },
      {
        heading: 'Collect CPU mining calculator inputs',
        paragraphs: ['For CPU mining, document the test setup so you can repeat or revise the estimate later.'],
        steps: [
          'Run a repeatable CPU mining benchmark and record sustained hashrate, not a short peak.',
          'Measure power at a clearly labelled boundary, such as whole-system wall power.',
          'Enter your local electricity tariff, including relevant delivery or time-of-use charges.',
          'Check pool or service fees and use a realistic uptime assumption.',
          'Recheck the inputs when hardware settings, reward conditions or electricity prices change.'
        ]
      },
      {
        heading: 'Use hashrate calculator results responsibly',
        paragraphs: [
          'A hashrate calculator can help compare scenarios, but it cannot predict a fixed return. Cooling, throttling, maintenance, network difficulty, fees and market movement can make real-world results differ from a model.',
          'MineBench provides public benchmark context and opt-in mining controls. Review the measured data and your device limits before choosing any resource level.'
        ]
      },
      {
        heading: 'Compare CPU and GPU mining calculator scenarios',
        paragraphs: [
          'A CPU/GPU mining calculator comparison is meaningful only when each device is evaluated on a workload it can run and with its own measured hashrate and wall power. Do not reuse a RandomX CPU hashrate as a GPU input or compare raw hashrates from different algorithms.',
          'For each scenario, use net estimate = gross reward estimate − electricity cost − pool and service fees. Hardware purchase cost, maintenance, cooling and downtime are separate costs that may also need to be included.'
        ]
      }
    ],
    faqs: [
      { question: 'Does this page calculate live mining earnings?', answer: 'No. This is an input and arithmetic guide. The worked example uses hypothetical values; obtain current network and reward inputs separately and document their source and time before estimating earnings.' },
      { question: 'Is a profitability estimate a guarantee of mining earnings?', answer: 'No. It is a scenario based on changing inputs such as hashrate, power cost, uptime, fees and network conditions.' },
      { question: 'What should I use for CPU hashrate?', answer: 'Use a sustained average from a repeatable benchmark under documented cooling, power and software settings.' },
      { question: 'Is CPU mining profitable?', answer: 'Profitability depends on the current gross reward estimate minus electricity, fees, cooling, maintenance and downtime. Recalculate when prices, network conditions or hardware settings change.' },
      { question: 'Can one calculator compare Ryzen, Xeon and Intel CPUs?', answer: 'Yes, if it uses a measured hashrate and power draw for each exact system under the same algorithm. The processor family name alone is not enough to estimate performance.' },
      { question: 'Can a RandomX calculator predict future income?', answer: 'No. It can model a scenario from current inputs, but network conditions, reward value, fees, uptime and hardware performance can change.' }
    ]
  },
  {
    slug: 'verify-minebench-download',
    title: 'Verify a MineBench Download: Source, Release and File Checks',
    description: 'Check the official MineBench download source, release version and platform. Compare published checksums when available and investigate security warnings.',
    summary: 'Start at the official MineBench downloads page, confirm the release and platform, then inspect the downloaded file before installation. If the release publishes checksums or signatures, verify them against the official release information. A familiar filename alone does not establish authenticity.',
    publishedAt: '2026-10-02',
    updatedAt: '2026-10-19',
    image: {
      src: '/img/guides/verify-download-checklist.svg', socialSrc: '/img/guides/verify-download-checklist.webp', width: 600, height: 760,
      alt: 'Download verification checklist: official source, matching release and platform, published integrity checks, then review warnings and permissions',
      caption: 'A verification process, not a certification badge. Check what the current official release actually publishes before trusting a file.',
    },
    relatedLinks: [
      { href: '/downloads', label: 'Open the official MineBench downloads page' },
      { href: '/guides/randomx-benchmarking', label: 'Prepare your first CPU benchmark' },
    ],
    sections: [
      {
        heading: 'Get the correct release',
        paragraphs: [
          'Use the MineBench downloads page as the source of truth for current release assets. Select an installer or package that matches your operating system and architecture; do not rely on links copied from unofficial posts or direct messages.',
          'Before opening a downloaded file, check its filename and the publisher information supplied by your operating system. Keep the original download location so you can inspect or remove the file later.'
        ]
      },
      {
        heading: 'Compare a published checksum or signature',
        paragraphs: [
          'If the official release publishes a SHA-256 checksum for the exact file, compute the downloaded file’s SHA-256 digest with a trusted local tool and compare the entire value. A mismatch means the file is not the published artifact: stop and obtain a fresh copy through the official downloads page.',
          'A checksum confirms that two byte sequences match; a checksum supplied alongside a file by an untrusted sender does not establish who published either one. If the release provides a digital signature, follow its documented verification steps and confirm the signing identity through the official source.',
          'This guide does not establish that every current MineBench asset has a published checksum, digital signature or operating-system publisher signature. When verification information is missing or the signing identity is unfamiliar, ask support before granting additional permissions.',
        ],
      },
      {
        heading: 'Understand antivirus warnings',
        paragraphs: [
          'Security tools may flag mining software because it performs work that malware also abuses. A warning is not proof that a file is safe, and it should not be dismissed automatically.',
          'Review the source, release information and permissions requested. If anything differs from the official release, stop the installation and ask in the MineBench community before proceeding.'
        ]
      },
      {
        heading: 'Check mining software before you trust it',
        paragraphs: [
          'A legitimate-looking filename is not proof of origin. Confirm that the browser address is the official MineBench domain, follow the current release link from the downloads page and avoid installers shared through advertisements, direct messages or unofficial mirrors.',
          'Unexpected background mining, disabled security tools, unknown administrator requests or a wallet seed-phrase prompt are warning signs. Stop the process, disconnect the file from use and investigate before granting more permissions.'
        ]
      },
      {
        heading: 'Install with informed controls',
        paragraphs: ['MineBench mining is opt-in. Configure only a resource level that you understand and that is safe for your hardware.'],
        steps: [
          'Install the release for your platform from the official downloads page.',
          'Review the client settings before starting a benchmark or mining session.',
          'Connect a wallet only when you are ready to use reward-related features; never share a seed phrase or private key.',
          'Run a benchmark first, inspect the visible result and then decide whether to start a mining session.',
          'Use the operating system uninstall flow if you no longer want the client on the device.'
        ]
      }
    ],
    faqs: [
      { question: 'Does a matching checksum prove a download is safe?', answer: 'It shows that the file matches the checksum you checked. The checksum must come from a trusted official source, and matching bytes alone do not establish that software is harmless. Review the release, signing information when provided, permissions and security warnings too.' },
      { question: 'Where should I download MineBench?', answer: 'Use the official MineBench downloads page, which lists the currently available release assets.' },
      { question: 'Should I disable antivirus to install mining software?', answer: 'Do not disable security controls blindly. Verify the official release and investigate any warning before taking action.' },
      { question: 'Is MineBench free CPU mining software?', answer: 'Check the current downloads and pricing pages for the available client, platform support and current terms. Do not rely on an old third-party listing for product details.' },
      { question: 'Does MineBench support Windows CPU mining?', answer: 'Use the official downloads page to confirm the currently supported operating systems and release packages before installation.' },
      { question: 'Will MineBench ever ask for my seed phrase?', answer: 'No legitimate installation or support flow should require your wallet seed phrase or private key. Never share either one.' }
    ]
  }
];

export const GUIDE_BY_SLUG = Object.fromEntries(GUIDES.map((guide) => [guide.slug, guide]));
