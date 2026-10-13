import Image from 'next/image';
import Link from '@/components/refresh/WorkspaceLink';
import { ArrowUpRight } from 'lucide-react';
import CookieSettingsButton from '@/components/analytics/CookieSettingsButton';
export default function Footer() {
  return <footer className="refresh-footer">
    <div className="refresh-footer-top"><div><Link href="/" className="refresh-brand"><Image src="/img/minebench-logo-yellow.png" alt="" width={44} height={44}/><span>Mine<span>Bench</span></span></Link><p>Know your hardware.<br/>Mine with confidence.</p></div>
      <div><span className="refresh-nav-label">THE PLATFORM</span>{[['Dashboard','/dashboard'],['Hardware leaderboard','/leaderboard'],['Pool rewards','/pool-rewards'],['Transactions','/transactions'],['Conversions','/conversions']].map(([label,path])=><Link key={path} href={path}>{label}</Link>)}</div>
      <div><span className="refresh-nav-label">GET STARTED</span>{[['DePIN architecture','/depin'],['MineBench IQ','/minebench-iq'],['Mining benchmark guides','/guides'],['Download client','/downloads'],['Free vs. Premium','/premium#compare-plans'],['Whitepaper','/whitepaper']].map(([label,path])=><Link key={path} href={path}>{label}</Link>)}</div>
      <div><span className="refresh-nav-label">STAY CONNECTED</span>{[['Discord','https://discord.gg/vsDyYh4rma'],['X / Twitter','https://x.com/MineBenchdapp'],['Source on Bitbucket','https://bitbucket.org/minebenchapp/minebench-client'],['BMT on pump.fun','https://pump.fun/coin/67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev']].map(([label,path])=><a key={path} href={path} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={13}/></a>)}</div>
    </div>
    <div className="refresh-footer-bottom"><span>© {new Date().getFullYear()} MineBench</span><span>Monero mining. Solana rewards.</span><span>xmr.minebench.cloud:3334</span><span><CookieSettingsButton /></span></div>
    <p className="refresh-contract">BMT / 67ipDsgK6D7bqTW89H8T1KTxUvVuaFy92GX7Q2XFVdev</p>
  </footer>;
}
