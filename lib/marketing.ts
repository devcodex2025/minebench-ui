export const PREMIUM_PRICE_USDC = 29;

export const HOME_FAQS = [
  {
    question: 'What is MineBench?',
    answer: 'MineBench is a desktop mining benchmark client with a public CPU and GPU leaderboard. Use it to measure your hardware, compare submitted results, and view live mining pool activity.',
  },
  {
    question: 'Can I try MineBench for free?',
    answer: 'Yes. Download the free client and browse the public leaderboard and dashboard. Premium is an optional upgrade for custom Monero wallet routing and pool selection.',
  },
  {
    question: 'Which operating systems can I download it for?',
    answer: 'Windows and Linux builds are listed on the downloads page. Choose a file that matches your operating system and architecture. Only builds available for the selected release are shown.',
  },
  {
    question: 'How should I compare benchmark results?',
    answer: 'The leaderboard shows the highest submitted positive average hashrate for each device name. Results come from different systems and settings. Check the algorithm, power and temperature data before comparing; a ranking is not a controlled lab test or an earnings forecast.',
  },
] as const;

export const PREMIUM_FAQS = [
  {
    question: 'How much does MineBench Premium cost?',
    answer: `Premium costs ${PREMIUM_PRICE_USDC} USDC as a one-time payment on Solana. SOL network fees are additional. The upgrade has no expiry and does not set up a recurring subscription.`,
  },
  {
    question: 'Can I keep using the free client?',
    answer: 'Yes. Premium is optional. You can download the free client, run benchmarks, and browse public results before deciding whether you need the extra mining controls.',
  },
  {
    question: 'What do I need before upgrading?',
    answer: `Use a Solana wallet containing ${PREMIUM_PRICE_USDC} USDC and enough SOL for network fees. The current checkout checks for at least 0.005 SOL; that is a balance requirement, not a fixed fee. Connecting a wallet does not authorize payment: you review the transaction in your wallet.`,
  },
  {
    question: 'Can I mine to my own Monero wallet or choose another pool?',
    answer: 'Premium adds custom Monero wallet routing and P2Pool or custom Stratum pool settings in the desktop client. Payout timing and conditions depend on the pool you choose.',
  },
  {
    question: 'Do I need Premium to tune CPU settings?',
    answer: 'No. Thread count, CPU priority, huge pages, and automatic, fast or light RandomX memory modes are available in the free client. Premium adds custom wallet and pool settings. The effect of each setting depends on your hardware and operating system.',
  },
  {
    question: 'What happens after I upgrade?',
    answer: 'Once payment is confirmed and your wallet is marked Premium, use that Solana wallet in the desktop client. Save your Monero wallet settings and restart the miner to apply the changes. If activation does not appear, contact the MineBench Discord before paying again.',
  },
] as const;
