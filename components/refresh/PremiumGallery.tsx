import ScreenshotCarousel from '@/components/reactbits/ScreenshotCarousel';

import wallet from '@/public/screenshots/premium/wallet-and-pool.png';
import pool from '@/public/screenshots/premium/pool-selection.png';
import stratum from '@/public/screenshots/premium/custom-stratum.png';

const screenshots = [
  { src: wallet.src, width: wallet.width, height: wallet.height, alt: 'MineBench Premium wallet and pool settings' },
  { src: pool.src, width: pool.width, height: pool.height, alt: 'MineBench Premium pool selection' },
  { src: stratum.src, width: stratum.width, height: stratum.height, alt: 'MineBench Premium custom Stratum settings' },
];

export default function PremiumGallery() {
  return <ScreenshotCarousel items={screenshots}/>;
}
